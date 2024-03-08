import { sum } from "d3";

import React from "react";
import { api } from "../services/api";
import { chromosomeName } from "./chromosomeTranslation";

export const AllValidBases = ["A", "C", "T", "G", "N"];
export const Bases = ["A", "C", "T", "G", "N"];
export type Base = typeof AllValidBases[number];
export const AllValidGeneticFeatures = [
    "exon",
    "region",
    "match",
    "biological_region",
    "silencer",
    "gene",
    "enhancer",
    "mRNA",
    "CDS",
    "lnc_RNA",
];
export type GeneticFeature = typeof AllValidGeneticFeatures[number];

export interface Annotation {
    genomicInterval: Interval;
    chr: string;
    featureType: string;
    source: string;
    id: string;
}

export interface AnnotationBar {
    genomicInterval: Interval;
    chromosome: string;
    container: HTMLElement | null;
    windowRef: React.RefObject<SVGSVGElement>;
    margin?: number;
    height?: number;
}

export interface ApiPileup {
    index: number;
    baseCounts: BaseCount[];
    genomicPosition: number;
}

export interface BaseCount {
    base: Base;
    count: number;
}

export interface CnvCall {
    chromosome: string;
    genomicInterval: Interval;
    log2CopyRatio: number;
    score?: number;
    snvCalls: SnvCall[];
    meanCoverage: number;
    coverageWindows?: CoverageWindow[];
    annotations: Annotation[];
    id: number;
    downsampledCoverage?: CoveragePosition[];
    nProbes?: number;
}


export interface CaseCalls {
    calls: CnvCall[]
    caseIndex: number;
}
/**
 * Defines the parameters for rendering
 */
export interface CoverageGraphProps {
    alleleFractionThreshold: number;
    genomicInterval: Interval;
    chromosome: string;
    container?: HTMLElement | null;
    windowRef: React.RefObject<SVGSVGElement>;
    margin?: number;
    height?: number;
    marginWidth?: number;
    baseColor: boolean;
    key: string;
}

export interface CoveragePosition {
    coverage: number;
    pos: number;
    coverage_diff: number;
}

export interface CoverageWindow {
    coverage: CoveragePosition[];
}

export interface Interval {
    start: number;
    end: number;
}

export interface NamedInterval extends Interval {
    name: string;
}

export interface PileupAndReference {
    key: string;
    pileup: Pileup[];
    referenceGenome: Base[];
}

export interface VafGraph {
    container: HTMLElement | null;
    windowRef: React.RefObject<SVGSVGElement>;
    margin?: number;
    height?: number;
}

export interface SnvCall {
    chr: string;
    position: number;
    reference: Base;
    alternative: Base[][];
    alleleFrequency: number[];
}

export class Pileup {
    private pileupData: ApiPileup;

    index: number;

    genomicPosition: number;

    constructor(pileup: ApiPileup) {
        this.pileupData = pileup;
        this.index = pileup.index;
        this.genomicPosition = pileup.genomicPosition;
    }

    getCoverage(): number {
        return sum(
            this.pileupData.baseCounts.map((base) => {
                return base.count;
            }),
        );
    }

    getBaseCoverage(base: Base): number {
        let coverage: number = 0;
        this.pileupData.baseCounts.forEach((pileupBase) => {
            if (pileupBase.base == base) {
                coverage = pileupBase.count;
            }
        });

        return coverage;
    }

    getAlleleFraction(base: Base) {
        const alleleFraction = this.getBaseCoverage(base) / this.getCoverage();
        return alleleFraction;
    }
}

export function countBases(bases: string[]): BaseCount[] {
    let baseCounts: BaseCount[] = [];

    AllValidBases.forEach((baseName) => {
        let baseCount = 0;
        if (bases.length === 0) {
            return;
        }
        bases.forEach((base) => {
            if (baseName === base.toUpperCase()) baseCount++;
        });
        baseCounts.push({ count: baseCount, base: baseName });
    });
    return baseCounts;
}

export function getAlternativeAllele(pileup: Pileup, referenceAllele: Base) {
    let bases: Base[] = [...Bases];
    bases = bases.filter((base) => {
        return base !== referenceAllele;
    });
    let maxCoverage: number = 0;
    let alternativeBase: Base = "N";
    bases.forEach((base) => {
        const coverage: number = pileup.getBaseCoverage(base);
        if (coverage > maxCoverage) {
            maxCoverage = coverage;
            alternativeBase = base;
        }
    });

    return alternativeBase;
}

export function detectSNVs(
    coveragePileups: Pileup[],
    referenceGenome: Base[],
    alleleFractionThreshold: number = 0.8,
    coverageThreshold: number = 20,
) {
    const SNVPileups = coveragePileups.filter((pileup) => {
        if (pileup.getCoverage() < coverageThreshold) return false;
        const referenceAllele = referenceGenome[pileup.index];
        const alleleFraction = pileup.getAlleleFraction(referenceAllele);
        return alleleFraction < alleleFractionThreshold;
    });
    return SNVPileups;
}

export function findMaxCoverage(pileups: Pileup[][]): number {
    let localMaxCoverage = 0;
    pileups.forEach((pileup) => {
        for (const pile of pileup) {
            const coverage = pile.getCoverage();
            if (coverage > localMaxCoverage) localMaxCoverage = coverage;
        }
    });
    return localMaxCoverage;
}

export async function loadData(
    graphProps: CoverageGraphProps,
): Promise<{ pileup: Pileup[]; referenceGenome: Base[] }> {
    const buffer: number = 3000;
    const intervalStart: number = graphProps.genomicInterval.start;
    const intervalEnd: number = graphProps.genomicInterval.end;
    const start: string = Math.floor(intervalStart - buffer).toString();
    const end: string = Math.floor(intervalEnd + buffer).toString();
    const chromosome: string = graphProps.chromosome;
    const other: string = (graphProps.key === "sample").toString();
    let newPileup: Pileup[] = [];

    const responsePileup = await api.getPileup(chromosome, start, end, other);
    responsePileup.pileup.forEach((position) => {
        const ApiPileup: ApiPileup = {
            baseCounts: countBases(position.bases),
            index: position.position - (intervalStart - buffer),
            genomicPosition: position.position,
        };
        const pileup = new Pileup(ApiPileup);
        newPileup.push(pileup);
    });

    const ncChromosomeName = chromosomeName(chromosome);

    const responseReference = await api.getReference(
        ncChromosomeName,
        start,
        end,
    );
    const newReference = responseReference.reference.map((current_base) => {
        return current_base ?? "N";
    });

    return { pileup: newPileup, referenceGenome: newReference };
}

export async function loadAnnotations(
    annotationViewProps: AnnotationBar,
    setAnnotationData: React.Dispatch<
    React.SetStateAction<Annotation[] | undefined>
    >,
) {
    const ncChromosomeName = chromosomeName(annotationViewProps.chromosome);
    const response = await api.getAnnotations(
        ncChromosomeName,
        annotationViewProps?.genomicInterval.start?.toString() ?? "0",
        annotationViewProps?.genomicInterval.end?.toString() ?? "10000",
    );
    let newAnnotations: Annotation[] = [];
    response.annotations.forEach((feature) => {
        newAnnotations.push({
            genomicInterval: { start: feature.start, end: feature.end },
            chr: feature.chr,
            featureType: feature.type,
            source: feature.source,
            id: feature.id,
        });
    });

    setAnnotationData(newAnnotations);
}

// export async function loadSnvs(
// ):Promise<SnvCall[]>{

//     const response = await api.getSnvs();
//     let newSnvs: SnvCall[] = [];
//     response.calls.forEach((call) => {
//         const alternativeBases: string[] = call.alternative.split(",");
//         newSnvs.push({
//             chr: call.chr,
//             position: call.position,
//             reference: call.reference,
//             alternative: alternativeBases.map(alternative => alternative.split("")),
//             alleleFrequency: call.alleleFrequencies,
//         });
//     });

//     return newSnvs;
// }
