from pathlib import Path
import unittest

import pytest

from copycat.import_methods import add_annotations_to_cnvs, add_coverage_to_cnvs, add_snvs_to_cnvs, parse_cnvs

@pytest.mark.unittest
class BamParsingTest(unittest.TestCase):

    def test_add_coverage_to_cnv(self):
        base_folder = Path("/home/em-sta/data/pipeline/variant_calling")
        calls_path = base_folder.joinpath("cnvkit/SRR13577935-1/SRR13577935-1.call.cns")
        bed_file_path = base_folder.joinpath("cnvkit/SRR13577935-1/SRR13577935-1.targetcoverage.cnn")
        vcf_path = base_folder.joinpath("strelka/SRR13577935/SRR13577935.strelka.variants.vcf.gz")
        normal_file_path = base_folder.joinpath("cnvkit/SRR13577941-1/SRR13577941-1.call.cns")
        snv_file_path = base_folder.joinpath("strelka/SRR13577935/SRR13577935.strelka.variants.vcf.gz")
        annotations_path = Path("/home/em-sta/testData/GRCh38_latest_genomic_sorted.gff.gz")

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

        annotations = add_annotations_to_cnvs(cnvs, annotations_path)
        annotations_first = next(annotations)

        self.assertTrue(len(annotations_first) > 0)
        self.assertTrue(len(annotations_first["annotations"]) > 0)

        print(type(annotations_first["annotations"]))
        self.assertTrue(type(annotations_first["annotations"]) == list)
        print(annotations_first["annotations"][0]["id"])
        self.assertEqual(annotations_first["annotations"][0]["chr"], "NC_000001.11")
        self.assertEqual(annotations_first["annotations"][0]["start"], 1)
        self.assertEqual(annotations_first["annotations"][0]["end"], 248956422)
        self.assertEqual(annotations_first["annotations"][0]["type"], "region")
        self.assertEqual(annotations_first["annotations"][0]["source"], "RefSeq")
        self.assertEqual(annotations_first["annotations"][0]["id"], "NC_000001.11:1..248956422")

        loaded_calls = parse_cnvs(calls_path)

        loaded_calls_with_annotations = add_annotations_to_cnvs(loaded_calls, annotations_path)

        first_loaded = next(loaded_calls_with_annotations)

        self.assertTrue(len(first_loaded["annotations"]) > 0)