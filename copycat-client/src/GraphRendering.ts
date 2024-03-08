import * as d3 from "d3";
import {
    Pileup,
    Base,
    Interval,
    getAlternativeAllele as getAlternativeBase,
    CoverageGraphProps,
    detectSNVs,
} from "./common/common";

export class Drawer {
    windowInterval: Interval;

    margin: number;

    width: number;

    height: number;

    baseColor: boolean;

    constructor(drawerSettings: DrawerSettings) {
        this.windowInterval = drawerSettings.windowInterval ?? { start: 0, end: 1 };
        this.margin = drawerSettings.margin ?? 40;
        this.width = drawerSettings.width;
        this.height = drawerSettings.height ?? this.width / 2;
        this.baseColor = drawerSettings.baseColor ?? false;
    }

    draw(context: SVGSVGElement, referenceGenome?: Base[]): void {}

    setPileup(pileup: Pileup[]): void {}
}

export interface DrawerSettings {
    windowInterval?: Interval;
    margin?: number;
    width: number;
    height?: number;
    baseColor?: boolean;
}

function rescaleInterval(newScaleX: d3.ScaleLinear<number, number, never>) {
    const newInterval: Interval = {
        start: Math.floor(newScaleX.domain()[0]),
        end: Math.ceil(newScaleX.domain().at(-1)!),
    };
    return newInterval;
}

export class CoverageDrawer extends Drawer {
    maxCoverage?: number;

    pileup: Pileup[];

    SnvPileup?: Pileup[];

    referenceGenome?: Base[];

    constructor(
        drawerSettings: DrawerSettings,
        pileup: Pileup[],
        maxCoverage?: number,
        SnvPileup?: Pileup[],
        referenceGenome?: Base[],
    ) {
        super(drawerSettings);
        this.pileup = pileup;
        this.maxCoverage = maxCoverage;
        this.SnvPileup = SnvPileup;
        this.referenceGenome = referenceGenome;
    }

    draw(context: SVGSVGElement) {
        const graphWindow = d3.select(context);
        const maxCoverage =
      this.maxCoverage ??
      d3.max(
          this.pileup.map((pileup) => {
              return pileup.getCoverage();
          }),
      ) ??
      120;
        const rawData: Pileup[] = this.pileup;
        let renderData: Pileup[] = rawData;
        const rawSnvData: Pileup[] | undefined = this.SnvPileup;

        graphWindow
            .attr("height", this.height)
            .attr("width", this.width)
            .append("g")
            .attr("transform", "translate(" + this.margin + "," + this.margin + ")")
            .attr("color", "white");

        // Axes
        const scaleY = d3
            .scaleLinear()
            .domain([maxCoverage, 0])
            .range([this.margin, this.height - this.margin]);
        const scaleX = d3
            .scaleLinear()
            .domain([this.windowInterval.start, this.windowInterval.end])
            .range([0, this.width - 2 * this.margin]);
        let yAxisFormat = d3.axisLeft(scaleY).ticks(4);
        let xAxisFormat = d3.axisBottom(scaleX).ticks(2);

        let zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", updateGraph);

        // Y axis
        graphWindow
            .append("g")
            .attr("transform", "translate(" + this.margin + ", 0)")
            .call(yAxisFormat);
        const xAxis = graphWindow
            .append("g")
            .attr("class", "x-axis")
            .attr(
                "transform",
                "translate(" +
          this.margin +
          ", " +
          (this.height - this.margin + 1) +
          ")",
            )
            .call(xAxisFormat);

        graphWindow.call(zoom);

        const snvContainer = graphWindow.append("g").attr("class", "snv-container");
        const snvReferenceContainer = snvContainer.append("g");
        const snvAlternateContainer = snvContainer.append("g");
        const coverageContainer = graphWindow
            .append("g")
            .attr("class", "coverage-container");

        const margin = this.margin;
        const height = this.height;
        const graphHeight = height - 2 * margin;
        const referenceGenome = this.referenceGenome;
        const baseColor = this.baseColor;

        //Updates view and renders it
        function updateGraph(event: any) {
            const newScaleX: d3.ScaleLinear<number, number, never> =
        event.transform.rescaleX(scaleX);

            const newInterval: Interval = rescaleInterval(newScaleX);

            renderData = rawData.filter((pileup: Pileup) => {
                return (
                    pileup.genomicPosition > newInterval.start &&
          pileup.genomicPosition < newInterval.end
                );
            });

            const downsamplingThreshold: number = 1000;
            let downsamplingFactor: number = 2;
            if (renderData.length > downsamplingThreshold) {
                if (renderData.length > 10000000) {
                    downsamplingFactor = 500;
                }
                if (renderData.length > 1000000) {
                    downsamplingFactor = 100;
                }
                if (renderData.length > 100000) {
                    downsamplingFactor = 30;
                }
                if (renderData.length > 10000) {
                    downsamplingFactor = 10;
                }
                renderData = renderData.filter(
                    (pileup) => pileup.index % downsamplingFactor === 0,
                );
            }

            xAxis.call(d3.axisBottom(newScaleX).ticks(2));

            // coverage graph
            const pileupRect = coverageContainer.selectAll("rect").data(renderData);

            pileupRect
                .join(
                    (enter) =>
                        enter
                            .append("rect")
                            .attr("fill", "silver")
                            .attr("opacity", 0.2)
                            .attr("width", 2)
                            .attr("class", "coverage-bar"),

                    (update) => update,

                    (exit) => exit.remove(),
                )
                .attr("x", (d) => {
                    return newScaleX(d.genomicPosition) + margin;
                })
                .attr("height", (d) => {
                    return height - margin - scaleY(d.getCoverage());
                })
                .attr("y", (d) => {
                    return scaleY(d.getCoverage());
                });

            // Draw allele frequencies
            let filteredSnvData: Pileup[] = [];
            if (rawSnvData !== undefined && referenceGenome !== undefined) {
                filteredSnvData = rawSnvData.filter((pileup: Pileup) => {
                    return (
                        pileup.genomicPosition > newInterval.start &&
            pileup.genomicPosition < newInterval.end
                    );
                });
            }
            const snvRectRef = snvReferenceContainer.selectAll("rect").data(filteredSnvData);      
            const snvRectAlt = snvAlternateContainer.selectAll("rect").data(filteredSnvData);
            snvRectRef
                .join(
                    (enter) => 
                        enter
                            .append("rect")
                            .attr("class", (d) => {
                                const originalBase: Base = referenceGenome
                                    ? referenceGenome[d.index]
                                    : "N";
                                return baseColor ? `snv-${originalBase}` : "snv-original-base";
                            })
                            .attr("width", 4)
                            .attr("opacity", (d) => {
                                const coverage: number = d.getCoverage();
                                const opacity: number = d3.min([coverage / 20, 1]) ?? 0;
                                return opacity;
                            }),
                    // .on("mouseover", (event, d) => {
                    //   const [x, y] = d3.pointer(event);
                    //   const referenceAllele: Base = referenceGenome[d.index];
                    //   tooltip.attr("x", x).attr("y", y);
                    //   tooltipText
                    //     .attr("opacity", 1)
                    //     .attr("x", x)
                    //     .attr("y", y)
                    //     .text(d.getAlleleFraction(referenceAllele));
                    // })
                    // .on("mousemove", (event) => {
                    //   const [x, y] = d3.pointer(event);
                    //   tooltip.attr("x", x).attr("y", y);
                    //   tooltipText.attr("x", x).attr("y", y);
                    // })
                    // .on("mouseout", () =>
                    //   tooltipText.attr("opacity", 0).attr("x", "0").attr("y", "0")
                    // ),
                    (update) => update,
                    (exit) => exit.remove(),
                )
                .attr("x", (d) => {
                    return newScaleX(d.genomicPosition) + margin;
                })
                .attr("height", (d) => {
                    const referenceAllele: Base = referenceGenome
                        ? referenceGenome[d.index]
                        : "N";
                    return graphHeight * d.getAlleleFraction(referenceAllele);
                })
                .attr("y",  margin);

            snvRectAlt
                .join(
                    (enter) =>
                        enter
                            .append("rect")
                            .attr("class", (d) => {
                                const alternativeBase: Base = getAlternativeBase(
                                    d,
                                    referenceGenome ? referenceGenome[d.index] : "N",
                                );
                                return baseColor
                                    ? `snv-${alternativeBase}`
                                    : "snv-alternative-base";
                            })
                            .attr("opacity", (d) => {
                                const coverage: number = d.getCoverage();
                                const opacity: number = d3.min([coverage / 20, 1]) ?? 0;
                                return opacity;
                            }),
                    // .on("mouseover", (event, d) => {
                    //   const [x, y] = d3.pointer(event);
                    //   const referenceAllele: Base = referenceGenome[d.index];
                    //   tooltipText
                    //     .attr("opacity", 1)
                    //     .attr("x", x)
                    //     .attr("y", y)
                    //     .text(1 - d.getAlleleFraction(referenceAllele));
                    // })
                    // .on("mousemove", (event) => {
                    //   const [x, y] = d3.pointer(event);
                    //   tooltipText.attr("x", x).attr("y", y);
                    // })
                    // .on("mouseout", () =>
                    //   tooltipText.attr("opacity", 0).attr("x", "0").attr("y", "0")
                    (update) => update,
                    (exit) => exit.remove(),
                )
                .attr("x", (d) => {
                    return newScaleX(d.genomicPosition) + margin;
                })
                .attr("height", (d) => {
                    const referenceAllele: string = referenceGenome
                        ? referenceGenome[d.index]
                        : "N";
                    return graphHeight * (1 - d.getAlleleFraction(referenceAllele));
                })
                .attr("y", (d) => {
                    const referenceAllele = referenceGenome
                        ? referenceGenome[d.index]
                        : "N";
                    return margin + graphHeight * d.getAlleleFraction(referenceAllele);
                })
                .attr("width", 4);
        }
    }
}

export function coverageDrawerSettings(
    graphProps: CoverageGraphProps,
): DrawerSettings {
    const mainWindow = graphProps.container;
    const margin = graphProps.margin ? graphProps.margin : 40;
    const marginWidth = graphProps.marginWidth ?? margin;
    const width = mainWindow
        ? Number(mainWindow.offsetWidth - 2 * marginWidth)
        : 500;
    const height = 150; // 0.5*width - margin;

    const viewInterval = graphProps.genomicInterval;

    const drawerSettings: DrawerSettings = {
        windowInterval: viewInterval,
        margin: margin,
        width: width,
        height: height,
        baseColor: graphProps.baseColor,
    };

    return drawerSettings;
}

export function alleleFractionDrawerSettings(
    graphProperties: CoverageGraphProps,
): DrawerSettings {
    const margin = graphProperties.margin ? graphProperties.margin : 40;
    const marginWidth = graphProperties.marginWidth ?? margin;
    const window = graphProperties.container;
    const width = window ? Number(window.offsetWidth - 2 * marginWidth) : 500;
    const height = 150; // 0.5 * width - margin;
    const viewInterval = graphProperties.genomicInterval;

    const drawerSettings: DrawerSettings = {
        windowInterval: viewInterval,
        margin: margin,
        width: width,
        height: height,
        baseColor: graphProperties.baseColor,
    };

    return drawerSettings;
}

export function renderCoverageFigure(
    graphProps: CoverageGraphProps,
    pileup: Pileup[],
    referenceGenome: Base[],
    maxCoverage: number,
) {
    if (
        pileup.length > 0 &&
    graphProps.windowRef.current &&
    referenceGenome.length > 0
    ) {
        const drawerSettings = coverageDrawerSettings(graphProps);
        const SNVBasepairs = detectSNVs(
            pileup,
            referenceGenome,
            graphProps.alleleFractionThreshold,
        );

        const coverageDrawer = new CoverageDrawer(
            drawerSettings,
            pileup,
            maxCoverage,
            SNVBasepairs,
            referenceGenome,
        );

        const context = graphProps.windowRef.current;

        //clear canvas
        d3.select(context).selectAll("*").remove();

        // do drawing
        coverageDrawer.draw(context);
    }
}
