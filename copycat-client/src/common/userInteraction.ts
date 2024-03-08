import { CoverageGraphProps, Interval } from "./common";
export interface NamedViewPropsSetter {
    key: string;
    hook: React.Dispatch<React.SetStateAction<CoverageGraphProps | undefined>>;
}

export function findViewProps(
    props: (CoverageGraphProps | undefined)[],
    key: string,
): CoverageGraphProps | undefined {
    return props.find((p) => p?.key === key);
}

export function findViewPropsSetter(
    propsSetter: NamedViewPropsSetter[],
    key: string,
): NamedViewPropsSetter | undefined {
    return propsSetter.find((p) => p.key === key);
}

export function calculatePanning(
    viewProps: CoverageGraphProps,
    event: React.MouseEvent,
): Interval {
    const interval: Interval = viewProps.genomicInterval;
    const zoomScaling: number = (interval.end - interval.start) / 400;
    const newInterval: Interval = {
        start: Math.floor(interval.start - event.movementX * zoomScaling),
        end: Math.floor(interval.end - event.movementX * zoomScaling),
    };
    return newInterval;
}

export function calculateZooming(
    viewProps: CoverageGraphProps,
    event: React.WheelEvent,
): Interval {
    const interval: Interval = viewProps.genomicInterval;
    const intervalChange: number = Math.floor(
        ((event.deltaY / 2) * (interval.end - interval.start)) / 500,
    );
    const newInterval: Interval = {
        start: interval.start - intervalChange,
        end: interval.end + intervalChange,
    };
    return newInterval;
}
