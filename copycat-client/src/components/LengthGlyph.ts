import * as d3 from "d3";
import { Interval } from "src/common/common";
import "./LengthGlyph.scss";

export function DrawLengthGlyph(interval: Interval, context: SVGSVGElement | null) {

    const selection = d3.select(context);
    selection.selectAll("*").remove();
    const glyphWidth = 50;
    const height = 5;

    const xScale = d3.scaleLog().domain([100, 10000000]).range([0, glyphWidth]);
    const xAxis = d3.axisBottom(xScale).tickValues([100, 1000, 10000, 100000, 1000000, 10000000]);

    selection.append("g")
        .call(xAxis)
        .attr("transform", `translate(0, ${2 * height})`);
        

    selection.append("g")
        
        .append("rect")
        .attr("width", xScale(interval.end - interval.start))
        .attr("height", height)
        .attr("fill", "darkgreen");
}

export function drawLengthGlyphSector(context: SVGSVGElement, interval: Interval) {

    const selection = d3.select(context);
    selection.selectAll("*").remove();
    const glyphWidth = 50;
    const height = 5;
    const angle = Math.PI / 16;

    const xScale = d3.scaleLog().domain([100, 10000000]).range([0, glyphWidth]);

    selection.append("g")
        
        .append("path")
        .attr(
            "d",
            d3.arc<any, any>()
                .startAngle(Math.PI / 2)
                .endAngle(Math.PI / 2 - angle)
                .outerRadius(xScale(interval.end - interval.start))
                .innerRadius(0),
        )
        .attr("fill", "darkgreen")
        .attr("transform", `translate(0, ${3 * height})`);

    selection.append("g").append("text")
    .attr("transform", `translate(0, ${6 * height})`)
    .text(intervalToHumanReadLength(interval))
    .attr("color", "black")
}

function intervalToHumanReadLength(interval: Interval) {
    const length = interval.end - interval.start;


        return (length/1000).toFixed(1) + " kb"
}