import * as d3 from "d3";



export function drawMiniPlaceholder(
    context: CanvasRenderingContext2D,
    selected: Boolean,
    favorite: Boolean = false,
) {
    const outerRadius: number = 5;
    const innerRadius: number = 2;  
    const pieSelection = context;
    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);


    custom
    .append("path")
    .attr("cx", outerRadius +1)
    .attr("cy", outerRadius +1)
    .attr("outerRadius", outerRadius)
    .attr("fill", favorite 
        ? "rgb(220,20,60)" 
        : selected 
            ? "rgb(0,171,102)" 
            : "rgb(150, 150, 150"
    )
    .attr("class", "placeholder")
    .attr(
        "d",
        d3
            .arc<any, any>()
            .startAngle(0)
            .endAngle(Math.PI)
            .outerRadius(outerRadius)
            .innerRadius(innerRadius),
    );

    const elements: d3.Selection<d3.BaseType, d3.Bin<number, number>, HTMLElement, unknown> = custom.selectAll(".placeholder");
    if (pieSelection === null || pieSelection === undefined) {return;}
    elements.each((d, i, group) => {
        const node = d3.select(group[i]);

        context.arc(Number(node.attr("cx")), Number(node.attr("cy")), Number(node.attr("outerRadius")), 0, 2*Math.PI)
        context.fillStyle = node.attr("fill")
        context.stroke()
        context.fill()
    }
    )
}