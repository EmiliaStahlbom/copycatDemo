from itertools import islice
import math
import re
from typing import Sequence
from pathlib import Path
from numpy import mean, median, mod

import pandas as pd
import pysam

from copycat.common import CNV_calls_to_api, parse_id, chromosomeName

def parse_cnvs(calls_file_path) -> Sequence[dict]:
    calls_file = pd.read_csv(calls_file_path, delimiter="\t", comment="@")
 
    calls_under_1000000 = calls_file.query("end - start < 1000_000")
    weights = calls_under_1000000["weight"]

    sorted_weights = weights.sort_values(ascending=False)
    number_of_top_calls = 20
    if(len(sorted_weights) >= number_of_top_calls - 1):
        number_of_top_calls = len(sorted_weights)-1
    else: 
        
        number_of_top_calls = len(sorted_weights)-1
    weight_threshold = sorted_weights.iat[number_of_top_calls]
    if(len(sorted_weights) < 101):
        median_weight = sorted_weights.iat[len(sorted_weights)-1]
        number_of_top_calls = len(sorted_weights)-1

    else:
        median_weight = sorted_weights.iat[100]
        number_of_top_calls = len(sorted_weights)-1


    copy_numbers_above_median_weight =  calls_file.query(" end - start < 1000_000 & weight > @median_weight")["log2"].sort_values()
 

    if(re.match(r"/.*HG00.*", str(calls_file_path))):

        positive_calls = copy_numbers_above_median_weight.iat[-10]
        negative_calls = copy_numbers_above_median_weight.iat[10]

        filtered_calls = calls_file.query('( weight > @weight_threshold or log2 > @positive_calls or log2 < @negative_calls ) & end - start < 1000_000  & weight > @median_weight ')

    else:
        try:
            filtered_calls = calls_file.query('( weight > @weight_threshold) & end - start < 1000_000 ')
        except:
            filtered_calls = calls_file.query("END - START < 1000_000 & WEIGHT > 1")

    limited_calls = filtered_calls
    if( len(filtered_calls) > 40):
        limited_calls = filtered_calls[0:40]
    api_CNV_calls = CNV_calls_to_api(limited_calls)
    return api_CNV_calls


def add_snvs_to_cnvs(cnvs: Sequence[dict], calls_file_path: Path):
    snv_calls_file = pysam.VariantFile(calls_file_path)
    header = snv_calls_file.header

    first_snv_contig_name = next(header.contigs.iteritems())[0]

    first_cnv_contig_name = "undefined"


    for cnv in cnvs:
        if(first_cnv_contig_name == "undefined"):
            first_cnv_contig_name = cnv["chr"]

        if(re.search(r"/^[a-z]+$/", str(first_cnv_contig_name)) == re.search(r"/^[a-z]+$/", str(first_snv_contig_name)) ):

            snv_calls = snv_calls_file.fetch(
                    contig=str(cnv["chr"]),
                    start=int(cnv["start"]), 
                    stop=int(cnv["end"])
                )
        #remove chr if snv file does not have it
        elif(not re.match(r"chr\d+", first_snv_contig_name[0])):
            snv_calls = snv_calls_file.fetch(
                contig= int(re.search(r"\d+", cnv["chr"]).group()), 
                start=int(cnv["start"]), 
                stop=int(cnv["end"])
            )
        #add chr if snv file has it
        elif( re.match(r"chr\d+", first_snv_contig_name[0])):
            snv_calls = snv_calls_file.fetch(
                contig= "chr" + cnv["chr"], 
                start=int(cnv["start"]), 
                stop=int(cnv["end"])
            )

        snvs_list = [
            {
                "chr": variant_record.contig,
                "position": variant_record.pos,
                "reference": variant_record.ref,
                "alternatives": variant_record.alts,
                "alleleFrequencies": (variant_record.samples[0]["AD"][1]/(variant_record.samples[0]["AD"][0] + variant_record.samples[0]["AD"][1] + 0.000001),)
            }
            for variant_record in snv_calls
        ]
        # print(snvs_list)

        yield {
            "snvs": snvs_list,
            **cnv
        }



def add_mean_coverage_to_cnvs(cnvs: Sequence[dict], bam_file_path: Path, normal_file_path: Path):
    bam_file = pysam.AlignmentFile(bam_file_path)
    normal_bam_file = pysam.AlignmentFile(normal_file_path)
    threshold = 50;
    window = 100;

    for cnv in cnvs:
        depth = bam_file.count(contig = cnv["chr"], start=cnv["start"], end=cnv["end"])
        normal_depth = normal_bam_file.count(contig = cnv["chr"], start=cnv["start"], end=cnv["end"])

        coverage = (depth-normal_depth)/(cnv["end"]-cnv["start"]);
        
        depth_count = bam_file.count_coverage(contig = cnv["chr"], start=cnv["start"], end=cnv["end"])
        normal_depth_count = normal_bam_file.count_coverage(contig = cnv["chr"], start=cnv["start"], end=cnv["end"])

        # print([map(lambda x,y, z, a: x+y+z+a, depth_count[0], depth_count[1], depth_count[2], depth_count[3] )])

        yield {
            "meanCoverage": coverage,
            **cnv
        }


def add_downsampled_coverage_to_cnvs(cnvs: Sequence[dict], bam_file_path: Path, normal_file_path: Path):
    
    bam_file = pysam.AlignmentFile(bam_file_path)
    normal_bam_file = pysam.AlignmentFile(normal_file_path)
    threshold = 50;
    window = 100;

    for cnv in cnvs:
        depth = bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        normal_depth = normal_bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        coverage_windows = []

        length = cnv["end"]- cnv["start"];
        downsampling_factor = min(math.ceil(length/1000), 100)
        previous_position_above_threshold = -window;

        currentWindow = []
        
        for column in depth:
            local_coverage: int = column.get_num_aligned()
            genomic_position: int = column.reference_pos

            try:
                local_normal_coverage: int = next(normal_depth).get_num_aligned()
            except StopIteration:
                continue


            if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
                continue
            if(genomic_position - previous_position_above_threshold > window):
                coverage_windows.append(currentWindow)
                currentWindow=[]
            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "coverage_diff": local_coverage - local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        filtered_coverage = []
        coverage_windows.pop(0)

        for coverage_window in coverage_windows:
            if (len(coverage_window) < 1):
                continue;
            filtered_coverage.append({
                "coverage": median([*map( lambda basepair: basepair["coverage"], coverage_window)]),
                "pos": coverage_window[0]["pos"],
                "coverage_diff": median([*map(lambda basepair: basepair["coverage_diff"], coverage_window)])
                })


        if (len(filtered_coverage) > 0):
            filtered_coverage.pop(0)

        yield{
            "downsampledCoverage": filtered_coverage,
            **cnv
        }

def add_downsampled_coverage_bed_to_cnvs_old(cnvs: Sequence[dict], bed_file_path: Path, normal_file_path: Path):
    
    bed_file = pd.read_csv(bed_file_path, delimiter='\t', dtype={"chromosome": object, "end": int, "start": int})

    normal_file = pd.read_csv(normal_file_path, delimiter='\t', dtype={"chromosome": object, "end": int, "start": int})
    threshold = 50;
    # window = 10000;
    window = 400;

    for cnv in cnvs:
        # cnv_chr_name = cnv["chr"]
        # if( re.match(r"\d+",cnv_chr_name) ):
        #     cnv_chr_name = "chr" + cnv_chr_name
        # depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv["end"] & end > @cnv["start"] ) or ( start < @cnv["end"] & start > @cnv["start"] ) )')
        # normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv["end"] & end > @cnv["start"] ) or  ( start < @cnv["end"] & start > @cnv["start"] ) )')
        cnv_chr_name = cnv["chr"]
        cnv_end = cnv["end"]
        cnv_start = cnv["start"]
        if( re.match(r"chr\d+", cnv_chr_name)):
            cnv_chr_name = re.search(r"\d+",cnv_chr_name).group()
        depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        
        if(len(depth) == 0):
            cnv_chr_name = "chr" + cnv_chr_name
            depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
            normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')


        
        normal_iterator = normal_depth.itertuples()
        coverage_windows = []

        length = cnv["end"] - cnv["start"];
        downsampling_factor = min(math.ceil(length/1000), 100)
        previous_position_above_threshold = -window;

        currentWindow = []
        for target in depth.itertuples():
            local_coverage: int = target.depth
            genomic_position: int = target.start

            try:
                local_normal_coverage: int = next(normal_iterator).depth
            except StopIteration:
                continue


            # if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
            #     continue
            if(genomic_position - previous_position_above_threshold > window or len(currentWindow) > 200):
                coverage_windows.append(currentWindow)
                currentWindow=[]
            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "coverage_diff": local_coverage - local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        coverage_windows.append(currentWindow)
        filtered_coverage = []
        if (len(coverage_windows) > 1): 
            coverage_windows.pop(0)

        for coverage_window in coverage_windows:
            if (len(coverage_window) < 1):
                continue;
            filtered_coverage.append({
                "coverage": median([*map( lambda basepair: basepair["coverage"], coverage_window)]),
                "pos": coverage_window[0]["pos"],
                "coverage_diff": median([*map(lambda basepair: basepair["coverage_diff"], coverage_window)])
                })

        if ( len(filtered_coverage) > 1):
            filtered_coverage.pop(0)
        yield{
            "downsampledCoverage": filtered_coverage,
            **cnv
        }

def add_downsampled_coverage_bed_to_cnvs(cnvs: Sequence[dict], bed_file_path: Path, normal_file_path: Path):
    
    bed_file = pd.read_csv(bed_file_path, delimiter='\t', dtype={"chromosome": object, "end": int, "start": int})

    normal_file = pd.read_csv(normal_file_path, delimiter='\t', dtype={"chromosome": object, "end": int, "start": int})
    threshold = 50;
    # window = 10000;
    window = 400;

    for cnv in cnvs:
        # cnv_chr_name = cnv["chr"]
        # if( re.match(r"\d+",cnv_chr_name) ):
        #     cnv_chr_name = "chr" + cnv_chr_name
        # depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv["end"] & end > @cnv["start"] ) or ( start < @cnv["end"] & start > @cnv["start"] ) )')
        # normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv["end"] & end > @cnv["start"] ) or  ( start < @cnv["end"] & start > @cnv["start"] ) )')
        cnv_chr_name = cnv["chr"]
        cnv_end = cnv["end"]
        cnv_start = cnv["start"]
        if( re.match(r"chr\d+", cnv_chr_name)):
            cnv_chr_name = re.search(r"\d+",cnv_chr_name).group()
        depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        
        if(len(depth) == 0):
            cnv_chr_name = "chr" + cnv_chr_name
            depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
            normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')


        
        normal_iterator = normal_depth.itertuples()
        coverage_windows = []

        length = cnv["end"] - cnv["start"];
        downsampling_factor = min(math.ceil(length/1000), 100)
        previous_position_above_threshold = -window;

        currentWindow = []
        for target in depth.itertuples():
            local_coverage: int = target.depth
            genomic_position: int = target.start

            try:
                local_normal_coverage: int = next(normal_iterator).depth
            except StopIteration:
                continue


            # if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
            #     continue
            if(genomic_position - previous_position_above_threshold > window or len(currentWindow) > 200):
                coverage_windows.append(currentWindow)
                currentWindow=[]
            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "normal_coverage": local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        coverage_windows.append(currentWindow)
        filtered_coverage = []
        if (len(coverage_windows) > 1): 
            coverage_windows.pop(0)

        for coverage_window in coverage_windows:
            if (len(coverage_window) < 1):
                continue;
            filtered_coverage.append({
                "coverage": median([*map( lambda pos: pos["coverage"], coverage_window)]),
                "pos": coverage_window[0]["pos"],
                "coverage_diff": median([*map( lambda pos: pos["coverage"], coverage_window)]) - median([*map(lambda pos: pos["normal_coverage"], coverage_window)])
                })

        if ( len(filtered_coverage) > 1):
            filtered_coverage.pop(0)
        yield{
            "downsampledCoverage": filtered_coverage,
            **cnv
        }


def add_coverage_to_cnvs(cnvs: Sequence[dict], bam_file_path: Path, normal_file_path: Path):

    bam_file = pysam.AlignmentFile(bam_file_path)
    normal_bam_file = pysam.AlignmentFile(normal_file_path)
    threshold = 30;
    window = 100;

    for cnv in cnvs:
        depth = bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        normal_depth = normal_bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        coverage = []

        length = cnv["end"]- cnv["start"];
        downsampling_factor = min(math.ceil(length/1000), 100)
        previous_position_above_threshold = -window;

        currentWindow = []
        
        for column in depth:
            local_coverage: int = column.get_num_aligned()
            genomic_position: int = column.reference_pos

            try:
                local_normal_coverage: int = next(normal_depth).get_num_aligned()
            except StopIteration:
                continue


            if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
                continue
            if(genomic_position - previous_position_above_threshold > window):
                coverage.append(currentWindow)
                currentWindow=[]
            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "coverage_diff": local_coverage - local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        filtered_coverage = []
        if ( len(coverage) > 0 ):
            coverage.pop(0)

        for coverage_window in coverage:
            filtered_coverage.append(list(downsample_window(coverage_window, downsampling_factor)))

        if ( len(filtered_coverage) > 0 ):
            filtered_coverage.pop(0)

        yield {
            "coverage": filtered_coverage,
            **cnv
        }

def add_annotations_to_cnvs(cnvs: Sequence[dict], annotations_file_path: Path):
    annotations_file = pysam.TabixFile(str(annotations_file_path), parser=pysam.asBed())

    for cnv in cnvs:
        # wrong chromosome format
        if(chromosomeName(cnv["chr"]) == "None"):
            yield{
                "annotations": [],
                **cnv
            }
            continue
        annotation_list = annotations_file.fetch(reference=chromosomeName(cnv["chr"]), start=cnv["start"], end=cnv["end"])

        annotations = [
            {
                "chr": annotation[0],
                "start": int(annotation[3]),
                "end": int(annotation[4]),
                "type": annotation[2],
                "source": annotation[1],
                "id": parse_id(annotation[8])
            }
            for annotation in annotation_list]

        yield {
            "annotations": annotations,
            **cnv
            };


def downsample_window(window, step):
    # print(len(window), "step: ", step)
    for i in range(0, len(window)-step, step):
        # print(i)
        current_interval = window[i : i+step]
        # print(current_interval)
        yield{
            "coverage": max(map(lambda x: x["coverage"], current_interval)),
            "pos": current_interval[int(step/2)]["pos"],
            "coverage_diff": max(map(lambda x: x["coverage_diff"], current_interval)),
        }


def load_coverage_on_cnvs(cnvs: Sequence[dict], bam_file_path: Path, normal_file_path: Path):

    bam_file = pysam.AlignmentFile(bam_file_path)
    normal_bam_file = pysam.AlignmentFile(normal_file_path)
    threshold = 30;
    window = 100;

    for cnv in cnvs:
        depth = bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        normal_depth = normal_bam_file.pileup(contig = cnv["chr"], start=cnv["start"], end=cnv["end"], truncate=True)
        coverage = []

        length = cnv["end"]- cnv["start"];
        downsampling_factor = min(math.ceil(length/1000), 100)
        previous_position_above_threshold = -window;

        currentWindow = []
        
        for column in depth:
            local_coverage: int = column.get_num_aligned()
            genomic_position: int = column.reference_pos

            try:
                local_normal_coverage: int = next(normal_depth).get_num_aligned()
            except StopIteration:
                continue


            if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
                continue
            if(genomic_position - previous_position_above_threshold > window):
                coverage.append(currentWindow)
                currentWindow=[]
            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "coverage_diff": local_coverage - local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        filtered_coverage = []
        coverage.pop(0)

        for coverage_window in coverage:
            filtered_coverage.append(list(downsample_window(coverage_window, downsampling_factor)))

        if( len( filtered_coverage ) > 0 ):
            filtered_coverage.pop(0)

        yield {
            "coverageWindows": filtered_coverage
        }
    

def load_coverage_bed_on_cnvs(cnvs: Sequence[dict], bed_file_path: Path, normal_file_path: Path):

    bed_file = pd.read_csv(bed_file_path, delimiter='\t',  dtype={"chromosome": object, "end": int, "start": int})
    normal_file = pd.read_csv(normal_file_path, delimiter='\t',  dtype={"chromosome": object, "end": int, "start": int})
    threshold = 30;
    window = 1000;

    for cnv in cnvs:
        # depth = bed_file.query('chromosome == @cnv["chr"] & ( (end < @cnv["end"] & end > @cnv["start"] ) or  ( start < @cnv["end"] & start > @cnv["start"] ) )')
        # normal_depth = normal_file.query('chromosome == @cnv["chr"] & ( (end < @cnv["end"] & end > @cnv["start"] ) or  ( start < @cnv["end"] & start > @cnv["start"] ) )')

        cnv_chr_name = cnv["chr"]
        cnv_end = cnv["end"]
        cnv_start = cnv["start"]
        if( re.match(r"chr\d+",cnv_chr_name) ):
            cnv_chr_name = re.search(r"\d+",cnv_chr_name).group()
        depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        if(len(depth) == 0):
            cnv_chr_name = "chr" + cnv_chr_name
            depth = bed_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
            normal_depth = normal_file.query('chromosome == @cnv_chr_name & ( (end < @cnv_end & end > @cnv_start ) or ( start < @cnv_end & start > @cnv_start ) )')
        normal_iterator = normal_depth.itertuples()
        coverage = []
        length = cnv["end"] - cnv["start"];
        downsampling_factor = min(math.ceil(length/100), 100)
        previous_position_above_threshold = -window;
    
        currentWindow = []
        
        for target in depth.itertuples():
            local_coverage: int = target.depth
            genomic_position: int = target.start


            try:
                local_normal_coverage: int = next(normal_iterator).depth
            except StopIteration:
                continue


            # if (local_coverage < threshold): # or mod(genomic_position, downsampling_factor) != 0):
            #     continue
            if((genomic_position - previous_position_above_threshold > window & len(currentWindow) > 0) or len(currentWindow) > 50):
                coverage.append(currentWindow)
                currentWindow=[]

            currentWindow.append({
                "coverage": local_coverage,
                "pos": genomic_position,
                "coverage_diff": local_coverage - local_normal_coverage
            })
            previous_position_above_threshold = genomic_position;

        coverage.append(currentWindow)
        filtered_coverage = []
        if (len( coverage ) > 1):
            coverage.pop(0)

        yield {
            "coverageWindows": coverage
        }
        

def downsample_bed_window(window, step):
    # print(len(window), "step: ", step)
    for i in range(0, len(window)-step, step):
        # print(i)
        current_interval = window[i : i+step]
        # print(current_interval)
        yield{
            "coverage": max(map(lambda x: x["coverage"], current_interval)),
            "pos": current_interval[int(step/2)]["pos"],
            "coverage_diff": max(map(lambda x: x["coverage_diff"], current_interval)),
        }