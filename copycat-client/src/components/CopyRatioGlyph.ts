import * as d3 from "d3";
import "./CopyRatioGlyph.scss";

export function drawCopyRatioGlyph(context: SVGSVGElement, log2CopyRatio: number ) {
    const selection = d3.select(context);
    selection.selectAll("*").remove();
    const totalHeight = 90
    const margin = 10;

    let [numerator, denominator] = log2To2BasedCopyNumber(log2CopyRatio);
    if (numerator > 75) {numerator = 75}
    if (numerator < 0.001) {numerator = 0}
    const height = totalHeight - 4 * margin;

    const denominatorSelection = selection.append("g");
    const numeratorSelection = selection.append("g");

    let rowLength: number = numerator < 15 ? numerator : 15;
    if (rowLength < 2) {rowLength = 2}
    const scaleY = d3.scaleLinear().domain([0, rowLength]).range([2*margin, height+2*margin])

    selection.append("g").append("text")
    .attr("transform", `translate(10, ${height + 4 * margin})`)
    .text(`${log2CopyRatio.toFixed(2)}`)
    selection.append("g").append("text")
    .attr("transform", `translate(0, ${margin})`)
    .text(`${(Math.pow(2, log2CopyRatio)*2).toFixed(1)} / ${2}`)

    for (let i = 0; i < numerator; i++){
        numeratorSelection.append("rect")
            .attr("transform",  "translate(5, 0)")
            .attr("fill", "darkgreen")
            .attr("class", "numerator")
            .attr("x", 3 + Math.floor(i / rowLength) * 4 )
            .attr("y", scaleY(i % rowLength))
            .attr("height", scaleY(1) - scaleY(0) - 1)
            .attr("width", 3);
    }

    for (let i = 0; i < denominator; i++){
        denominatorSelection.append("rect")
            .attr("transform",  "translate(30, 0)")
            .attr("fill", "gray")
            .attr("class", "denominator")
            .attr("x", 3 + Math.floor(i / rowLength) * 4)
            .attr("y", scaleY(i % rowLength))
            .attr("width", 3)
            .attr("height",scaleY(1) - scaleY(0)-1);
    }
}


function log2ToReducedFraction(log2CopyRatio: number): [numerator: number, denominator: number] {
    const copyRatio = Math.pow(2, log2CopyRatio);

    const roundedTennedCopyRatio = Math.round((copyRatio * 10));


    let tennedNumerator = roundedTennedCopyRatio * 12;
    let tennedDenominator = 120;

    if (tennedNumerator % 8 === 0 && tennedDenominator % 8 === 0){
        tennedNumerator = tennedNumerator / 8;
        tennedDenominator = tennedDenominator / 8;
    }
    if (tennedNumerator % 4 === 0 && tennedDenominator % 4 === 0){
        tennedNumerator = tennedNumerator / 4;
        tennedDenominator = tennedDenominator / 4;
    }
    if (tennedNumerator % 2 === 0 && tennedDenominator % 2 === 0){
        tennedNumerator = tennedNumerator / 2;
        tennedDenominator = tennedDenominator / 2;
    }
    if (tennedNumerator % 5 === 0 && tennedDenominator % 5 === 0){
        tennedNumerator = tennedNumerator / 5;
        tennedDenominator = tennedDenominator / 5;
    }
    if (tennedNumerator % 3 === 0 && tennedDenominator % 3 === 0){
        tennedNumerator = tennedNumerator / 3;
        tennedDenominator = tennedDenominator / 3;
    }

    return [tennedNumerator, tennedDenominator];
}

function log2To2BasedCopyNumber(log2CopyRatio: number): [numerator: number, denominator: number] {
    const denominator = 2;
    const copyRatio = Math.pow(2, log2CopyRatio);

    const numerator = copyRatio * denominator;
    const intNumerator = Math.round(numerator)

    return [intNumerator , denominator]
}