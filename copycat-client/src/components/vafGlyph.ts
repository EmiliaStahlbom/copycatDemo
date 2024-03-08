import * as d3 from "d3";
import { selectAll, transition } from "d3";
import { SnvCall } from "src/common/common";
import "./vafGlyph.scss";

export function drawVafGlyphAnglebased(
    context: SVGSVGElement | null,
    SnvCalls: SnvCall[],
) {
    const outerRadius: number = 30;
    const innerRadius: number = 2;
    const selection = d3.select(context);
    const numberOfBins = 30;
    const scaleFactor = 1000;

    const pieSelection = selection.append("g");

                  
    // calculate axis scaling
    const scaleAlpha = d3.scaleLinear().range([Math.PI / 2, -Math.PI / 2]).domain([0, 1]);
    const length = SnvCalls.length;
    const vafHistogramGenerator = d3.bin()
        .domain([0, 1])
        .thresholds(numberOfBins);

    const binnedVafData = vafHistogramGenerator(SnvCalls.map((call) => call.alleleFrequency[0]) );

    const filteredVafData = binnedVafData.filter((bin) => bin.length > length / scaleFactor);

    // Render backplate
    pieSelection
        .append("path")
        .attr(
            "transform",
            `translate(${outerRadius + 2}, ${outerRadius + 2})`,
        )
        .attr("fill", "darkgray")
        .attr("class", "pie-background")
        .attr(
            "d",
            d3
                .arc<any, any>()
                .startAngle(-Math.PI / 2)
                .endAngle(Math.PI / 2)
                .outerRadius(outerRadius)
                .innerRadius(innerRadius),
        );

    // it's possible to distinguish a 0.01 rad circle sector, but barely
    // gives 314 circle sectors to render
 
    // render SNVs on top of backplate
    pieSelection
        .selectAll("path")
        .data(filteredVafData)
        .join(
            (enter) =>
                enter
                    .append("path")
                    .attr("fill", "white")
                    .attr("class", "pie-slice")
                    .attr(
                        "transform",
                        `translate(${outerRadius + 2}, ${outerRadius + 2})`,
                    )
                    .attr(
                        "d",
                        d3
                            .arc<d3.Bin<number, number>>()
                            .innerRadius(innerRadius)
                            .outerRadius(outerRadius)
                            .startAngle((d) => scaleAlpha(d.x0 ?? 0))
                            .endAngle((d) => scaleAlpha(d.x0 ?? 0) + 0.02)
                            .padRadius(innerRadius),
                    ),
            (update) => update,
            (exit) => exit.remove(),
        );
}

export function drawSmallVafGlyphAnglebased(
    context: CanvasRenderingContext2D,
    SnvCalls: SnvCall[],
) {
    const glyphWidth = 52;
    const glyphHeight = 52;
    const outerRadius: number = 17;
    const innerRadius: number = 8;
    const numberOfBins = 20;
    const scaleFactor = 30;
    const marginWidth = 5;
    const marginHeight = 30;
    const angleRange = [ Math.PI, 0];
    
    const pieSelection = context;
                  
    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);

    // calculate axis scaling
    const scaleAlpha = d3.scaleLinear().range(angleRange).domain([0, 1]);
    const numberOfSnvCalls = SnvCalls.length;
    const vafHistogramGenerator = d3.bin()
        .domain([0, 1])
        .thresholds(numberOfBins);

    const binnedVafData = vafHistogramGenerator(SnvCalls.map((call) => call.alleleFrequency[0]) );

    const filteredVafData = binnedVafData.filter((bin) => bin.length > Math.max(numberOfSnvCalls / scaleFactor, 0));

    function databind(filteredVafDatainput: d3.Bin<number, number>[]) {
    // Render backplate
        custom
            .append("path")
            .attr(
                "transform",
                `translate( 2, ${outerRadius + 2})`,
            )
            .attr("fill", "darkgray")
            .attr("class", "pie-background")
            .attr(
                "d",
                d3
                    .arc<any, any>()
                    .startAngle(0)
                    .endAngle(Math.PI)
                    .outerRadius(outerRadius)
                    .innerRadius(innerRadius),
            );

        // it's possible to distinguish a 0.01 rad circle sector, but barely
        // gives 314 circle sectors to render
 
        const arc =  d3
            .arc<d3.Bin<number, number>>()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .startAngle((d) => scaleAlpha(d.x0 ?? 0))
            .endAngle((d) => scaleAlpha(d.x0 ?? 0) + 0.3)
            .padRadius(innerRadius);


        // render SNVs on top of backplate
        custom
            .selectAll("path")
            .data(filteredVafDatainput)
            .join(
                (enter) =>
                    enter
                        .append("path")
                        .attr("fillStyle", "#656565")
                        .attr("class", "pie-slice")
                        .attr("d", (d: d3.Bin<number, number>) => arc(d)),
                (update) => update,
                (exit) => exit.remove(),
            );
    }
    function draw() {
        const elements: d3.Selection<d3.BaseType, d3.Bin<number, number>, HTMLElement, unknown> = custom.selectAll(".pie-slice");
        if (pieSelection === null || pieSelection === undefined) {return;}
        elements.each((d, i, group) => {

            const node = d3.select(group[i]);

            pieSelection.moveTo(glyphWidth/2, marginHeight);
            pieSelection.beginPath();
            pieSelection.arc(glyphWidth/2, marginHeight, innerRadius, scaleAlpha(d.x0 ?? 0), scaleAlpha(d.x0 ?? 0) + 0.1);
            pieSelection.arc(glyphWidth/2, marginHeight, outerRadius, scaleAlpha(d.x0 ?? 0) + 0.1, scaleAlpha(d.x0 ?? 0), true);

            pieSelection.closePath();
            pieSelection.fillStyle = node.attr("fillStyle");
            
            pieSelection.fill();

        });

    }

    databind(filteredVafData);
    draw();
}

export function drawDetailedVafGlyphAnglebased(
    context: CanvasRenderingContext2D,
    SnvCalls: SnvCall[],
) {
    const glyphWidth = 122;
    const glyphHeight = 122;
    const innerRadius: number = 20;
    const numberOfBins = 30;
    const scaleFactor = 100;
    const marginWidth = 3;
    const marginHeight = 70;
    const angleRange = [ Math.PI, 0];
    const outerRadius: number = glyphWidth/2 - 4*marginWidth;

    let maxSnvsPerBin = Math.max(20, SnvCalls.length/10);

    const vafHistogramGenerator = d3.bin()
    .domain([0, 1])
    .thresholds(numberOfBins);

    const binnedVafData: d3.Bin<number, number>[] = vafHistogramGenerator(SnvCalls.map((call) => call.alleleFrequency[0]) );

    const filteredVafData: d3.Bin<number, number>[] = binnedVafData.filter((bin) => bin.length > length / scaleFactor);
    const binLengths: number[] = filteredVafData.map(bin => bin.length)
    maxSnvsPerBin = d3.max(binLengths) ?? maxSnvsPerBin
    
    const pieSelection = context;
                  
    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);

    // calculate axis scaling
    const scaleAlpha = d3.scaleLinear().range(angleRange).domain([0, 1]);
    const numberOfSnvCalls = SnvCalls.length;
    // const vafHistogramGenerator = d3.bin()
    //     .domain([0, 1])
    //     .thresholds(numberOfBins);

    // const binnedVafData: d3.Bin<number, number>[]= vafHistogramGenerator(SnvCalls.map((call) => call.alleleFrequency[0]) );

    // const filteredVafData = binnedVafData.filter((bin) => bin.length > numberOfSnvCalls / scaleFactor);

    const scaleRadius = d3.scaleLinear().range([innerRadius, outerRadius]).domain([0, maxSnvsPerBin]).clamp(true)

    function databind(filteredVafDatainput: d3.Bin<number, number>[]) {
    // Render backplate
        custom
            .append("path")
            .attr(
                "transform",
                `translate( 2, ${outerRadius + 2})`,
            )
            .attr("fill", "darkgray")
            .attr("class", "pie-background")
            .attr(
                "d",
                d3
                    .arc<any, any>()
                    .startAngle(0)
                    .endAngle(Math.PI)
                    .outerRadius(outerRadius)
                    .innerRadius(innerRadius),
            );

        // it's possible to distinguish a 0.01 rad circle sector, but barely
        // gives 314 circle sectors to render
 
        const arc =  d3
            .arc<d3.Bin<number, number>>()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius)
            .startAngle((d) => scaleAlpha(d.x0 ?? 0))
            .endAngle((d) => scaleAlpha(d.x0 ?? 0) + 0.1)
            .padRadius(innerRadius);


        // render SNVs on top of backplate
        custom
            .selectAll("path")
            .data(filteredVafDatainput)
            .join(
                (enter) =>
                    enter
                        .append("path")
                        .attr("fillStyle", "#656565")
                        .attr("class", "pie-slice")
                        .attr("d", (d: d3.Bin<number, number>) => arc(d)),
                (update) => update,
                (exit) => exit.remove(),
            );
    }
    function draw() {
        const elements: d3.Selection<d3.BaseType, d3.Bin<number, number>, HTMLElement, unknown> = custom.selectAll(".pie-slice");
        if (pieSelection === null || pieSelection === undefined) {return;}

        elements.each((d, i, group) => {
            const node = d3.select(group[i]);

            pieSelection.moveTo(glyphWidth/2, marginHeight);
            pieSelection.beginPath();
            pieSelection.arc(glyphWidth/2, marginHeight, innerRadius, scaleAlpha(d.x0 ?? 0), scaleAlpha(d.x0 ?? 0) + 0.05);
            pieSelection.arc(glyphWidth/2, marginHeight, scaleRadius(d.length), scaleAlpha(d.x0 ?? 0) + 0.05, scaleAlpha(d.x0 ?? 0), true);

            pieSelection.closePath();
            pieSelection.fillStyle = node.attr("fillStyle");
            // pieSelection.strokeStyle = node.attr("fillStyle")
            // pieSelection.stroke();
            
            pieSelection.fill();

        });

    }

    databind(filteredVafData);
    draw();
}


export function drawVafGlyphLinear(
    context: SVGSVGElement | null,
    SnvCalls: SnvCall[],
) {
    const numberOfBins:number = 30;
    const scaleFactor = 100;
    const marginWidth = 30;
    const marginHeight = 20;
    const outerRadius = 15;
    const selection = d3.select(context);
    const width:number = 80;
    const height = 90;
    const innerRadius = 10;


    const length = SnvCalls.length;
    let maxSnvsPerBin = Math.max(20, SnvCalls.length/10);
    // const maxSnvsPerBin = Math.max(SnvCalls)

    
    const vafHistogramGenerator = d3.bin()
        .domain([0, 1])
        .thresholds(numberOfBins);

    const binnedVafData: d3.Bin<number, number>[] = vafHistogramGenerator(SnvCalls.map((call) => call.alleleFrequency[0]) );

    const filteredVafData: d3.Bin<number, number>[] = binnedVafData.filter((bin) => bin.length > length / scaleFactor);
    const binLengths: number[] = filteredVafData.map(bin => bin.length)


    maxSnvsPerBin = d3.max(binLengths) ?? maxSnvsPerBin

    const scaleY = d3.scaleLinear().domain([0, 1]).range([height-marginHeight-5, 0])
    const scaleX = d3.scaleLinear().domain([0, maxSnvsPerBin]).range([0, width-marginWidth-5]).clamp(true)
    const scaleAlpha = d3.scaleLinear().range([180, 0]).domain([0, 1]);

    const axisY = d3.axisLeft(scaleY).ticks(4);
    const axisX = d3.axisBottom(scaleX).ticks(2);


    // selection.selectAll("*").remove()


    selection.selectAll("rect")
    .data(binnedVafData).join(
        (enter) => enter.append("rect")
        .attr("fill", "#656565")
        .attr("class", "pie-slice")
        .attr("transform", (d) => `rotate(90)translate(${outerRadius}, ${height/2})`)
        .attr("width", (d) => scaleX(d.length ?? 0))
        .attr("transform", (d) => `translate(${marginWidth},${scaleY(1)+10+5})rotate(${scaleAlpha(d.x0 ?? 0) })translate(10,0)`)
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height/(2*numberOfBins)),
        (update) => update,
        (exit) => exit.remove()

    )

    selection.selectAll(".pie-slice").data(binnedVafData)
        // .transition()
        // .delay(200)
        // .duration(300)
        // .attr("width", outerRadius)

        // .transition()

        // .duration(300)

        // .attr("height", height/(2*numberOfBins))

        // .transition()
        // .delay(300)
        // .duration(300)
        // .attr("transform", (d) => `translate(${width-marginWidth}, ${scaleY(1/2)})rotate(${scaleAlpha(d.x0 ?? 0) + 90})translate(10,0)`)

    
        
        .transition()
        .delay(300)
        .duration(500)
            .attr("anchor", "right")
            .attr("transform", (d) => `translate(${marginWidth+0.5},${scaleY(d.x0 ?? 0)+5})rotate(-0)`)
            .attr("y", 0)//(d) => scaleY(d.x0 ?? 0))
            .attr("x",  0)//(d) => scaleX(d.length ?? 0))
            // .attr("width", (d) => scaleX(0)-scaleX(d.length ?? 0))
            // .attr("height", height/numberOfBins)
            .attr("fill", "#656565")
    
    
    const xAxis = selection.append("g").attr("transform", `translate(${marginWidth}, ${height-marginHeight})`)
    xAxis.transition().delay(500).call(axisX);
    const yAxis = selection.append("g").attr("transform", `translate(${marginWidth}, 5)`)
    yAxis.transition().delay(500).call(axisY)
    selection.append("g").append("text")
        .attr("text-anchor", "middle")
        // .attr("x", width - 5)
        // .attr("y", height/2)
        .attr("transform", `translate(0, ${height/2})rotate(-90)`)

        .transition()
        .delay(500)

  
        .text("Allele Ratios")
        .style("font-size", "smaller")
        .attr("color", "black")

    selection.append("g").append("text")

        .attr("text-anchor", "middle")
        .attr("height", 10)
        .attr("x", width/2)
        .attr("y", height+10)
        .style("font-size", "smaller")        
        .transition()
        .delay(500)
        .text("Number of SNVs")
        .attr("strokeStyle", "black")        

    

}

