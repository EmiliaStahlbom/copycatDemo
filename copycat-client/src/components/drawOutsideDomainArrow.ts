import * as d3 from "d3";
import { rgb } from "d3";


export function drawOutsideDomainArrowRight(
    context: CanvasRenderingContext2D,
    overshoot?: number
) {
    const shaftLength: number = 9.5;
    const outerRadius: number = 7;
    const innerRadius: number = 4.5;  
    const selection = context;
                  
    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);
    const glyphHeight = 0;

    const colorScale = d3.scaleLinear().domain([0, 200]).range([60, 10])
    const color: number = colorScale(overshoot ?? 5)

    custom
    .append("path")
    .attr("x", outerRadius +1)
    .attr("y", outerRadius +1)
    .attr("outerRadius", outerRadius)
    .attr("class", "outside-domain-arrow")
    .attr("fillStyle",  `rgb(${color},${color}, ${color})`)


    const elements: d3.Selection<d3.BaseType, d3.Bin<number, number>, HTMLElement, unknown> = custom.selectAll(".outside-domain-arrow");
    if (selection === null || selection === undefined) {return;}
    elements.each((d, i, group) => {

 
        const node = d3.select(group[i]);

        context.beginPath()
        context.moveTo(0, outerRadius + glyphHeight)
        context.lineTo(shaftLength, outerRadius + glyphHeight)
        context.lineTo(shaftLength - innerRadius, outerRadius - innerRadius + glyphHeight)
        context.lineTo(shaftLength + innerRadius, outerRadius + glyphHeight)
        context.lineTo(shaftLength - innerRadius, outerRadius + innerRadius + glyphHeight)
        context.lineTo(shaftLength, outerRadius + glyphHeight)
        context.fillStyle = node.attr("fillStyle")
        context.strokeStyle = node.attr("fillStyle")
        context.stroke()
        context.fill()
    }
    )
}

export function drawOutsideDomainArrowTop(
    context: CanvasRenderingContext2D,
    overshoot?: number
) {
    const shaftLength: number = 9.5;
    const outerRadius: number = 7;
    const innerRadius: number = 4.5;  
    const selection = context;
                  
    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);
    const glyphHeight = 0;

    const colorScale = d3.scaleLinear().domain([0, 10]).range([60, 10])
    const color: number = colorScale(overshoot ?? 5)

    custom
    .append("path")
    .attr("x", outerRadius +1)
    .attr("y", outerRadius +1)
    .attr("outerRadius", outerRadius)
    .attr("class", "outside-domain-arrow")
    .attr("fillStyle",  `rgb(${color},${color}, ${color})`)


    const elements: d3.Selection<d3.BaseType, d3.Bin<number, number>, HTMLElement, unknown> = custom.selectAll(".outside-domain-arrow");
    if (selection === null || selection === undefined) {return;}
    elements.each((d, i, group) => {

 
        const node = d3.select(group[i]);

        context.beginPath()
        context.moveTo(outerRadius + glyphHeight, shaftLength + innerRadius)
        context.lineTo(outerRadius + glyphHeight, innerRadius)
        context.lineTo(outerRadius - innerRadius + glyphHeight, shaftLength)
        context.lineTo(outerRadius + glyphHeight, 0)
        context.lineTo(outerRadius + innerRadius + glyphHeight, shaftLength)
        context.lineTo(outerRadius + glyphHeight, innerRadius)
        context.fillStyle = node.attr("fillStyle")
        context.strokeStyle = node.attr("fillStyle")
        context.stroke()
        context.fill()
    }
    )
}