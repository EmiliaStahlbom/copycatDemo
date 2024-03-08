import * as d3 from "d3";
import {
    Annotation,
    AnnotationBar,
    Interval,
    NamedInterval,
} from "./common/common";

export function renderAnnotations(
    annotations: Annotation[],
    annotationBar: AnnotationBar,
    viewIntervals: NamedInterval[],
): void {
    const context = annotationBar.windowRef.current;
    const window: HTMLElement | null = annotationBar.container;
    const margin = annotationBar.margin ?? 5;
    const height = annotationBar.height ?? 20;
    const width = window ? Number(window.offsetWidth - 2 * margin) : 500;
    const graphHeight = height - 2 * margin;
    const graphWidth = width - 2 * margin;
    const exonHeight: number = 7;
    const geneHeight: number = 2;
    const minExonWidth: number = 2;

    const features: Annotation[] = annotations.filter((feature) =>
        ["gene", "pseudogene", "exon"].includes(feature.featureType),
    );
    const genes: Annotation[] = annotations.filter((feature) =>
        ["gene", "pseudogene"].includes(feature.featureType),
    );

    const domain: Interval = annotationBar.genomicInterval;

    const scaleX = d3
        .scaleLinear()
        .domain([domain.start, domain.end])
        .range([0, graphWidth])
        .nice();

    if (context === null) {
        return;
    }
    const graphSelection = d3.select(context);
    graphSelection.selectAll("*").remove();

    const xAxis = d3.axisBottom(scaleX).ticks(4);

    const zoom = d3.zoom<SVGSVGElement, unknown>().on("zoom", updateGraph);
    graphSelection.call(zoom);

    const axisX = graphSelection
        .append("g")
        .attr("transform", `translate(${margin} , ${graphHeight + margin})`);
    axisX.call(xAxis);

    // Create groups for all kinds of elements
    const SNVPileupRectContainer = graphSelection
        .attr("height", height)
        .append("g")
        .attr("class", "annotation");
    const geneNamesContainer = graphSelection
        .append("g")
        .attr("class", "gene-names");
    const viewIntervalContainer = graphSelection
        .append("g")
        .attr("class", "view-interval");

    // Graph updating and rendering
    function updateGraph(event: any) {
        const SNVPileupRectData =
      SNVPileupRectContainer.selectAll("rect").data(features);
        const newScaleX = event.transform.rescaleX(scaleX);
        axisX.call(d3.axisBottom(newScaleX).ticks(4));

        // Render annotation features
        SNVPileupRectData.join(
            (enter) =>
                enter
                    .append("rect")
                    .attr("fill", "blue")
                    .attr("width", (d) => {
                        const scaledWidth: number =
              newScaleX(d.genomicInterval.end) -
              newScaleX(d.genomicInterval.start);
                        const exonWidth: number =
              d3.max([scaledWidth, minExonWidth]) ?? minExonWidth;
                        return exonWidth;
                    }),
            (update) => update,
            (exit) => exit.remove(),
        )
            .attr("x", (d) => margin + newScaleX(d.genomicInterval.start))
            .attr("height", (d) => {
                return d.featureType === "exon" ? exonHeight : geneHeight;
            })
            .attr("y", (d) => {
                const offset: number =
          d.featureType === "exon" ? exonHeight : geneHeight;
                return margin + graphHeight / 2 - offset / 2;
            });

        geneNamesContainer
            .selectAll("text")
            .data(genes)
            .join(
                (enter) =>
                    enter
                        .append("text")
                        .attr("height", 5)
                        .attr("y", margin)
                        .text((d) => d.id),
                (update) => update,
                (exit) => exit.remove(),
            )
            .attr(
                "x",
                (d) =>
                    newScaleX(d.genomicInterval.start) +
          (newScaleX(d.genomicInterval.end) -
            newScaleX(d.genomicInterval.start)) /
            2,
            );

        // render view intervals
        viewIntervalContainer
            .selectAll("rect")
            .data(viewIntervals)
            .join(
                (enter) =>
                    enter
                        .append("rect")
                        .attr("height", geneHeight + 8)
                        .attr("y", () => {
                            const offset: number = geneHeight + 8;
                            return margin + graphHeight - offset / 2;
                        })
                        .attr("width", (d) => {
                            return newScaleX(d.end) - newScaleX(d.start);
                        })
                        .attr("class", (d) => `${d.name}-view-interval`),
                (update) => update,
                (exit) => exit.remove(),
            )
            .attr("x", (d) => margin + newScaleX(d.start));
    }
}
