import * as d3 from "d3";
import { range } from "d3";
import { calculateExonLength } from "../common/callHelper";
import { Interval, CoveragePosition, CoverageWindow, Annotation } from "src/common/common";
import CnvCallItem from "./CnvCallItem";



import "./coverageGlyph.scss";


export function DrawCoverageGlyph(context:HTMLDivElement, coverage: CoverageWindow[], interval:Interval, annotations: Annotation[], maxCoverageDiff?: number) {

    const selection = d3.select(context);

    selection.selectAll("*").remove();
    const glyphWidth = 300
    const glyphHeight = 20;
    const coverageHeight = 70;
    const minExonWidth = 0.2;
    const exonHeight = 5;
    const geneHeight = 2;
    const graphHeight = 25;
    const maxDiff = maxCoverageDiff ?? 900;
    const axisWidth = 30;
    const axisMargin = glyphHeight;    
    const glyphInnerWidth = glyphWidth - axisWidth;


    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);


    const refseq_features = annotations.filter((feature) => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon')
    const features: Annotation[] = refseq_features.filter((feature) =>
        ["gene", "pseudogene", "exon"].includes(feature.featureType),
    );

    const genes = features.filter((feature) => feature.featureType === "gene" || feature.featureType === "pseudogene")

    const exonLength = calculateExonLength(refseq_features, interval)

    const exonPercentage = exonLength / (interval.end - interval.start) * 100

    const scaleX = d3.scaleLinear().domain([interval.start, interval.end]).range([axisWidth, glyphInnerWidth+axisWidth-2]).clamp(true);
    const scaleY = d3.scaleLinear().domain([-maxDiff, maxDiff]).range([coverageHeight+1, glyphHeight-1]).clamp(true);

    const axisY = d3.axisLeft(scaleY).ticks(3).tickSize(2)
    const axisX = d3.axisBottom(scaleX).ticks(0).tickSize(0)
    const scaleAlpha = d3.scaleLinear().domain([0, 100]).range([-Math.PI/2, Math.PI/2]).clamp(true)//[-7*Math.PI/6, Math.PI/6])


    const yAxisSelection = selection.append("svg")
    yAxisSelection.attr("width", axisWidth).attr("height", glyphHeight + coverageHeight+5)
    yAxisSelection.append("g").attr("transform", `translate(${axisWidth-5}, ${axisMargin})`).call(axisY)
    const xAxisSelection = selection.append("svg")
    xAxisSelection.attr("width", glyphWidth).attr("height", coverageHeight + glyphHeight + 5)
    xAxisSelection.append("g").attr("transform", `translate(${0}, ${scaleY(0)+ glyphHeight})`).call(axisX)

    const arc = d3.arc()
        .innerRadius(4)
        .outerRadius(7) 
        .startAngle(Number(scaleAlpha(0)+Math.PI/2+(scaleAlpha(0)-scaleAlpha(exonPercentage))/2)) 
        .endAngle(scaleAlpha(exonPercentage)+Math.PI/2+(scaleAlpha(0)-scaleAlpha(exonPercentage))/2)

    yAxisSelection.append("g").append("text")
        .text(exonPercentage.toFixed(0) + "%")
        .style("font-style", "10px")
        .attr("transform",`translate(0, 10)`)
    // axisSelection.append("g").append("text").text(exonPercentage.toFixed(2)).style("font-style", "10px").attr("transform",`translate(0, 20)`)
    yAxisSelection.append("g").append("path")
        .attr("d", d3.arc<any, any>()
            .innerRadius(6)
            .outerRadius(11) 
            .startAngle(Number(scaleAlpha(0) + Math.PI/2+(scaleAlpha(0)-scaleAlpha(exonPercentage))/2)) 
            .endAngle(scaleAlpha(exonPercentage)+ Math.PI/2 + (scaleAlpha(0)-scaleAlpha(exonPercentage))/2))
        .attr("transform", `translate(11, 25)`)

    yAxisSelection.append("g").append("path")
        .attr("d", d3.arc<any, any>()
            .innerRadius(9)
            .outerRadius(8) 
            .startAngle(Number(scaleAlpha(0))) 
            .endAngle(scaleAlpha(100)))
        .attr("transform", `translate(11, 25)`)

    const glyphSelection = selection.append("canvas").attr("width", glyphWidth).attr("height",coverageHeight + glyphHeight + 5).node()?.getContext("2d");


    const flattenedCoverages: CoveragePosition[] = coverage.flatMap((window) => {
        return window;
    });


    // const axisSvg = document.createElement("svg")
    // d3.select(axisSvg).attr("width", axisWidth).attr("height", 2*glyphHeight).append("g").call(axisY)
    // d3.select("svg").call(axisY)
    // d3.select(axisSvg).attr("width", axisWidth).attr("height", 2*glyphHeight).append("g").call(axisY)

    // const newAxis = d3.svg.axisBottom()

    custom
        .selectAll("rect")
        .data(features)
        .join(
            (enter) =>
                enter
                    .append("rect")
                    .attr("fill", (d) => d.featureType === "exon" ? "#565656" : "#D3D3D3")
                    .attr("class", (d) => d.featureType)
                    .attr("width", (d) => {
                        const scaledWidth: number =
                            scaleX(d.genomicInterval.end) - scaleX(d.genomicInterval.start);
                        const exonWidth: number =
                            d3.max([scaledWidth, minExonWidth]) ?? minExonWidth;
                        return exonWidth;
                    })
                    .attr("name", (d) => d.featureType === "exon" ? "" : d.id.split("gene-")[1])
                    .classed("feature-rect", true),
            (update) => update,
            (exit) => exit.remove(),
        )
        .attr("x", (d) => scaleX(d.genomicInterval.start))
        .attr("height", (d) => {
            return d.featureType === "exon" ? exonHeight : geneHeight;
        })
        .attr("y", (d) => {
            const offset: number =
          d.featureType === "exon" ? exonHeight : geneHeight;
            return graphHeight / 2 - offset / 2;
        });


    const alphaValue = flattenedCoverages.length < 100 ? 1 : 1000/flattenedCoverages.length;

    function databindCoverage(data: CoveragePosition[]) {
        custom.selectAll("dot")
            .data(data)
            .join(
                (enter) =>
                    enter
                        .append("circle")
                        .attr("fill", (d) => d.coverage_diff > 0 ? `rgba(0,118,182, ${alphaValue})` : `rgba(190, 120, 90, ${alphaValue})`)
                        .attr("r", 1)
                        .attr("class", (d) => d.coverage_diff > 0 ? "increase" : "decrease"),
                (update) => update,
                (exit) => exit.remove,
            );
    }

    function draw() {
        const elements: d3.Selection<d3.BaseType, CoveragePosition, HTMLElement, unknown> = custom.selectAll("circle");
        if (glyphSelection === null || glyphSelection === undefined) {return;}
        elements.each((d, i, group) => {
            const node = d3.select(group[i]);
            glyphSelection.beginPath();
            glyphSelection.arc(scaleX(d.pos), scaleY(d.coverage_diff) + glyphHeight, 2, 0, Math.PI * 2);
            glyphSelection.fillStyle = node.attr("fill");
            glyphSelection.fill();
            
        });

        const exonElements = custom.selectAll("rect");
        exonElements.each((d, i, group) => {
            const node = d3.select(group[i]);

            glyphSelection.fillStyle = node.attr("fill");
            glyphSelection.fillRect(Number(node.attr("x")), Number(node.attr("y")) + 10, Number(node.attr("width")), Number(node.attr("height")));
            glyphSelection.fillStyle = "black";
            if (genes.length < 5){
            glyphSelection.fillText(node.attr("name").slice(0,5), Math.max(Number(node.attr("x")), 10), 10)
            }
        });

        if(genes.length > 4 ){
            glyphSelection.font = "12px arial"
            glyphSelection.fillText(genes.length.toString() + " genes and pseudogenes", glyphWidth /2 - 50, 10)
        }
    }
    databindCoverage(flattenedCoverages);
    draw();

}

export function DrawSmallCoverageGlyph(downsampledCoverage: CoveragePosition[], interval:Interval, context:CanvasRenderingContext2D,  exonPercentage?: number, geneCovered:boolean=false, annotations?: Annotation[],  maxCoverageDiff?: number) {


    const glyphWidth = 50;
    const glyphPartHeight = 27;
    const exonHeight = 4;
    const geneHeight = 1;
    const maxDiff = maxCoverageDiff ?? 500;
    const margin = 2;
    const numberOfBins = (downsampledCoverage.length < 5) ? downsampledCoverage.length : 5;

    const binToPosition = d3.scaleLinear().domain([0,numberOfBins]).range([0, downsampledCoverage.length])

    let averageBasedFootprint: number[] = [];
    for (let i=0; i < numberOfBins; i++){
        const startIndex = Math.floor(binToPosition(i))
        const endIndex = Math.floor(binToPosition(i+1))
        const coverageDiffs: number[] = downsampledCoverage.slice(startIndex, endIndex).map(covPos=> covPos.coverage_diff)
        const averageCoverageDiff: number = d3.mean(coverageDiffs) ?? 0;
        averageBasedFootprint.push(averageCoverageDiff)
    }

    const glyphSelection = context; 

    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);

    const scaleX = d3.scaleLinear().domain([interval.start, interval.end]).range([0, glyphWidth-2*margin]);
    const scaleY = d3.scaleLinear().domain([-maxDiff, maxDiff]).range([glyphPartHeight/2 - margin, 0]).clamp(true);
    const scaleXCoverage = d3.scaleLinear().domain([0, downsampledCoverage.length]).range([0, glyphWidth-4*margin]);
    const scaleXFootprintAverage = d3.scaleLinear().domain([0, numberOfBins]).range([0, glyphWidth-6*margin]);
    const scaleAlpha = d3.scaleLinear().domain([0, 1]).range([-Math.PI, 0]).clamp(true)//[-7*Math.PI/6, Math.PI/6])

    let genes: Annotation[] = []; 
    let totalExonLength = 0;

    if (exonPercentage === undefined) {
        const featuresFiltered: Annotation[] = annotations?.filter((feature) =>
            ["gene", "pseudogene", "exon"].includes(feature.featureType),
        ) ?? [];

        const featuresRefSeq: Annotation[] = featuresFiltered;
        const knownGenes: string[] = [];
        const uniqueFeatures: Annotation[] = [];


        for (let feature of featuresRefSeq){
            if (knownGenes.includes(feature.id)) { return; }
            knownGenes.push(feature.id);
            uniqueFeatures.push(feature);
        }

    
        totalExonLength = d3.sum(featuresFiltered.map((feature) => {
            if (feature.featureType !== "exon") {return 0;} 
            return feature.genomicInterval.end - feature.genomicInterval.start; 
        }));

        
        genes = uniqueFeatures.filter((feature) => feature.featureType === "gene" || feature.featureType === "pseudogene");
    }


    const percentageExon = exonPercentage ?? totalExonLength / (interval.end - interval.start);

    const isCoveredByGenes: boolean = (genes?.length > 0 || geneCovered)

// Data binding
    custom
    .append("path")
    .attr("color", "#565656")
    .attr("lineWidth", exonHeight)
    .attr("startAngle", scaleAlpha(0)+Math.PI/2+(scaleAlpha(0)-scaleAlpha(percentageExon))/2)
    .attr("endAngle", scaleAlpha(percentageExon)+Math.PI/2+(scaleAlpha(0)-scaleAlpha(percentageExon))/2)
    .classed("gene-rect", true);


    if(isCoveredByGenes ){
    custom.append("path")
    .attr("color",  "#565656" )
    .attr("lineWidth", geneHeight)
    .attr("startAngle", scaleAlpha(0))
    .attr("endAngle", scaleAlpha(1)) //(d, i) => i * (geneHeight + 1) + graphHeight / 2 - geneHeight / 2 + exonHeight / 2)
    .classed("gene-rect", true);
    }


    function databindFootprintAverage(data: number[]) {
        custom.selectAll("dot")
            .data(data)
            .join(
                (enter) =>
                    enter
                        .append("rect")
                        .attr("fill", (d) => d > 0 ? "rgb(0,118,182)" : "rgb(190, 120, 90")
                        .attr("x", (d, i) => scaleXFootprintAverage(i) + 3*margin )
                        .attr("y", (d) => Math.min(scaleY(d), scaleY(0)) + 3*glyphPartHeight/4)
                        .attr("width", scaleXFootprintAverage(1)-scaleXFootprintAverage(0))
                        .attr("height", d => Math.abs(scaleY(d) - scaleY(0)))
                        .classed("coverage-rect", true),

                (update) => update,
                (exit) => exit.remove,
            );
    }

    function draw() {
        const elements: d3.Selection<d3.BaseType, CoveragePosition, HTMLElement, unknown> = custom.selectAll(".coverage-rect");
        if (glyphSelection === null || glyphSelection === undefined) {return;}
        elements.each((d, i, group) => {
            const node = d3.select(group[i]);
            
            glyphSelection.fillStyle = node.attr("fill");
            glyphSelection.fillRect(
                Number(node.attr("x")), 
                Number(node.attr("y")), 
                Number(node.attr("width")), 
                Number(node.attr("height"))
            );
        });

        const exonElements = custom.selectAll(".gene-rect");
        exonElements.each((d, i, group) => {
            const node = d3.select(group[i]);
            glyphSelection.strokeStyle = node.attr("color")
            glyphSelection.lineWidth = Number(node.attr("lineWidth"))
            glyphSelection.beginPath()
            glyphSelection.arc(glyphWidth/2+1.5, glyphPartHeight, glyphWidth/2-margin, Number(node.attr("startAngle")), Number(node.attr("endAngle")))

            glyphSelection.stroke()


        });
    }

    databindFootprintAverage(averageBasedFootprint)
    draw();

}

export function DrawDetailedCoverageGlyph(downsampledCoverage: CoveragePosition[], interval:Interval, context:CanvasRenderingContext2D,  exonPercentage?: number, geneCovered:boolean = false, annotations?: Annotation[],  maxCoverageDiff?: number) {


    const glyphWidth = 120;
    const glyphPartHeight = 60;
    const exonHeight = 6;
    const geneHeight = 3;
    const graphHeight = 50;
    const maxDiff = maxCoverageDiff ?? 500;
    const margin = 8;
    
    
    const glyphSelection = context; 
    let resampledCoverage: CoveragePosition[]= downsampledCoverage;

    let newResampledCoverage: CoveragePosition[] = [];
    if (downsampledCoverage.length > 30) {

        const dsFactor = Math.ceil(downsampledCoverage.length/30)
        downsampledCoverage.forEach((position, i) => { 
            if(i % dsFactor === 0) { newResampledCoverage.push({...position}) }
        } )
        resampledCoverage = newResampledCoverage;
    }
    resampledCoverage = downsampledCoverage
        

    const customBase = document.createElement("custom");
    const custom = d3.select(customBase);

    const scaleX = d3.scaleLinear().domain([interval.start, interval.end]).range([0, glyphWidth-4*margin]);
    const scaleY = d3.scaleLinear().domain([-maxDiff, maxDiff]).range([glyphPartHeight/2 , 0]).clamp(true);
    const scaleXCoverage = d3.scaleLinear().domain([0, resampledCoverage.length]).range([0, glyphWidth-5*margin]);
    const scaleAlpha = d3.scaleLinear().domain([0, 1]).range([-Math.PI, 0]).clamp(true)//[-7*Math.PI/6, Math.PI/6])

    let totalExonLength = 0;
    let genes: Annotation[] = [];

    if (exonPercentage === undefined){
        const featuresFiltered: Annotation[] = annotations?.filter((feature) =>
            ["gene", "pseudogene", "exon"].includes(feature.featureType),
        ) ?? [];

        const featuresRefSeq: Annotation[] = featuresFiltered//.filter((feature) => feature.source === "BestRefSeq");
        const knownGenes: string[] = [];

        const uniqueFeatures: Annotation[] = featuresRefSeq;



        for (let feature of featuresRefSeq){
            if(knownGenes.includes(feature.id)){ 
                continue; 
            }
            knownGenes.push(feature.id);
            uniqueFeatures.push(feature);
        }
        totalExonLength = d3.sum(featuresFiltered.map((feature) => {
            if (feature.featureType !== "exon") {return 0;} 
            return feature.genomicInterval.end - feature.genomicInterval.start; 
        }));
        
        genes = uniqueFeatures.filter((feature) => feature.featureType === "gene" || feature.featureType === "pseudogene");
    }

    let isCoveredByGenes:boolean = (genes.length > 0 || geneCovered)

    const percentageExon = exonPercentage ?? totalExonLength / (interval.end - interval.start);
    const ticks =  [0, 0.2, 0.4, 0.6, 0.8, 1];


    custom
    .append("path")
        .attr("color", "#565656")
        .attr("lineWidth", exonHeight)
        .attr("startAngle", scaleAlpha(0) + Math.PI/2 + (scaleAlpha(0)-scaleAlpha(percentageExon)) / 2)
        .attr("endAngle", scaleAlpha(percentageExon) + Math.PI/2 + (scaleAlpha(0) - scaleAlpha(percentageExon)) / 2)
        .attr("r", glyphWidth/2-margin)
        .classed("gene-rect", true);



    ticks.forEach(tick =>{    
        custom.append("path")
            .attr("color", "gray")
            .attr("lineWidth", 2 *  exonHeight)
            .attr("startAngle", scaleAlpha(tick)-0.01)
            .attr("endAngle", scaleAlpha(tick) + 0.01)
            .attr("r", glyphWidth/2 - margin)
            .classed("gene-rect", true);
    });

    if (isCoveredByGenes) {
        custom.append("path")
        .attr("color",  "#565656" )
        .attr("lineWidth", geneHeight)
        .attr("startAngle", scaleAlpha(0))
        .attr("endAngle", scaleAlpha(1)) //(d, i) => i * (geneHeight + 1) + graphHeight / 2 - geneHeight / 2 + exonHeight / 2)
        .attr("r", glyphWidth/2-margin)
        .classed("gene-rect", true);
    }


    function databindCoverage(data: CoveragePosition[]) {
        custom.selectAll("dot")
            .data(data)
            .join(
                (enter) =>
                    enter
                        .append("rect")
                        .attr("fill", (d) => d.coverage_diff > 0 ? "rgb(0,118,182)" : "rgb(190, 120, 90")
                        .attr("x", (d, i) => {
                            return scaleXCoverage(i) + 2.5*margin;

                        })
                        .attr("y", (d) => Math.min(scaleY(d.coverage_diff), scaleY(0)) + 5* glyphPartHeight / 8)
                        .attr("width", (glyphWidth - 6*margin) / resampledCoverage.length)
                        .attr("height", d => Math.abs(scaleY(d.coverage_diff) - scaleY(0)))
                        .classed("coverage-rect", true),
                // .attr("class", (d) => d.coverage_diff > 0 ? "increase" : "decrease"),
                (update) => update,
                (exit) => exit.remove,
            );
    }

    function draw() {
        const elements: d3.Selection<d3.BaseType, CoveragePosition, HTMLElement, unknown> = custom.selectAll(".coverage-rect");
        if (glyphSelection === null || glyphSelection === undefined) {return;}
        elements.each((d, i, group) => {
            const node = d3.select(group[i]);
            
            glyphSelection.fillStyle = node.attr("fill");
            glyphSelection.fillRect(
                Number(node.attr("x")), 
                Number(node.attr("y")), 
                Number(node.attr("width")), 
                Number(node.attr("height"))
            );
        });

        const exonElements = custom.selectAll(".gene-rect");
        exonElements.each((d, i, group) => {
            const node = d3.select(group[i]);


            glyphSelection.strokeStyle = node.attr("color")
            glyphSelection.lineWidth = Number(node.attr("lineWidth"))
            glyphSelection.beginPath()
            glyphSelection.arc(glyphWidth/2+ 0.5, glyphPartHeight+0.5, Number(node.attr("r")), Number(node.attr("startAngle")), Number(node.attr("endAngle")))

            glyphSelection.stroke()


        });
    }

    databindCoverage(resampledCoverage);
    draw();

}