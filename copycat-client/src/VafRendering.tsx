import * as d3 from "d3";
import { Base, detectSNVs, Pileup, VafGraph } from "./common/common";
import { DrawerSettings } from "./GraphRendering";

export function renderVafFigure(
    viewProps: VafGraph,
    pileups: Pileup[],
    referenceGenome: Base[],
): void {
    const SNVs: Pileup[] = detectSNVs(pileups, referenceGenome, 0.9);
    const sortedSNVs: Pileup[] = SNVs.sort((pileup1, pileup2) => {
        const alleleFraction1 = pileup1.getAlleleFraction(referenceGenome[pileup1.index]);
        const alleleFraction2 = pileup2.getAlleleFraction(referenceGenome[pileup2.index]);
        return alleleFraction1 - alleleFraction2;
    });
    const mainWindow = viewProps.container;
    const margin = viewProps.margin ? viewProps.margin : 40;
    const width = mainWindow?.offsetWidth
        ? mainWindow.offsetWidth - 2 * margin
        : 500;
    const height = 150;
    const drawerSettings: DrawerSettings = {
        margin: margin,
        width: width,
        height: height,
    };
    const context = viewProps.windowRef.current;
    drawVafFigure(context, drawerSettings, sortedSNVs, referenceGenome);
}

function drawVafFigure(
    context: SVGSVGElement | null,
    drawerSettings: DrawerSettings,
    SNVs: Pileup[],
    referenceGenome: Base[],
): void {
    const margin = drawerSettings.margin ?? 40;
    const height = drawerSettings.height ?? 60;
    const width = drawerSettings.width;
    const graphHeight = height - 2 * margin;
    const numberOfSNVs: number = SNVs.length;

    const scaleX = d3
        .scaleLinear()
        .domain([0, numberOfSNVs])
        .range([0, drawerSettings.width - 2 * margin]);
    const scaleY = d3.scaleLinear().domain([0, 100]).range([graphHeight, 0]);

    const xAxis = d3.axisBottom(scaleX).ticks(2);
    const yAxis = d3.axisLeft(scaleY).ticks(4);

    const graphSelection = d3.select(context);
    graphSelection.selectAll("*").remove();
    graphSelection
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr(
            "transform",
            "translate(" + margin + ", " + (graphHeight + margin) + ")",
        )
        .call(xAxis);
    graphSelection
        .append("g")
        .attr("transform", `translate( ${margin}, ${margin} )`)
        .call(yAxis);
    graphSelection
        .append("g")
        .attr(
            "transform",
            `translate( ${drawerSettings.width / 2 - 2 * margin}, ${margin})`,
        )
        .append("text")
        .text("Variant allele frequencies")
        .attr("fill", "black")
        .attr("font-size", 14);

    const SNVPileupRect = graphSelection
        .append("g")
        .attr("class", "vaf-container")
        .selectAll("rect")
        .data(SNVs);

    // allele frequency rendering
    SNVPileupRect.enter()
        .append("rect")
        .attr("x", (d, i) => {
            return scaleX(i) + margin;
        })
        .attr("height", (d) => {
            const referenceAllele: string = referenceGenome[d.index];
            return graphHeight * (1 - d.getAlleleFraction(referenceAllele));
        })
        .attr("y", (d) => {
            const referenceAllele = referenceGenome[d.index];
            return margin + graphHeight * d.getAlleleFraction(referenceAllele);
        })
        .attr("class", "snv-alternative-base")
        .attr("opacity", (d) => {
            const coverage: number = d.getCoverage();
            const opacity: number = d3.min([coverage / 20, 1]) ?? 0;
            return opacity;
        })
        .attr("width", 4);

    SNVPileupRect.exit().remove();
}