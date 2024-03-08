// import { numberLiteralTypeAnnotation } from "@babel/types";

import * as d3 from "d3";
import React, { OutputHTMLAttributes, useEffect, useRef, useState } from "react";
import { CnvCall } from "src/common/common";
import "./CallGraph.scss";
import CallList from "./CallList";
import OutsideDomainArrow from "./OutsideDomainArrow";
import { drawOutsideDomainArrowRight, drawOutsideDomainArrowTop } from "./drawOutsideDomainArrow";
import SmallCnvCallItem from "./SmallCnvCallItem";
import { extent, InterpolatorFactory, NumberValue, quantile, ScaleContinuousNumeric, scaleLinear, ScaleLinear, UnknownReturnType} from "d3";
import { Button, Icon, SvgIcon, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import UnfoldLessIcon from '@mui/icons-material/UnfoldLess';
import ColorLensIcon from '@mui/icons-material/ColorLens';
import { UnfoldMore } from "@mui/icons-material";
import { logHover } from "../services/saveInteraction";
import { GradingResult } from "./Questions/QuestionApp";

interface Props {
    CnvCalls: CnvCall[];
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    contextMenu(id: number): void;
    hoverCall(id: number, isEnter: boolean,  event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    width: number;
    selectedCalls: CnvCall[];
    highlightedCallIds: number[];
    minimizedCalls: CnvCall[];
    visitedCallIds: number[];
    favoriteCallIds?: number[];
    areAxesLocked: boolean;
    toggleAxisLock(): void;
    areCollapsed: boolean;
    toggleCollapse(): void;
    isColorByChromosome: boolean;
    gradingResult?: GradingResult;
    maxCoverageDiff?: number;
}

export const experimentalScaleY = (originalLinearScale: d3.ScaleLinear<number,number,never>, callFeature: number[], range: [number,number]): d3.ScaleLinear<number,number,never> => {

    const numberOfGridLines = 50;

    const originalScale = originalLinearScale.clamp(false);
    const originalPositions = callFeature.map(call => originalScale(call));
    const originalCallsRange: number[] = [d3.extent(originalPositions)[0] ?? 0, d3.extent(originalPositions)[1] ?? 10] 
    const callPositionsRange: [number, number] = [originalCallsRange[0], originalCallsRange[1]];
    const rangeStep: number = (range[1]-range[0])/numberOfGridLines
    const originalDomain: [number, number] = [d3.extent(callFeature)[0] ?? 0, d3.extent(callFeature)[1] ?? 1] //[-2, d3.extent(callFeature)[1] ?? 1] //
    // const originalDomain: [number, number] = [originalDomain[0] - yAxisMargin, originalDomain[1] + yAxisMargin]
    const domainStep: number = (originalDomain[1] - originalDomain[0])/numberOfGridLines

    const grid: number[] = d3.range(range[0], range[1], rangeStep)
    const originalGrid: number[] = d3.range(callPositionsRange[1], callPositionsRange[0],-(callPositionsRange[1]-callPositionsRange[0])/50)
    const choppedUpDomain: number[] = d3.range(originalDomain[0], originalDomain[1], domainStep)


    // calculate density along axis
    let densities: number[] = []
    const eps = 0.0001;
    originalGrid.forEach(line => {
        const density: number = d3.sum(originalPositions.map(pos => {

            return Math.abs(line-pos) < 300 ? 0.5 : Math.pow(Math.abs((line - pos)), (-1))}
        )); //Math.abs( (pos - line)) < 100 ? 100-Math.abs(pos-line) : 0));
        densities.push(density)

    })

    const cumulativeDensities: number[] = Array.from( d3.cumsum(densities))

    const newGrid = cumulativeDensities
    const scaleNewGrid = d3.scaleLinear().domain([(extent(newGrid)[0] ?? 1), (extent(newGrid)[1] ?? 0)]).range([range[0]-30, range[1]+30])
    const windowScaledNewGrid = newGrid.map(point => scaleNewGrid(point))
    const scaleNewRanges = d3.scaleLinear().domain(grid).range(windowScaledNewGrid)
    const newRanges = grid.map(point => scaleNewRanges(point))

    const newScale = d3.scaleLinear().domain(choppedUpDomain).range(newRanges)

    return newScale;
}

export const experimentalScaleX = (originalLinearScale: d3.ScaleLinear<number,number,never>, callFeature: number[], range: [number,number]): d3.ScaleLinear<number,number,never> => {

    const originalScale = originalLinearScale.clamp(false);
    const sortedCallFeature: number[] = callFeature.sort()
    const originalPositions = sortedCallFeature.map(call => originalScale(call));
    const originalCallsRange: number[] = [d3.extent(originalPositions)[0] ?? 0, d3.extent(originalPositions)[1] ?? 10] 
    const callsRange: [number, number] = [originalCallsRange[0], originalCallsRange[1]];
    const rangeStep: number = (range[1]-range[0] )/50
    const originalDomain: [number, number] = [d3.extent(callFeature)[0] ?? 0, d3.extent(callFeature)[1] ?? 1]
    // const originalDomain: [number, number] = [originalDomain[0] - yAxisMargin, originalDomain[1] + yAxisMargin]
    const domainStep: number = (originalDomain[1] - originalDomain[0])/50

    const grid: number[] = d3.range(range[0], range[1], rangeStep)
    const originalGrid: number[] = d3.range(callsRange[0], callsRange[1], (callsRange[1]-callsRange[0])/50)
    const choppedUpDomain: number[] = d3.range(originalDomain[0], originalDomain[1], domainStep)
    // calculate density along axis
    let densities: number[] = []
    const eps = 0.0001;
    originalGrid.forEach(line => {
        
        const density: number = d3.sum(originalPositions.map(pos => Math.pow(Math.abs((line - pos + eps)), (-1/2)))); //Math.abs( (pos - line)) < 100 ? 100-Math.abs(pos-line) : 0));
        densities.push(density)

    })
    densities[0] = 0

    const cumulativeDensities: number[] = Array.from( d3.cumsum(densities))

    const newGrid = cumulativeDensities
    const scaleNewGrid = d3.scaleLinear().domain([(extent(newGrid)[0] ?? 1), (extent(newGrid)[1] ?? 0)]).range([range[0]+30, range[1]-30])
    const windowScaledNewGrid = newGrid.map(point => scaleNewGrid(point))
    const scaleNewRanges = d3.scaleLinear().domain(grid).range(windowScaledNewGrid)
    const newRanges = grid.map(point => scaleNewRanges(point))

    const newScale = d3.scaleLinear().domain(choppedUpDomain).range(newRanges)

    return newScale;
}

const margin = 60;

const CallGraph = ({ 
    CnvCalls, 
    selectCall, 
    contextMenu, 
    width, 
    selectedCalls, 
    hoverCall, 
    highlightedCallIds, 
    minimizedCalls, 
    visitedCallIds, 
    favoriteCallIds, 
    areAxesLocked, 
    toggleAxisLock, 
    areCollapsed, 
    toggleCollapse: toggleCollapse, 
    gradingResult,
    maxCoverageDiff
}: Props) => {



    const height = self.innerHeight - ( margin);
    const graphRef = useRef<HTMLDivElement>(null);
    const selectedCallIds = selectedCalls?.map(call => call.id);
    const minimizedCallIds = minimizedCalls?.map(call => call.id);
    const arrowRef = useRef<HTMLCanvasElement>(null);
    const arrowTopRef = useRef<HTMLCanvasElement>(null);
    const [isColorByChromosome, setIsColorByChromosome] = useState<boolean>(false);


    const toggleColorByChromosome = () => {
        setIsColorByChromosome(!isColorByChromosome)
    }

    // Uncoment to scale Y axis according to max coverage diff
    // const maxAbsCoverage = CnvCalls.map((call) => {
    //     if (call.downsampledCoverage === undefined) {return}
    //     const coverageDiffs = call.downsampledCoverage.map((position) => Math.abs(position.coverage_diff));
    //     return d3.max(coverageDiffs);
    // })
    // const maxAbsCoverageFiltered: number[] = maxAbsCoverage.filter((callCoverage): callCoverage is number => callCoverage !== undefined)
    // const xExtent = d3.extent(maxAbsCoverageFiltered)

    // Uncomment to Scale Y axis according to mean coverage diff
    // const meanAbsCoverages: number[] = CnvCalls.map((call): number => {
    //         if (call.downsampledCoverage === undefined) { return 0; }
    //         const meanCoverage: number = d3.mean(call.downsampledCoverage.map(position => position.coverage_diff)) ?? 0;
    //         return meanCoverage;
    //     })
    // const meanAbsCoverageFiltered: number[] = meanAbsCoverages.filter((callCoverage): callCoverage is number => callCoverage !== undefined)
    // const xExtent = d3.extent(meanAbsCoverageFiltered)

    // const xExtent = [0, 300]
    let averageCoverages: number[] = CnvCalls.map(call => Math.abs(d3.mean(call.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0))
    let xExtent = d3.extent(averageCoverages)
    // const yExtent = d3.extent(CnvCalls.map(call => call.log2CopyRatio))
    const yExtent = [-1.2, 2]

    let domainXCoverage: [number, number] = [ -10, (xExtent[1] ?? 1000) + 20]
    let domainY: [number, number] = [-1.2, yExtent[1] ?? 3]
    const xScale = d3.scaleLog().domain([5000, 5000000]).range([0, width - 2 * margin]);
    const xAxis = d3.axisBottom(xScale);
    let xScaleCoverage = d3.scaleLinear().domain(domainXCoverage).range([0, width-2*margin])
    let xScaleExperiment = experimentalScaleX(xScaleCoverage, averageCoverages, [0, width-2*margin])
    const xAxisCoverage = d3.axisBottom(xScaleExperiment)

    let yScale = d3.scaleLinear().domain(domainY).range([height - (2 * margin), 0])//.clamp(true);
    let yScaleExperiment = experimentalScaleY(yScale, CnvCalls.map(call=> call.log2CopyRatio), [height-2*margin, 0])
    let yAxis = d3.axisLeft(yScaleExperiment).ticks(15);

    const [isCallHovered, setIsCallHovered] = useState<{state: boolean, id: number}>({state: false, id: 0});

    function hoverOverCall(id: number, isEnter: boolean,  event: React.MouseEvent<HTMLElement, MouseEvent>) {
        
        // isEnter? setIsCallHovered({state: true, id: id}) : setIsCallHovered({state: false, id: 0})
        
        if (selectedCallIds.includes(id)){hoverCall(id, isEnter, event) }
        else{ logHover(id, event) }
        // hoverCall(id, isEnter, event)
        
    }



    useEffect(() => {


        averageCoverages = CnvCalls.map(call => d3.mean(call.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0)
        xScaleCoverage = d3.scaleLinear().domain(domainXCoverage).range([0, width-2*margin])
        yScale = d3.scaleLinear().domain(domainY).range([height -(2 * margin), 0])

        
        xExtent = d3.extent(averageCoverages)
        domainY = [-1.2, yExtent[1] ?? 3]
        domainXCoverage = [ -10, (xExtent[1] ?? 1000) + 20]

        xScaleExperiment = experimentalScaleX(xScaleCoverage, averageCoverages.map(callCoverage => Math.abs(callCoverage)), [0, width-2*margin])
        yScaleExperiment = experimentalScaleY(yScale, CnvCalls.map(call=> call.log2CopyRatio), [height-2*margin, 0])

        yAxis= d3.axisLeft(yScaleExperiment).ticks(15)
        if (isCallHovered.state){
            yAxis = d3.axisLeft(yScale).ticks(15)
        }



        function DrawCallGraph(context: HTMLDivElement){

            const log2CopyRatios: number[] = CnvCalls.map(call => call.log2CopyRatio) 
            const yAxisDomain: [number, number] = [d3.extent(log2CopyRatios)[0] ?? 0, d3.extent(log2CopyRatios)[1] ?? 1]
            const numberOfSteps: number = 50;
            const yAxisStep: number = (yAxisDomain[1] - yAxisDomain[0])/numberOfSteps;
            const yAxisDomainGrid: number[] = d3.range(yAxisDomain[0], yAxisDomain[1],  yAxisStep)
            const yAxisGrid: number[] = d3.range(0, (height-2*margin)/numberOfSteps)
            const yAxisDeformed: number[] = yAxisDomainGrid.map(point => yScaleExperiment(point))
            const yAxisStretch: number[] = yAxisDeformed.map((point, index) => Math.abs(yAxisDeformed[index+1]- point))


            const xAxisDomain: [number, number] = [d3.extent(averageCoverages.map(callCoverage => Math.abs(callCoverage)))[0] ?? 0, d3.extent(averageCoverages.map(callCoverage => Math.abs(callCoverage)))[1] ?? 300]
            const xAxisStep: number = (xAxisDomain[1] - xAxisDomain[0])/numberOfSteps;
            const xAxisDomainGrid: number[] = d3.range(xAxisDomain[0], xAxisDomain[1],  xAxisStep)
            const xAxisGrid: number[] = d3.range(0, (height-2*margin)/numberOfSteps)
            const xAxisDeformed: number[] = xAxisDomainGrid.map(point => xScaleExperiment(point))
            const xAxisStretch: number[] = xAxisDeformed.map((point, index) => Math.abs(xAxisDeformed[index+1]- point))
            

            const selection = d3.select(context);

            // const wholeCopyNumberChangePositions = [
            //     yScaleExperiment(-1), 
            //     yScaleExperiment(0), 
            //     yScaleExperiment(0.58496250072), 
            //     yScaleExperiment(1), 
            //     yScaleExperiment(Math.log2(5/2)), 
            //     yScaleExperiment(Math.log2(6/2)), 
            //     yScaleExperiment(Math.log2(7/2)), 
            //     yScaleExperiment(Math.log2(8/2)), 
            //     yScaleExperiment(Math.log2(9/2)), 
            //     yScaleExperiment(Math.log2(10/2)),
            //     yScaleExperiment(Math.log2(20/2)),
            //     yScaleExperiment(Math.log2(100/2)),
            //     yScaleExperiment(Math.log2(1000/2)),
            //     yScaleExperiment(Math.log2(100000/2)),
            //     yScaleExperiment(Math.log2(1000000/2)),
            // ]
            const wholeCopyNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 20, 100, 1000, 100000, 1000000]
            const wholeCopyNumberChangePositions = wholeCopyNumbers.map(cn => yScaleExperiment(Math.log2(cn/2)))
            
            const yScaleRight = d3.scaleLinear().domain(wholeCopyNumbers).range(wholeCopyNumberChangePositions)
            const yAxisRight = d3.axisRight(yScaleRight).tickValues(wholeCopyNumbers).tickPadding(10).tickSize(2)
            selection.select("svg").selectAll("*").remove();
    

            const xAxisGroup = selection.select(".call-graph-background").append("g")
                .call(xAxisCoverage)
                .attr("transform", `translate(${margin}, ${height - margin})`);
                
            const yAxisGroup = selection.select(".call-graph-background").append("g")
                .call(yAxis)
                .attr("transform", `translate(${margin}, ${margin})`);
            const yAxisRightGroup = selection.select(".call-graph-background").append("g")
                .call(yAxisRight)
                .attr("transform", `translate(${width-margin}, ${margin})`)
                .attr("stroke-width", "1px")
  



            const linePoints: [number, number][] = yAxisDeformed.map(point => [0, point])
            const lineSections: [[number, number], [number, number]][] = linePoints.map((point, index) => [ point, linePoints[index+1] ?? [0, 10 ] ])

            const linePointsX: [number, number][] = xAxisDeformed.map(point => [point, 0])
            const lineSectionsX: [[number, number], [number, number]][] = linePointsX.map((point, index) => [ point, linePointsX[index+1] ?? [10, 0 ] ])
            
            
            const lineGen = d3.line()
            const linePath = lineGen(linePoints)

            if ( !isCallHovered.state) {
                yAxisGroup.selectAll("path")
                .data(lineSections)
                .join(
                    (enter)  =>
                        enter
                        .append("path")
                        .attr("d", d => lineGen(d))
                        // .attr("transform", d => `translate(0, ${ d[0][1]})`)
                        .attr("stroke-width", (d, i) => 10/Math.pow(yAxisStretch[i], 1/2))
                        .attr("stroke", "black"),
                    (update) => update
                                .attr("d", d => lineGen(d))
                                // .attr("transform", d => `translate(0, ${ d[0][1]})`)
                                .attr("stroke-width", (d, i) => 5),
                    (exit) => exit.remove()
                )
            }

            xAxisGroup.selectAll("path")
            .data(lineSectionsX)
            .join(
                (enter)  =>
                    enter
                    .append("path")
                    .attr("d", d => lineGen(d))
                    // .attr("transform", d => `translate(0, ${ d[0][1]})`)
                    .attr("stroke-width", (d, i) => 10/Math.pow(xAxisStretch[i], 1/2))
                    .attr("stroke", "black"),
                (update) => update
                            .attr("d", d => lineGen(d))
                            // .attr("transform", d => `translate(0, ${ d[0][1]})`)
                            .attr("stroke-width", (d, i) => 5),
                (exit) => exit.remove()
            )

            // selection.select(".call-graph-background").append("g")
            //     .call(xAxisCoverage.ticks(0))
            //     .attr("transform", `translate(${margin}, ${margin + yScaleExperiment(0)})`)
            //     .attr("z-index", 100);
            // selection.select(".call-graph-background").append("g")
            //     .call(xAxisCoverage.ticks(0))
            //     .attr("transform", `translate(${margin}, ${margin + yScaleExperiment(0.58496250072)})`)
            //     .attr("z-index", 100);
            // selection.select(".call-graph-background").append("g")
            //     .call(xAxisCoverage.ticks(0))
            //     .attr("transform", `translate(${margin}, ${margin + yScaleExperiment(1)})`)
                // .attr("z-index", 100);

            for( const copyNumber of wholeCopyNumberChangePositions) {
                selection.select(".call-graph-background").append("g")
                .call(xAxisCoverage.tickSizeOuter(0).ticks(0))
                .attr("transform", `translate(${margin}, ${margin + copyNumber})`)
                .attr("z-index", 100);
            }

            selection.select(".call-graph-background").append("g")
                .attr("text-anchor", "middle")
                .attr("transform", `translate(${(width - (2 * margin)) / 2}, ${ height - margin / 3})`)
                .append("text").text("Absolute Mean coverage depth difference");

            selection.select(".call-graph-background").append("g")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("x", -height / 2)

                .attr("y", margin / 3)
                .attr("transform", "rotate(-90)")
                .text("Log2 copy ratio");

                selection.select(".call-graph-background").append("g")
                .append("text")
                .attr("text-anchor", "middle")
                .attr("x", height / 2)

                .attr("y", -width + margin/3)
                .attr("transform", "rotate(90)")
                .text("Copy number gain");

            // selection.select(".call-graph-background").append("circle")
            //     .attr("cx", )
        }

        if (graphRef.current === null) {return;}
        DrawCallGraph(graphRef.current);

        const arrowContext = arrowRef.current?.getContext("2d") 
        const arrowTopContext = arrowTopRef.current?.getContext("2d")
        if (arrowContext !== undefined && arrowContext !== null) { 
            drawOutsideDomainArrowRight(arrowContext) }
        if (arrowTopContext !== undefined && arrowTopContext !== null) { 
            drawOutsideDomainArrowTop(arrowTopContext)
        }
    }, [graphRef, height, width, arrowRef, arrowTopRef, isCallHovered, CnvCalls]);


    let topArrow = <></>;
    let rightArrow = <></>;

    return (
        <>
        <div className={"call-graph-header"} style={{width: width}}>
            <ToggleButtonGroup key="toggle-buttons">
            <ToggleButton key="color-chromosome" onClick={toggleColorByChromosome} value={"toggleAxis"} selected={isColorByChromosome} ><ColorLensIcon fontSize={"small"}></ColorLensIcon> Color by chromosome </ToggleButton>
            <ToggleButton key="collapse" style={{width:"100px"}} onClick={toggleCollapse} value={"toggleCollapse"} selected={areCollapsed}>
                {
                    areCollapsed 
                        ? <UnfoldMore fontSize="small"> </UnfoldMore>
                        : <UnfoldLessIcon fontSize={"small"}></UnfoldLessIcon>
                }
                {
                    areCollapsed ? "Expand" : "Minimize"
                }
            </ToggleButton>
            </ToggleButtonGroup>
            {/* <button onClick={collapse}>Collapse</button> */}
        </div>
        <div className={"call-graph"} ref={graphRef} >

                {CnvCalls.map((call) => {
                    return (
                        
                        <SmallCnvCallItem
                            cnvCall={call}
                            selectCall={selectCall}
                            id={call.id}
                            key={call.id}
                            height={height }
                            width={width - (2 * margin)}
                            margin={margin}
                            selected = {selectedCallIds.includes(call.id)}
                            minimized = {minimizedCallIds.includes(call.id)}
                            highlighted = {highlightedCallIds.includes(call.id)}
                            visited = {visitedCallIds.includes(call.id)}
                            favorite = {favoriteCallIds?.includes(call.id) ?? false}
                            hoverCall={hoverOverCall}
                            domainX={domainXCoverage}
                            domainY={domainY}
                            contextMenu={contextMenu}
                            scaleY={isCallHovered.state 
                                        ? call.id !== isCallHovered.id 
                                            ? yScale 
                                            : yScaleExperiment
                                        : yScaleExperiment
                                        }
                            scaleX={xScaleExperiment}
                            isColorByChromosome={isColorByChromosome}
                            maxCoverageDifference={maxCoverageDiff}
                            missed={gradingResult?.missedIds.includes(call.id)}
                            correct={gradingResult?.correctlySelectedIds.includes(call.id)}
                            incorrect={gradingResult?.incorrectlySelectedIds.includes(call.id)}

                        ></SmallCnvCallItem>
                        
                    );
                })}
            {/* <div style={{ zIndex: 100 }} key="background"> */}
            <svg className={"call-graph-background"} width={width} height={height} style={{'position': "relative"}}></svg> 
                        {/* </div> */}
        </div>
        </>
    );
};

export default CallGraph;
