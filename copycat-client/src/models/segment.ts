export interface ApiSegments {
    segments: Segment[];
}

export interface Segment {
    start: number;
    end: number;
    chr: string;
    copyRatio: number;
}

export interface ApiBins {
    bins: Bin[];
}

export interface Bin {
    start: number;
    end: number;
    chr: string;
    copyRatio: number;
}

export interface ApiPileup {
    pileup: Pileup[];
}

export interface Pileup {
    bases: string[];
    position: number;
}

export interface ApiReference {
    reference: string[];
}

export interface ApiInterval {
    start: number;
    end: number;
}

export interface Annotation {
    start: number;
    end: number;
    chr: string;
    type: string;
    source: string;
    id: string;
}

export interface ApiAnnotations {
    annotations: Annotation[];
}

export interface CnvCall {
    chr: string;
    start: number;
    end: number;
    copyRatio: number;
    snvs: SnvCall[];
    meanCoverage: number;
    coverage?: CoverageWindow[];
    annotations: Annotation[];
    downsampledCoverage?: CoveragePosition[];
    nProbes?: number;
}

export interface CoverageWindow {
    coverage: CoveragePosition[];
}

export interface CnvCoverage {
    coverageWindows: CoverageWindow[];
}

export interface ApiCnvCoverage {
    cnvCoverage: CnvCoverage[];
}

export interface CoveragePosition {
    pos: number;
    coverage: number;
    coverage_diff: number;
}

export interface ApiCnvCalls {
    calls: CnvCall[];
}

export interface SnvCall {
    chr: string;
    position: number;
    reference: string;
    alternatives: string[];
    alleleFrequencies: number[];
}

export interface ApiSnvCalls {
    calls: SnvCall[];
}
