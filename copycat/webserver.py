from math import floor
import time
from typing import Optional, Type
import os
import pandas as pd
import pysam
import shelve
import pickle
import datetime
import json
import csv
import glob

from flask import Flask, g, make_response, flash, request, redirect, send_from_directory, url_for, render_template
from flask.wrappers import Response
from flask_cors import CORS, cross_origin

from werkzeug.utils import secure_filename
from copycat.config import DevelopmentConfig

from pathlib import Path
from copycat.common import  annotations_to_api, dataframe_calls_to_api, segments_to_api, bins_to_api, pileup_to_api, reference_to_api, variant_file_to_dataframe
from copycat.import_methods import add_annotations_to_cnvs, add_downsampled_coverage_to_cnvs, add_mean_coverage_to_cnvs, add_snvs_to_cnvs, load_coverage_on_cnvs, load_coverage_bed_on_cnvs, parse_cnvs, add_downsampled_coverage_bed_to_cnvs

# for testing pupouses
ROI = {
    "chr": "chr5",
    "start": 57110500,
    "end": 57111200
}

log_file_name = Path("logs" + str(datetime.datetime.now()) + ".txt")

DEMO_CASE_FOLDER = Path('./copycat/demo/')

OVARY_CALLS_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cns'))]
OVARY_CALLS_FILE_NAMES_B =[next(DEMO_CASE_FOLDER.glob('*.cns'))]
QUESTIONS_A_CALLS_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cns'))]
QUESTIONS_B_CALLS_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cns'))]
OVARY_CALLS_FILE_NAMES_TEST =[next(DEMO_CASE_FOLDER.glob('*.cns'))]

BED_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cnn'))]
BED_FILE_NAMES_B =[next(DEMO_CASE_FOLDER.glob('*.cnn'))]
QUESTIONS_A_BED_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cnn'))]
QUESTIONS_B_BED_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.cnn'))]
BED_FILE_NAMES_TEST =[next(DEMO_CASE_FOLDER.glob('*.cnn'))]

SNV_FILE_NAMES_PATHS =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
SNV_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
SNV_FILE_NAMES_PATHS_B =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
SNV_FILE_NAMES_B =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
QUESTIONS_A_SNV_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
QUESTIONS_B_SNV_FILE_NAMES =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]
SNV_FILE_NAMES_TEST =[next(DEMO_CASE_FOLDER.glob('*.vcf.gz'))]


QUESTIONS_COMPARISON_FILE = Path("./copycat/demo/comparison.targetcoverage")
COMPARISON_FILE = Path("./copycat/demo/comparison.targetcoverage")

ANNOTATIONS_FILE_NAME = Path("./copycat/demo/GRCh38_latest_genomic_sorted.gff.gz")
BASEFOLDER = Path("./")	
OVARY_BASEFOLDER = Path("./")	
QUESTIONS_BASEFOLDER = Path("./")

def create_app(config=None) -> Flask:
    """Create Flask app from config.

    Parameters
    ----------
    config: Optional[Type[Config]] = None
        Optional config to use.

    Returns
    ----------
    Flask
        Created Flask app.
    """
    app = Flask(__name__)
    app.app_context().push()

    # configure path
    app.root_path = Path.cwd()
    app.static_folder = "copycat-client/dist"
    app.template_folder = "copycat-client/public"

    if config is None:
        app.config.from_object(DevelopmentConfig())
    else:
        app.config.from_object(config())

    @app.before_request
    def start_time_taking():
        g.start = time.perf_counter()

    @app.route("/test", methods=["GET"])
    def store_test() -> Response:
        """
        The PACS calls this endpoint at setup to check that the connection
        works.
        """
        return make_response({"version": "0.2.0"})

    @app.route("/")
    def index():
        return render_template("index.html")

    def allowed_file(filename):
        return '.' in filename and \
            filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

    @app.route('/uploads/<name>')
    def download_file(name):
        return send_from_directory(app.config["UPLOAD_FOLDER"], name)

    @app.route("/api/segments")
    def segments() -> Response:
        segments_file_path = BASEFOLDER.joinpath(SEGMENTS_FILE_NAME)
        copy_ratio_segments = pd.read_csv(
            segments_file_path,
            delimiter="\t",
            comment="@"
        )

        api_segments = segments_to_api(copy_ratio_segments)

        return api_segments

    @app.route("/api/bins")
    def bins() -> Response:
        bins_file_path = BASEFOLDER.joinpath(COPY_RATIO_FILE_NAME)
        copy_ratio_bins = pd.read_csv(
            bins_file_path,
            delimiter="\t",
            comment="@"
        )

        api_bins = bins_to_api(copy_ratio_bins)
        return api_bins

    @app.route("/api/pileup")
    def pileup() -> Response:
        chromosome = request.args.get(key="chr", default="chr5", type=str)
        start = int(request.args.get(
            key="start", default="57110500", type=str))
        end = int(request.args.get(key="end", default="57111200", type=str))
        if (request.args.get(key="load-comparison", default="false", type=str) == "true"):
            pileup_file_path = BASEFOLDER.joinpath(COMPARISON_FILE_NAME)
        else:
            pileup_file_path = BASEFOLDER.joinpath(PILEUP_FILE_NAME)
        bam_file = pysam.AlignmentFile(pileup_file_path)

        pileup = bam_file.pileup(
            chromosome,
            start=start,
            stop=end,
            truncate=True,
            reference_filename=REFERENCE_FILE_NAME)
        api_pileup = pileup_to_api(pileup)
        return api_pileup

    @app.route("/api/reference")
    def reference() -> Response:
        chromosome = request.args.get(
            key="chr", default="NC_000005.10", type=str)
        start = int(request.args.get(
            key="start", default="57110500", type=str))
        end = int(request.args.get(key="end", default="57111200", type=str))
        reference_file_path = BASEFOLDER.joinpath(REFERENCE_FILE_NAME)
        reference = pysam.FastaFile(reference_file_path)

        api_reference = reference_to_api(
            reference.fetch(reference=chromosome, start=start, end=end)
        )
        return api_reference

    @app.route("/api/annotations")
    def annotations() -> Response:
        chromosome = request.args.get(
            key="chr", default="NC_000005.10", type=str)
        start = int(request.args.get(
            key="start", default="57110500", type=str))-1000
        end = int(request.args.get(
            key="end", default="57111200", type=str))+10000

        annotations_file_path = BASEFOLDER.joinpath(ANNOTATIONS_FILE_NAME)
        annotations = pysam.TabixFile(
            str(annotations_file_path), parser=pysam.asBed())

        api_annotations = annotations_to_api(
            annotations.fetch(reference=chromosome,
                              start=max(start, 0), end=end)
        )
        return api_annotations

    @app.route("/api/CnvCalls")
    def CnvCalls() -> Response:
        # Use hard coded values atm
        caseSet = request.args.get(key="caseSet", default="questionA", type=str)
        index = request.args.get(key="index", default="0", type=str)
        index_int = int(index)

        if (caseSet == "caseA"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES[index_int])
            bed_file_name = str(BED_FILE_NAMES[index_int])
            snv_file_name = str(SNV_FILE_NAMES[index_int])
            basefolder = str(OVARY_BASEFOLDER)
            normal_file_name = str(COMPARISON_FILE)

        if (caseSet == "caseB"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES_B[index_int])
            snv_file_name = str(SNV_FILE_NAMES_B[index_int])
            bed_file_name = str(BED_FILE_NAMES_B[index_int])
            basefolder = str(OVARY_BASEFOLDER)
            normal_file_name = str(COMPARISON_FILE)

        if (caseSet == "test"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES_TEST[index_int % 3])
            snv_file_name = str(SNV_FILE_NAMES_TEST[index_int % 3])
            bed_file_name = str(BED_FILE_NAMES_TEST[index_int % 3])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder = str(QUESTIONS_BASEFOLDER)

        if (caseSet == "questionA"):
            cnv_file_name = str(QUESTIONS_A_CALLS_FILE_NAMES[index_int])
            bed_file_name = str(QUESTIONS_A_BED_FILE_NAMES[index_int])
            snv_file_name = str(QUESTIONS_A_SNV_FILE_NAMES[index_int])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder= str(QUESTIONS_BASEFOLDER)

        if (caseSet == "questionB"):
            cnv_file_name = str(QUESTIONS_B_CALLS_FILE_NAMES[index_int])
            bed_file_name = str(QUESTIONS_B_BED_FILE_NAMES[index_int])
            snv_file_name = str(QUESTIONS_B_SNV_FILE_NAMES[index_int])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder = str(QUESTIONS_BASEFOLDER)

        # cnv_file_name = str(CALLS_FILE_NAME)
        # snv_file_name = str(SNV_FILE_NAME)
        # normal_file_name = str(COMPARISON_FILE_NAME)
        # bed_file_name = str(BED_FILE_NAME)
        # basefolder = str(BASEFOLDER)

        coverage_load_string = cnv_file_name + "," + bed_file_name + "," + snv_file_name + "," + basefolder + "," + normal_file_name
        return load_cnv_sample(coverage_load_string)

        return load_cnvs( index+ "," + caseSet)

    @app.route("/api/CnvCoverages")
    def CnvCoverages() -> Response:
        index = request.args.get(key="index", default="0", type=str)
        caseSet = request.args.get(key="caseSet", default="questionA", type=str)
        index_int = int(index)

        if (caseSet == "caseA"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES[index_int])
            snv_file_name = str(SNV_FILE_NAMES[index_int])
            bed_file_name = str(BED_FILE_NAMES[index_int])
            basefolder = str(OVARY_BASEFOLDER)
            normal_file_name = str(COMPARISON_FILE)

        if (caseSet == "caseB"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES_B[index_int])
            snv_file_name = str(SNV_FILE_NAMES_B[index_int])
            bed_file_name = str(BED_FILE_NAMES_B[index_int])
            basefolder = str(OVARY_BASEFOLDER)
            normal_file_name = str(COMPARISON_FILE)

        if (caseSet == "test"):
            caseIndex: int = floor(index_int / 9)
            cnv_file_name = str(OVARY_CALLS_FILE_NAMES_TEST[index_int % 3])
            snv_file_name = str(SNV_FILE_NAMES_TEST[index_int % 3])
            bed_file_name = str(BED_FILE_NAMES_TEST[index_int % 3])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder = str(QUESTIONS_BASEFOLDER)

        if (caseSet == "questionA"):
            cnv_file_name = str(QUESTIONS_A_CALLS_FILE_NAMES[index_int])
            bed_file_name = str(QUESTIONS_A_BED_FILE_NAMES[index_int])
            snv_file_name = str(QUESTIONS_A_SNV_FILE_NAMES[index_int])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder= str(QUESTIONS_BASEFOLDER)

        if (caseSet == "questionB"):
            cnv_file_name = str(QUESTIONS_B_CALLS_FILE_NAMES[index_int])
            bed_file_name = str(QUESTIONS_B_BED_FILE_NAMES[index_int])
            snv_file_name = str(QUESTIONS_B_SNV_FILE_NAMES[index_int])
            normal_file_name = str(QUESTIONS_COMPARISON_FILE)
            basefolder = str(QUESTIONS_BASEFOLDER)

        # cnv_file_name = str(CALLS_FILE_NAME)
        # snv_file_name = str(SNV_FILE_NAME)
        # normal_file_name = str(COMPARISON_FILE_NAME)
        # bed_file_name = str(BED_FILE_NAME)
        # basefolder = str(BASEFOLDER)

        coverage_load_string = cnv_file_name+ "," + bed_file_name + "," + basefolder + "," + normal_file_name
        return load_coverage_sample(coverage_load_string)
        
    @app.route("/api/SnvCalls")
    def SnvCalls() -> Response:
        calls_file_path = BASEFOLDER.joinpath(SNV_FILE_NAME)
        calls_file = pysam.VariantFile(calls_file_path)
        header = str(calls_file.header).split("\n")[-2].split("\t")

        calls = pd.read_csv(calls_file_path, delimiter="\t", comment="#", names=header)

        dataframe_calls = variant_file_to_dataframe(calls_file)
        api_dataframe_calls = dataframe_calls_to_api(dataframe_calls)

        return api_dataframe_calls


    @app.route("/api/userInteraction", methods=['GET', 'POST'])
    def userInteraction(): 
        data = json.loads(request.get_json())
 
        file_path = BASEFOLDER.joinpath(log_file_name)
        dataframe = pd.DataFrame(data.values(), data.keys())

        with open(file_path, "at") as f:
            writer = csv.writer(f, delimiter='\t')
            writer.writerow(data.values())

    
        return "success"



    return app


def shelve_it(file_name):
    # with shelve.open(file_name) as d:
    d=shelve.open(file_name)


    def decorator(func):
        def new_func(param):
            if param not in d:
                d[param] = func(param)
            return d[param]
        return new_func
    return decorator

# @shelve_it('cache_cnv3075.dat')
def load_cnvs(indexAndCaseSet: str):
    # cache_filename = cnv_file_name + "_cache"

    # if os.path.exists(cache_filename):
    #     pickle.Pickler(open(cache_filename, "rb"))
    indexAndCaseSetSplit = indexAndCaseSet.split(",")
    caseSet = indexAndCaseSetSplit[1]
    index_int = int(indexAndCaseSetSplit[0])

    annotations_file_name = ANNOTATIONS_FILE_NAME
    normal_file_name = COMPARISON_FILE
    # bed_file_name = BED_FILE_NAMES[index_int]

    if (caseSet == "caseA"):
        caseIndex: int = floor(index_int / 9)
        cnv_file_name = OVARY_CALLS_FILE_NAMES[index_int]
        snv_file_name = SNV_FILE_NAMES[index_int]

    if (caseSet == "caseB"):
        caseIndex: int = floor(index_int / 9)
        cnv_file_name = OVARY_CALLS_FILE_NAMES_B[index_int]
        snv_file_name = SNV_FILE_NAMES_B[index_int]
        bed_file_name = BED_FILE_NAMES_B[index_int]


    if (caseSet == "test"):
        caseIndex: int = floor(index_int / 9)
        cnv_file_name = OVARY_CALLS_FILE_NAMES_TEST[index_int]
        snv_file_name = SNV_FILE_NAMES_TEST[index_int]
        bed_file_name = BED_FILE_NAMES_TEST[index_int]

    if (caseSet == "questionA"):
        cnv_file_name = QUESTIONS_A_CALLS_FILE_NAMES[index_int]
        bed_file_name = QUESTIONS_A_BED_FILE_NAMES[index_int]
        snv_file_name = QUESTIONS_A_SNV_FILE_NAMES[index_int]
        normal_file_name = QUESTIONS_COMPARISON_FILE
        OVARY_BASEFOLDER= QUESTIONS_BASEFOLDER

    if (caseSet == "questionB"):
        cnv_file_name = QUESTIONS_B_CALLS_FILE_NAMES[index_int]
        bed_file_name = QUESTIONS_B_BED_FILE_NAMES[index_int]
        snv_file_name = QUESTIONS_B_SNV_FILE_NAMES[index_int]
        normal_file_name = QUESTIONS_COMPARISON_FILE
        OVARY_BASEFOLDER= QUESTIONS_BASEFOLDER
        # bam_file_name = PILEUP_FILE_NAMES_PATHS[index_int]

    # if (caseSet > 0):
    #     c
    calls_file_path = OVARY_BASEFOLDER.joinpath(Path(cnv_file_name))
    cnvs = parse_cnvs(calls_file_path)

    snv_file_path = OVARY_BASEFOLDER.joinpath(Path(snv_file_name))
    # BASEFOLDER.joinpath(snv_file_name)

    cnvs_with_snvs = add_snvs_to_cnvs(cnvs, snv_file_path)

    # coverage_file_path = OVARY_BASEFOLDER.joinpath(bam_file_name)
    normal_file_path = OVARY_BASEFOLDER.joinpath(normal_file_name) #normal_file_name)
    # cnvs_with_snvs_and_coverage = add_mean_coverage_to_cnvs(cnvs_with_snvs, coverage_file_path, normal_file_path)
    bed_file_path = OVARY_BASEFOLDER.joinpath(bed_file_name)

    annotations_file_path = BASEFOLDER.joinpath(annotations_file_name)
    cnvs_with_snvs_and_annotations = add_annotations_to_cnvs(cnvs_with_snvs, annotations_file_path)

    cnvs_with_snvs_downsampled_coverage_and_annotations = add_downsampled_coverage_bed_to_cnvs(cnvs_with_snvs_and_annotations, bed_file_path, normal_file_path)

    return {"calls": [*cnvs_with_snvs_downsampled_coverage_and_annotations]}


# @shelve_it('cache_coverage4063.dat')
def load_coverage( indexAndCaseSet: str):
    indexAndCaseSetSplit = indexAndCaseSet.split(",")
    caseSet = indexAndCaseSetSplit[1]
    
    index_int = int(indexAndCaseSetSplit[0])

    # cnv_file_name = CALLS_FILE_NAMES_PATHS[index_int]
    # snv_file_name = SNV_FILE_NAMES_PATHS[index_int]
    # calls_file_path = BASEFOLDER.joinpath(snv_file_name)
    # bam_file_name = PILEUP_FILE_NAMES_PATHS[index_int]
    normal_file_name = COMPARISON_FILE
    # bed_file_name = BED_FILE_NAMES[index_int]

    if (caseSet == "caseA"):
        caseIndex: int = floor(index_int / 9)
        # cnv_file_name = questionsA["CALLS_FILE_NAMES_PATHS"][index_int]
        # bam_file_name = questionsA["PILEUP_FILE_NAMES_PATH"]
        # snv_file_name = questionsA["SNV_FILE_NAME_PATH"]
        cnv_file_name = OVARY_CALLS_FILE_NAMES[index_int]
        snv_file_name = SNV_FILE_NAMES_PATHS[index_int]
        # bam_file_name = PILEUP_FILE_NAMES_PATHS[index_int]

    if (caseSet == "caseB"):
        caseIndex: int = floor(index_int / 9)
        # cnv_file_name = questionsB["CALLS_FILE_NAMES_PATHS"][index_int]
        # bam_file_name = questionsB["PILEUP_FILE_NAMES_PATH"][caseIndex]
        # snv_file_name = questionsB["SNV_FILE_NAME_PATH"][caseIndex]
        cnv_file_name = OVARY_CALLS_FILE_NAMES_B[index_int]
        snv_file_name = SNV_FILE_NAMES_B[index_int]
        # bam_file_name = PILEUP_FILE_NAMES_B[index_int]
        bed_file_name = BED_FILE_NAMES_B[index_int]

    if (caseSet == "casetest" or caseSet == "questiontest"):
        caseIndex: int = floor(index_int / 9)
        # cnv_file_name = questionsB["CALLS_FILE_NAMES_PATHS"][index_int]
        # bam_file_name = questionsB["PILEUP_FILE_NAMES_PATH"][caseIndex]
        # snv_file_name = questionsB["SNV_FILE_NAME_PATH"][caseIndex]
        cnv_file_name = OVARY_CALLS_FILE_NAMES_TEST[index_int]
        snv_file_name = SNV_FILE_NAMES_TEST[index_int]
        # bam_file_name = PILEUP_FILE_NAMES_B[index_int]
        bed_file_name = BED_FILE_NAMES_TEST[index_int]

    if (caseSet == "questionA"):
        caseIndex: int = floor(index_int / 9)
        cnv_file_name = QUESTIONS_A_CALLS_FILE_NAMES[index_int]
        bed_file_name = QUESTIONS_A_BED_FILE_NAMES[index_int]
        snv_file_name = QUESTIONS_A_SNV_FILE_NAMES[index_int]
        OVARY_BASEFOLDER = QUESTIONS_BASEFOLDER
        normal_file_name = QUESTIONS_COMPARISON_FILE
        
    if (caseSet == "questionB"):
        caseIndex: int = floor(index_int / 9)
        cnv_file_name = QUESTIONS_B_CALLS_FILE_NAMES[index_int]
        bed_file_name = QUESTIONS_B_BED_FILE_NAMES[index_int]
        snv_file_name = QUESTIONS_B_SNV_FILE_NAMES[index_int]
        OVARY_BASEFOLDER = QUESTIONS_BASEFOLDER
        normal_file_name = QUESTIONS_COMPARISON_FILE


    calls_file_path = OVARY_BASEFOLDER.joinpath(Path(cnv_file_name))

    cnvs = parse_cnvs(calls_file_path)

    # coverage_file_path = BASEFOLDER.joinpath(bam_file_name)
    normal_file_path = OVARY_BASEFOLDER.joinpath(normal_file_name)#normal_file_name)
    bed_file_path = OVARY_BASEFOLDER.joinpath(bed_file_name)

    cnvs = parse_cnvs(calls_file_path)
    coverage = load_coverage_bed_on_cnvs(cnvs, bed_file_path, normal_file_path)

    return {"cnvCoverage": [*coverage]};

# @shelve_it('cache_coverage_sample_2.dat')
def load_coverage_sample( cnv_and_bed_and_basefolder_and_normal: str):
    input_split = cnv_and_bed_and_basefolder_and_normal.split(",")

    cnv_file_name = Path(input_split[0])
    bed_file_name = Path(input_split[1])
    OVARY_BASEFOLDER = Path(input_split[2])
    normal_file_name = Path(input_split[3])

    calls_file_path = OVARY_BASEFOLDER.joinpath(Path(cnv_file_name))
    cnvs = parse_cnvs(calls_file_path)

    normal_file_path = OVARY_BASEFOLDER.joinpath(normal_file_name)#normal_file_name)
    bed_file_path = OVARY_BASEFOLDER.joinpath(bed_file_name)

    cnvs = parse_cnvs(calls_file_path)
    coverage = load_coverage_bed_on_cnvs(cnvs, bed_file_path, normal_file_path)

    return {"cnvCoverage": [*coverage]};

# @shelve_it('cache_cnvs_sample_1.dat')
def load_cnv_sample( cnv_and_bed_and_snvs_and_basefolder_and_normal: str):
    input_split = cnv_and_bed_and_snvs_and_basefolder_and_normal.split(",")
    annotations_file_name = ANNOTATIONS_FILE_NAME
    cnv_file_name = Path(input_split[0])
    bed_file_name = Path(input_split[1])
    snv_file_name = Path(input_split[2])
    OVARY_BASEFOLDER = Path(input_split[3])
    normal_file_name = Path(input_split[4])

    calls_file_path = OVARY_BASEFOLDER.joinpath(Path(cnv_file_name))
    cnvs = parse_cnvs(calls_file_path)

    snv_file_path = OVARY_BASEFOLDER.joinpath(Path(snv_file_name))
    # BASEFOLDER.joinpath(snv_file_name)

    cnvs_with_snvs = add_snvs_to_cnvs(cnvs, snv_file_path)

    # coverage_file_path = OVARY_BASEFOLDER.joinpath(bam_file_name)
    normal_file_path = OVARY_BASEFOLDER.joinpath(normal_file_name) #normal_file_name)
    # cnvs_with_snvs_and_coverage = add_mean_coverage_to_cnvs(cnvs_with_snvs, coverage_file_path, normal_file_path)
    bed_file_path = OVARY_BASEFOLDER.joinpath(bed_file_name)

    annotations_file_path = BASEFOLDER.joinpath(annotations_file_name)
    cnvs_with_snvs_and_annotations = add_annotations_to_cnvs(cnvs_with_snvs, annotations_file_path)

    cnvs_with_snvs_downsampled_coverage_and_annotations = add_downsampled_coverage_bed_to_cnvs(cnvs_with_snvs_and_annotations, bed_file_path, normal_file_path)
    print("returning calls ")
    return {"calls": [*cnvs_with_snvs_downsampled_coverage_and_annotations]}




# for index_int in range(0, len(OVARY_CALLS_FILE_NAMES_B)):
#     cnv_file_name = str(OVARY_CALLS_FILE_NAMES_B[index_int])
#     bed_file_name = str(BED_FILE_NAMES_B[index_int])
#     snv_file_name = str(SNV_FILE_NAMES_B[index_int])
#     basefolder = str(OVARY_BASEFOLDER)
#     normal_file_name = str(COMPARISON_FILE)
#     shelving_key = cnv_file_name+ "," + bed_file_name + "," + basefolder + "," + normal_file_name
#     with shelve.open('cache_coverage_sample.dat') as d:
#         d.pop(shelving_key)