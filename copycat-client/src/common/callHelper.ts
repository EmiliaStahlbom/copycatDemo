import { Annotation, Interval } from "./common";

export const calculateExonLength = (features: Annotation[], genomicInterval: Interval) => {
    let sortedExons: Annotation[] = features.filter(feature => feature.featureType==="exon").sort(feature => feature.genomicInterval.start) 
    let endOfPreviousExon = 0;
    let totalExonLength: number = 0;

    sortedExons.forEach(exon => {
        // let regionAddLength: number = exon.genomicInterval.end - exon.genomicInterval.start;
        let trimmedExonInterval = exon.genomicInterval
        if (exon.genomicInterval.start < endOfPreviousExon || exon.genomicInterval.start < genomicInterval.start) {
            trimmedExonInterval.start = Math.max(endOfPreviousExon, genomicInterval.start)
            //sutract overlap
            // regionAddLength -= (endOfPreviousExon - exon.genomicInterval.start);
            }
        if (exon.genomicInterval.end > genomicInterval.end){
            trimmedExonInterval.end = genomicInterval.end;
        }

        endOfPreviousExon = trimmedExonInterval.end
        totalExonLength += trimmedExonInterval.end - trimmedExonInterval.start;
        }
    )
    return totalExonLength
}