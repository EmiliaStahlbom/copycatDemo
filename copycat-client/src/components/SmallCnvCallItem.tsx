import React, { useEffect, useRef, useState } from "react";
import { CnvCall } from "src/common/common";
import { calculateExonLength } from "../../src/common/callHelper";

interface Props {
    cnvCall: CnvCall;
    id: number;
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    contextMenu(id: number): void;
    hoverCall(id: number, isEnter: boolean, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    height: number;
    width: number;
    margin: number;
    highlighted?: boolean;
    selected: boolean;
    visited?: boolean;
    favorite?: boolean;
    domainX: [number, number];
    domainY: [number, number];
    minimized: boolean;
    scaleY: d3.ScaleLinear<number, number, never>;
    scaleX: d3.ScaleLinear<number, number, never>;
    isColorByChromosome: boolean;
    maxCoverageDifference?: number;
    missed?: boolean;
    correct?: boolean;
    incorrect?: boolean;
}
import "./SmallCnvCallItem.scss";
import { DrawDetailedCoverageGlyph, DrawSmallCoverageGlyph as drawSmallCoverageGlyph } from "./coverageGlyph";

import { drawDetailedVafGlyphAnglebased, drawSmallVafGlyphAnglebased } from "./vafGlyph";
import * as d3 from "d3";
import { drawMiniPlaceholder } from "./MiniPlaceHolder"
import { Annotation } from "src/common/common"
import { experimentalScaleY } from "./CallGraph";
import { rgb } from "d3";
import { render } from "@testing-library/react";
import { logHover } from "src/services/saveInteraction";
import { border } from "@mui/system";

const SmallCnvCallItem = (
        { 
            cnvCall: cnvCall, 
            selectCall,  
            contextMenu,
            hoverCall, 
            id: id, 
            height: height, 
            width: width, 
            margin: margin, 
            highlighted, 
            selected,
            visited,
            favorite,
            domainX,
            domainY,
            minimized,
            scaleY,
            scaleX,
            isColorByChromosome,
            maxCoverageDifference,
            missed,
            correct,
            incorrect

        }: Props
    ):JSX.Element => {
    if(cnvCall === undefined) {return <></>}
    const [isHovered, setIsHovered] = useState<boolean>(false)


    let timeout: NodeJS.Timeout;
    function handleClick(event: React.MouseEvent<HTMLElement>) {
 
        selectCall(id, event);
    }

    function handleDoubleClick() {
        contextMenu(id);
    }

    function handleContextMenu() {
        contextMenu(id)
    }

    function handleHoverTrue( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        timeout= setTimeout(() => {
            setIsHovered(true);
            hoverCall(id, true, event);

        }, 80)
    }

    function handleHoverFalse( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        clearTimeout(timeout)
        setIsHovered(false);
        hoverCall(id, false, event);
    }

    const glyphReference = useRef<HTMLCanvasElement>(null);


    const callStart = cnvCall.genomicInterval.start;
    const callEnd = cnvCall.genomicInterval.end;
    const xScaleLength = d3.scaleLog().domain([5000, 50000000]).range([0, width]);
    const xScaleCoverage = scaleX//d3.scaleLinear().domain(domainX).range([0, width]).clamp(true)
    const yScaleLinear = d3.scaleLinear().domain(domainY).range([height, 0]).clamp(true);
    let yScale = scaleY.clamp(true);

    const smallGlyphHeight = 52;
    const smallGlyphWidth = 52;

    const detailedGlyphHeight = 122;
    const detailedGlyphWidth = 122;

    const miniGlyphHeight = 12;
    const miniGlyphWidth = 12;

    const exons = cnvCall.annotations.filter(annotation => annotation.featureType === "exon")

    let glyphHeight = smallGlyphHeight;
    let glyphWidth = smallGlyphWidth;

    const isOutsideDomain: boolean =  (d3.mean(cnvCall.downsampledCoverage?.map((d) => d.coverage_diff) ?? [0]) ?? 0) > domainX[1];
    const featuresFiltered: Annotation[] = cnvCall.annotations.filter((feature) =>
        ["gene", "pseudogene", "exon"].includes(feature.featureType),
    );

    const featuresRefSeq: Annotation[] = featuresFiltered.filter(feature => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon');
    const knownGenes: string[] = [];
    const uniqueFeatures: Annotation[] = [];

    const totalExonLength = calculateExonLength(featuresRefSeq, cnvCall.genomicInterval)
    const colorScheme = d3.schemeSet3

    const genes = featuresRefSeq.filter((feature) => feature.featureType === "gene" || feature.featureType === "pseudogene");


    const percentageExon = totalExonLength / (callEnd - callStart);

    useEffect(() => {
        
        if ( selected || minimized || visited ){
            glyphHeight = miniGlyphHeight;
            glyphWidth = miniGlyphWidth
        }
        else if (isHovered) {
            glyphHeight = detailedGlyphHeight;
            glyphWidth = detailedGlyphWidth
        }
        else {
            glyphHeight = smallGlyphHeight;
            glyphWidth = smallGlyphWidth
        }
        // Create canvas and draw background
        const selection  = d3.select(glyphReference.current);
        selection.selectAll("*").remove();

        const renderContext = selection
            .attr("height", glyphHeight)
            .attr("width", glyphWidth+1)
            .node()
            ?.getContext("2d");

        isColorByChromosome ? selection.classed("chromosome-color") : selection.attr("none", "none")

        if (renderContext === null || renderContext === undefined) {return;}
        if (glyphReference.current === null) {return}
        // if (visited) {glyphReference.current.className += " visited"}

        const absoluteCoverageDiff: number[] = coverageDiff.map((d:number): number => Math.abs(d))

        glyphReference.current.style.top = String(yScale(cnvCall.log2CopyRatio) + 72 +margin - (glyphHeight / 2))+"px";
        glyphReference.current.style.left = String(xScaleCoverage(
            Math.abs(d3.mean(coverageDiff) ?? 0)
        ) + margin - glyphWidth/2)+"px";
        glyphReference.current.style.borderRadius = String(glyphHeight/2)+"px";
        glyphReference.current.style.zIndex = isHovered ? "600" : "400";

        // 

        if ( selected || minimized || visited ) {
            glyphReference.current.style.zIndex = "350";
            drawMiniPlaceholder(renderContext, selected, favorite)
            return;
        }

        if (isHovered) {

            drawDetailedVafGlyphAnglebased(renderContext, cnvCall.snvCalls);
            if (cnvCall.downsampledCoverage === undefined) {return;}
            DrawDetailedCoverageGlyph(cnvCall.downsampledCoverage, cnvCall.genomicInterval, renderContext, percentageExon, genes.length > 0, undefined, maxCoverageDifference);
            return;
        }

        drawSmallVafGlyphAnglebased(renderContext, cnvCall.snvCalls);
        if (cnvCall.downsampledCoverage === undefined) {return;}
        drawSmallCoverageGlyph(cnvCall.downsampledCoverage, cnvCall.genomicInterval, renderContext,  percentageExon, genes.length > 0, undefined, maxCoverageDifference);

    }, [ cnvCall, selected, isHovered, glyphReference, minimized, visited, favorite, isColorByChromosome ]);

    let coverageDiff: number[] = []

    if (cnvCall.downsampledCoverage !== undefined) {

        coverageDiff = cnvCall.downsampledCoverage.map((position) => {
            return position.coverage_diff;
        }) 
    }

    let  borderColor = "rgb(230,230,230)"

    if( missed ) { borderColor ="purple"}
    if( correct ) { borderColor ="green" }
    if( incorrect ) { borderColor ="red"}

    return (
     
        <canvas 
            key={id + "canvas"} 
            ref={glyphReference} 
            className={
                selected 
                ? highlighted
                    ? "small-cnv-call-item pair-partner-hovered" 
                    :"small-cnv-call-item selected" 
                : minimized || visited
                    ? "small-cnv-call-item minimized"
                    : isColorByChromosome 
                        ? "small-cnv-call-item "
                        :"small-cnv-call-item chromosome-color"
                        
            } 
            onClick={handleClick}
            onDoubleClick={handleDoubleClick}
            onContextMenu={handleContextMenu}
            onMouseEnter={handleHoverTrue}
            onMouseLeave={handleHoverFalse}
            style={{ 
                position: "absolute", 
                top: yScale(cnvCall.log2CopyRatio) - (glyphHeight / 2),  // + 72 +margin //yScale(cnvCall.log2CopyRatio) + margin - glyphHeight / 2, 
                left: xScaleCoverage(
                    Math.abs(d3.mean(coverageDiff) ?? 0)
                ) - glyphWidth/2 + margin,
                borderColor: isColorByChromosome 
                    ?  colorScheme[Number(cnvCall.chromosome.match(/[0-9]+/g)) % 12] 
                    :  highlighted
                        ? "goldenrod"
                        : borderColor,
                borderStyle:  isColorByChromosome || isHovered || highlighted ? "solid" : "groove",
                borderWidth: "2px",

            }}
            >
        </canvas>
       
    );
};

export default SmallCnvCallItem;
