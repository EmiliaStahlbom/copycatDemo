
from pathlib import Path
import unittest


import pytest

from copycat.import_methods import add_snvs_to_cnvs


@pytest.mark.unittest
class VcfParsingTest(unittest.TestCase):

    def test_parse_simple_range_query_from_vcf(self):
        base_folder = Path("/home/em-sta/data/pipeline/variant_calling")
        vcf_path = base_folder.joinpath("strelka/SRR13577935/SRR13577935.strelka.variants.vcf.gz")

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

        cnvs_with_snvs = add_snvs_to_cnvs(cnvs, vcf_path)
            
        first_cnv = next(cnvs_with_snvs)

        print(first_cnv)
        self.assertTrue(len(first_cnv["snvs"]) > 0)
        self.assertEqual(first_cnv["snvs"][0]["chr"], "chr1")
        second_cnv = next(cnvs_with_snvs)
        print(second_cnv)
        # self.assertEqual(second_cnv["snvs"][0]["chr"], "chr2")
        # self.assertEqual(second_cnv["snvs"][0]["position"],  15667513)
        # self.assertEqual(second_cnv["snvs"][0]["reference"], "A")
        # self.assertEqual(second_cnv["snvs"][0]["alternatives"], ('C',))
        # self.assertEqual(second_cnv["snvs"][0]["alleleFrequencies"], (0.9570000171661377,))



