from pathlib import Path
import unittest

import pytest

from copycat.import_methods import add_coverage_to_cnvs, add_downsampled_coverage_to_cnvs, add_snvs_to_cnvs, parse_cnvs

@pytest.mark.unittest
class BamParsingTest(unittest.TestCase):

    def test_add_coverage_to_cnv(self):
        base_folder = Path("/home/em-sta")
        # bam_path = base_folder.joinpath("PVAL_68_S2_dupmarked.bam")
        # calls_path = base_folder.joinpath("PVAL_68_S2_calledCNVs.seg")
        # vcf_path = base_folder.joinpath("PVAL_68_S2_filtered.vcf.gz")
        # normal_path = base_folder.joinpath("PVAL_66_S3_dupmarked.bam")
        # snv_file_path = base_folder.joinpath("PVAL_68_S2_filtered.vcf.gz")

        # cnvs = [{
        #     "chr": "chr1", 
        #     "start": 155014405, 
        #     "end": 164771172, 
        #     "copyRatio": "0.1" 
        #     }, 
        #     {
        #     "chr": "chr2", 
        #     "start": 15667204, 
        #     "end": 15946347, 
        #     "copyRatio": "0.1" 
        #     }]

        # cnvs_with_added_coverage = add_coverage_to_cnvs(cnvs, bam_path, normal_path)
        # first_cnv = next(cnvs_with_added_coverage)

        # # print(first_cnv)
        # self.assertTrue(len(first_cnv) > 0)
        # self.assertTrue(first_cnv["chr"] == "chr1")
        # self.assertTrue(len(first_cnv["coverage"]) > 0)
        # # self.assertEqual(len(first_cnv["coverage"]), 2691544)

        # # self.assertEqual(first_cnv["coverage"][400], 915)
        # self.assertEqual(first_cnv["start"], 155014405)
        # self.assertEqual(first_cnv["end"], 164771172)

        # loaded_cnvs = add_snvs_to_cnvs(parse_cnvs(calls_path), vcf_path)
        # loaded_cnvs_with_coverage = add_coverage_to_cnvs(loaded_cnvs, bam_path, normal_path)

        # first_cnv_fileloaded = next(loaded_cnvs_with_coverage)

        # #only include coverage above 50
        # self.assertTrue(len(first_cnv_fileloaded) > 0)
        # print(len(first_cnv_fileloaded["coverage"]))
        # self.assertTrue(len(first_cnv_fileloaded["coverage"]) < 1_000_000)
        # second_cnv_loaded = next(loaded_cnvs_with_coverage)
        # print(len(second_cnv_loaded["coverage"]))
        # self.assertTrue(len(second_cnv_loaded["coverage"]) < 10_000)
        # self.assertTrue(len(second_cnv_loaded["coverage"]) > 0)

        # # add position to coverage
        # print(first_cnv_fileloaded["coverage"][1])
        # self.assertTrue(first_cnv_fileloaded["coverage"][1][1]["pos"] >  20)
        # # self.assertEqual(first_cnv_loaded["coverage"][7]["pos"], 155014381)
        # # self.assertTrue(first_cnv_loaded["coverage"][7]["coverage"] > 50)


        # # Downsample coverage
        # print(len(first_cnv_fileloaded["coverage"]))
        # self.assertTrue(len(first_cnv_fileloaded["coverage"]) < 1001)


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