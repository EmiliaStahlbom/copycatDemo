from pathlib import Path
import unittest

import pytest

from copycat.import_methods import add_coverage_to_cnvs, add_downsampled_coverage_to_cnvs,  add_downsampled_coverage_bed_to_cnvs, add_snvs_to_cnvs, parse_cnvs

@pytest.mark.unittest
class BedLoad(unittest.TestCase):

    def test_add_coverage_to_cnv(self):
        base_folder = Path("/home/em-sta/data/pipeline/variant_calling/")
        # bam_path = base_folder.joinpath("PVAL_68_S2_dupmarked.bam")
        calls_path = base_folder.joinpath("cnvkit/SRR13577935-1/SRR13577935-1.call.cns")
        bed_file_path = base_folder.joinpath("cnvkit/SRR13577935-1/SRR13577935-1.targetcoverage.cnn")
        vcf_path = base_folder.joinpath("strelka/SRR13577935/SRR13577935.strelka.variants.vcf.gz")
        normal_file_path = base_folder.joinpath("cnvkit/SRR13577941-1/SRR13577941-1.call.cns")
        snv_file_path = base_folder.joinpath("strelka/SRR13577935/SRR13577935.strelka.variants.vcf.gz")


        base_folder = Path("/mnt/c/Users/em-sta/1000-genomesdata")
        calls_path = base_folder.joinpath("cnvkit/HG00122/HG00122.mapped.ILLUMINA.bwa.GBR.exome.20130415.bam.call.cns")
        annotations_path = Path("/home/em-sta/GRCh38_latest_genomic_sorted.gff.gz")
        vcf_path = base_folder.joinpath("strelka/HG00121/HG00121.strelka.variants.vcf.gz")
        
        bed_file_path = base_folder.joinpath("cnvkit/HG00122/HG00122.mapped.ILLUMINA.bwa.GBR.exome.20130415.bam.targetcoverage.cnn")
        normal_file_path = base_folder.joinpath("cnvkit/HG00121/HG00121.mapped.ILLUMINA.bwa.GBR.exome.20121211.bam.targetcoverage.cnn")

        cnvs = [{
            "chr": "chr1", 
            "start": 155014405, 
            "end": 164771172, 
            "copyRatio": "0.1" 
            }, 
            {
            "chr": "chr2", 
            "start": 15667204, 
            "end": 15946347, 
            "copyRatio": "0.1" 
            }]

        cnvs_with_added_coverage = add_downsampled_coverage_bed_to_cnvs(cnvs, bed_file_path, normal_file_path)
        first_cnv = next(cnvs_with_added_coverage)

        print(first_cnv)
        self.assertTrue(len(first_cnv) > 0)
        self.assertTrue(first_cnv["chr"] == "chr1")
        self.assertTrue(len(first_cnv["downsampledCoverage"]) > 0)
        # self.assertEqual(len(first_cnv["coverage"]), 2691544)

        # self.assertEqual(first_cnv["coverage"][400], 915)
        self.assertEqual(first_cnv["start"], 155014405)
        self.assertEqual(first_cnv["end"], 164771172)

        loaded_cnvs = add_snvs_to_cnvs(parse_cnvs(calls_path), vcf_path)
        loaded_cnvs_with_coverage =  add_downsampled_coverage_bed_to_cnvs(loaded_cnvs, bed_file_path, normal_file_path)
        first_cnv = next(cnvs_with_added_coverage)

        first_cnv_fileloaded = next(loaded_cnvs_with_coverage)

        #only include coverage above 50
        self.assertTrue(len(first_cnv_fileloaded) > 0)
        print(len(first_cnv_fileloaded["downsampledCoverage"]))
        # print(first_cnv_fileloaded)
        self.assertTrue(len(first_cnv_fileloaded["downsampledCoverage"]) > 1_000_000)
        second_cnv_loaded = next(loaded_cnvs_with_coverage)
        print(len(second_cnv_loaded["downsampledCoverage"]))
        self.assertTrue(len(second_cnv_loaded["downsampledCoverage"]) < 10_000)
        self.assertTrue(len(second_cnv_loaded["downsampledCoverage"]) > 0)

        # add position to coverage
        print(first_cnv_fileloaded["downsampledCoverage"][1])
        self.assertTrue(first_cnv_fileloaded["downsampledCoverage"][1]["pos"] >  20)
        # self.assertEqual(first_cnv_loaded["coverage"][7]["pos"], 155014381)
        # self.assertTrue(first_cnv_loaded["coverage"][7]["coverage"] > 50)


        # Downsample coverage
        print(len(first_cnv_fileloaded["downsampledCoverage"]))
        self.assertTrue(len(first_cnv_fileloaded["downsampledCoverage"]) < 1001)


        # cnvs_with_ds_coverage = add_downsampled_coverage_to_cnvs(loaded_cnvs_with_coverage, bam_path, normal_path)

        # first_cnv = next(cnvs_with_ds_coverage)
        # print(first_cnv)
        # self.assertTrue(len(first_cnv) > 0)
        # self.assertEqual(len(first_cnv), 7)
        # self.assertEqual(len(first_cnv["downsampledCoverage"]), 2)
        # self.assertEqual(first_cnv["downsampledCoverage"][0]["coverage"],  1769)

        # second_cnv = next(cnvs_with_ds_coverage)
        # self.assertEqual(second_cnv["downsampledCoverage"][0]["coverage"], 122.5)

        # cnvs_with_ds_coverage_and_snvs = add_snvs_to_cnvs(cnvs_with_ds_coverage, snv_file_path)

        # first_cnv_with_snvs = next(cnvs_with_ds_coverage_and_snvs)

        # self.assertTrue(len(first_cnv_with_snvs) > 0)