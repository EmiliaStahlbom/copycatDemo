export const chromosomeName = (inputName: string) => {
    switch (inputName) {
        case "chr1":
            return "NC_000001.11";
        case "chr2":
            return "NC_000002.12";
        case "chr3":
            return "NC_000003.12";
        case "chr4":
            return "NC_000004.12";
        case "chr5":
            return "NC_000005.10";
        case "chr6":
            return "NC_000006.12";
        case "chr7":
            return "NC_000007.14";
        case "chr8":
            return "NC_000008.11";
        case "chr9":
            return "NC_000009.12";
        case "chr10":
            return "NC_0000010.11";
        case "chr11":
            return "NC_0000011.10";
        case "chr12":
            return "NC_0000012.12";
        case "chr13":
            return "NC_0000013.11";
        case "chr14":
            return "NC_0000014.9";
        case "chr15":
            return "NC_0000015.10";
        case "chr16":
            return "NC_0000016.10";
        case "chr17":
            return "NC_0000017.11";
        case "chr18":
            return "NC_0000018.10";
        case "chr19":
            return "NC_0000019.10";
        case "chr20":
            return "NC_000002.11";
        case "chr21":
            return "NC_0000021.9";
        case "chr22":
            return "NC_0000022.11";
        case "chrX":
            return "NC_0000023.11";
        case "chrY":
            return "NC_0000024.10";
        default:
            return "none";
    }
};
