import string
from typing import Sequence
import pandas as pd
from pysam import IteratorColumn
import pysam
import re


def segments_to_api(segments: pd.DataFrame) -> dict:
    api_segments = []
    for i, segment in segments.iterrows():
        api_segments.append(
            {
                "chr": segment["chromosome"],
                "start": segment["start"],
                "end": segment["end"],
                "copyRatio": segment["log2"]
            })

    return {"segments": api_segments}


def bins_to_api(bins: pd.DataFrame) -> dict:
    api_bins = []
    for i, bin in bins.iterrows():
        api_bins.append(
            {
                "chr": bin["CONTIG"],
                "start": bin["START"],
                "end": bin["END"],
                "copyRatio": bin["COUNT"]
            })

    return {"bins": api_bins}


def pileup_to_api(pileup: IteratorColumn) -> dict:
    api_pileup = []
    for column in pileup:
        api_pileup.append(
            {
                "bases": column.get_query_sequences(),
                "position": column.pos
            })
    return {"pileup": api_pileup}


def reference_to_api(reference: string) -> dict:
    return {"reference": list(reference.upper())}


def annotations_to_api(annotations: string) -> dict:

    api_annotations = []
    for row in annotations:
        api_annotations.append(
            {
                "chr": row[0],
                "start": row[3],
                "end": row[4],
                "type": row[2],
                "source": row[1],
                "id": parse_id(row[8])
            }
        )
    return{"annotations": api_annotations}



def CNV_calls_to_api(calls: pd.DataFrame) -> Sequence[dict]:
    api_CNV_calls = []
    for i, call in calls.iterrows():
        yield {
                "chr": call["chr"],
                "start": call["start"],
                "end": call["end"],
                "copyRatio": call["log2"],
                "nProbes": call["probes"]

            }


def parse_id(input_string: string) -> string:
    id_attribute = input_string.split(";")[0].split("=")
    if(len(id_attribute) < 2):
        return "none"
    return input_string.split(";")[0].split("=")[1]


def SNV_calls_to_api(calls: pysam.VariantFile) -> dict:
    api_SNV_calls = []

    for call in calls:
        api_SNV_calls.append(
            {
                "chr": call.chrom,
                "position": call.pos,
                "reference": call.ref,
                "alternative": call.alts,
            }
        )
    return api_SNV_calls

def dataframe_calls_to_api(calls: pd.DataFrame) -> dict:
    api_SNV_calls = []
    def extract_allelefraction(input_string):
        search_output = re.search(".+?(?=:):.+?(?=:):(.+?(?=:)):.*", input_string)
        if search_output == None:
            return "0"
        return str(search_output.group(1))

    columns = {"#CHROM": "chr", "POS": "position", "REF": "reference", "ALT":"alternative", "S2": "alleleFrequencies"}
    calls_selected_columns = pd.DataFrame(calls[[ "#CHROM", "POS", "REF", "ALT", "S2"]])
    calls_selected_columns["S2"] = calls_selected_columns["S2"].apply(extract_allelefraction)
    calls_renamed_columns = calls_selected_columns.rename(columns=columns)

    api_SNV_calls = calls_renamed_columns.to_dict(orient="records")
    return {"calls": api_SNV_calls}


def variant_file_to_dataframe(variant_file):

    fetched = variant_file.fetch()
    header = variant_file.header
    header = str(header).split("\n")[-2].split("\t")

    initial_snv_dataframe = pd.DataFrame(fetched)
    intermediate_snv_dataframe = initial_snv_dataframe.applymap(lambda row: str(row).split("\t"))
    snv_dataframe = pd.DataFrame(intermediate_snv_dataframe[0].to_list(), columns=header)
    return snv_dataframe

def variant_iterator_to_dataframe(variant_iterator, header):
    initial_snv_dataframe = pd.DataFrame(variant_iterator)
    header = str(header).split("\n")[-2].split("\t")
    
    intermediate_snv_dataframe = initial_snv_dataframe.applymap(lambda row: str(row).split("\t"))
    snv_dataframe = pd.DataFrame(intermediate_snv_dataframe[0].to_list(), columns=header)
    return snv_dataframe


ucscToNcbiHg38ContigNames = {
    "chr1": "NC_000001.11",
    "chr2": "NC_000002.12",
    "chr3": "NC_000003.12",
    "chr4": "NC_000004.12",
    "chr5": "NC_000005.10",
    "chr6": "NC_000006.12",
    "chr7": "NC_000007.14",
    "chr8": "NC_000008.11",
    "chr9": "NC_000009.12",
    "chr10": "NC_000010.11",
    "chr11": "NC_000011.10",
    "chr12": "NC_000012.12",
    "chr13": "NC_000013.11",
    "chr14": "NC_000014.9",
    "chr15": "NC_000015.10",
    "chr16": "NC_000016.10",
    "chr17": "NC_000017.11",
    "chr18": "NC_000018.10",
    "chr19": "NC_000019.10",
    "chr20": "NC_000020.11",
    "chr21":"NC_000021.9",
    "chr22": "NC_000022.11",
    "chrX": "NC_000023.11",
    "chrY": "NC_000024.10",
    "1": "NC_000001.11",
    "2": "NC_000002.12",
    "3": "NC_000003.12",
    "4": "NC_000004.12",
    "5": "NC_000005.10",
    "6": "NC_000006.12",
    "7": "NC_000007.14",
    "8": "NC_000008.11",
    "9": "NC_000009.12",
    "10": "NC_000010.11",
    "11": "NC_000011.10",
    "12": "NC_000012.12",
    "13": "NC_000013.11",
    "14": "NC_000014.9",
    "15": "NC_000015.10",
    "16": "NC_000016.10",
    "17": "NC_000017.11",
    "18": "NC_000018.10",
    "19": "NC_000019.10",
    "20": "NC_000020.11",
    "21":"NC_000021.9",
    "22": "NC_000022.11",
    "X": "NC_000023.11",
    "Y": "NC_000024.10",
}

def  chromosomeName(inputName: string):
    # Now this can be quickly changed to e.g. ucscToNcbiDictionary = server.fetch(...); in the future
    ucscToNcbiDictionary = ucscToNcbiHg38ContigNames;
    
    return ucscToNcbiDictionary.get(inputName, "None");


