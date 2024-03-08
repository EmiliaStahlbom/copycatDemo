import React, { useEffect, useRef } from "react";
import { CnvCall } from "src/common/common";
import * as d3 from "d3";

interface Props {
    cnvCall: CnvCall;
    id: number;
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    hoverCall(id:number, isEnter: boolean,  event: React.MouseEvent<HTMLElement, MouseEvent>): void
    highlighted?: boolean;
    selected?: boolean;
    missed?: boolean;
    correct?: boolean;
    incorrect?: boolean;
    isFavorite?: boolean;
    favoriteCall?(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
}
// import "./CnvCallItem.scss";
import { drawCopyRatioGlyph } from "./CopyRatioGlyph";
import { DrawCoverageGlyph as drawCoverageGlyph } from "./coverageGlyph";
import { drawLengthGlyphSector } from "./LengthGlyph";
import { drawVafGlyphAnglebased, drawVafGlyphLinear } from "./vafGlyph";
import { precisionRound } from "d3";
import { Button, Tooltip } from "@mui/material";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { calculateExonLength } from "../common/callHelper";

import StarIcon from '@mui/icons-material/Star';
import { NoPhotography, StarOutline } from "@mui/icons-material";


const BasicCallItem = ({ cnvCall: cnvCall, selectCall, hoverCall, id: id, highlighted, selected, missed, correct, incorrect, isFavorite, favoriteCall }: Props) => {
    
    function handleClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
        selectCall(id, event);
    }


    function handleMouseEnter( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        hoverCall(id, true, event);
    }

    function handleMouseLeave( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        hoverCall(id, false, event);
    }

    
    function handleClickFavorite(event: React.MouseEvent<HTMLElement, MouseEvent>) {
        event.stopPropagation()
        favoriteCall ? favoriteCall(id, event) : console.log("No function attached to button");
    }


    const vafReference = useRef<SVGSVGElement>(null);
    const coverageReferenceDiv = useRef<HTMLDivElement>(null);

    const intervalReference = useRef<SVGSVGElement>(null);
    const ratioReference = useRef<SVGSVGElement>(null);

    const callReference = useRef<HTMLTableRowElement>(null);
    const features = cnvCall.annotations;
    const refseq_features = features.filter((feature) => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon')

    const genes = refseq_features.filter((feature) => feature.featureType === "gene" || feature.featureType === "pseudogene")

    const exonPercentage = calculateExonLength(refseq_features, cnvCall.genomicInterval) /(cnvCall.genomicInterval.end - cnvCall.genomicInterval.start)

    // Format gene names
    let genesStrings: string[] = genes.map(gene => gene.id .split("gene-")[1] + ", ")
    if(genes.length > 4 ){
        genesStrings = [genes.length.toString() + " genes and pseudogenes"]
    }

    // extract coverage difference
    let coverage_diff: number[] = []
    if(cnvCall.downsampledCoverage){
        coverage_diff = cnvCall.downsampledCoverage.map(pos => pos.coverage_diff)
    }

    // calculate average coverage for a histogram with numberOfBins 
    let averageCoverage = Math.abs(d3.mean(cnvCall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0)

    const numberOfBins = ((cnvCall.downsampledCoverage?.length ?? 0) < 5) ? cnvCall.downsampledCoverage?.length ?? 0 : 5;
    const binToPosition = d3.scaleLinear().domain([0,numberOfBins]).range([0, coverage_diff.length])

    let averageBasedFootprint: number[] = [];
    for (let i=0; i < numberOfBins; i++){
        const startIndex = Math.floor(binToPosition(i))
        const endIndex = Math.floor(binToPosition(i+1))
        const coverageDiffs: number[] = cnvCall.downsampledCoverage?.slice(startIndex, endIndex).map(covPos=> covPos.coverage_diff) ?? []
        const averageCoverageDiff: number = d3.mean(coverageDiffs) ?? 0;
        averageBasedFootprint.push(averageCoverageDiff)
    }

    // Bin SNV data
    const numberOfBinsVaf = 10;
    const scaleFactor = 10;
    const length = cnvCall.snvCalls.length;
    const vafHistogramGenerator = d3.bin()
        .domain([0, 1])
        .thresholds(numberOfBinsVaf);

    const binnedVafData = vafHistogramGenerator(cnvCall.snvCalls.map((call) => call.alleleFrequency[0]) );
    const nonZeroVafData = binnedVafData.filter((bin) => bin.length > 0);

    const filteredVafData = binnedVafData.filter((bin) => bin.length > length / scaleFactor);


    let borderColor= "goldenrod";
    if( missed ) { borderColor ="purple"}
    if( correct ) { borderColor ="green" }
    if( incorrect ) { borderColor ="red"}

    return (
        <tr 
            key={id}  
            onClick={handleClick}

            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={selected ? "cnv-call-item selected-list-item" : highlighted ? "cnv-call-item hover " : "cnv-call-item"} 
            ref={callReference} 
            style={{backgroundColor: selected || missed ?  borderColor : "#f9f9f7"}}
            >

            <td>
                {cnvCall.chromosome + ": " + cnvCall.genomicInterval.start + "-" + cnvCall.genomicInterval.end}
                {/* <svg height={30} width={60} key={id} className={"LengthGlyph"} ref={intervalReference} /> */}
            </td>
            {/* <td>
                <svg height={100} width={110} key={id} className={"VafGlyph"} ref={vafReference} />
            </td> */}
            <td>
            {((cnvCall.genomicInterval.end -  cnvCall.genomicInterval.start)/1000).toFixed(1) + " kb"}
            </td>
            <td>
                {cnvCall.nProbes ?? "Unknown"}
            </td>
            <td> 
                {/* <svg height={100} width={40} key={id} className={"CopyRatioGlyph"}ref={ratioReference} /> */}
                {cnvCall.log2CopyRatio.toFixed(2) }
            </td>
            <td> 
                {/* <svg height={100} width={40} key={id} className={"CopyRatioGlyph"}ref={ratioReference} /> */}
                {`${(2*Math.pow(2, cnvCall.log2CopyRatio)).toFixed(2)} `}
            </td>
            <Tooltip  title={<>{genes.map(annotation => <span>{annotation.id.split("gene-")[1] + ", "}</span>)}</>}>
                <td>
                   {genesStrings}

                </td>
            </Tooltip>
            <td>
                {(exonPercentage * 100).toFixed(1) + "%"} 
            </td>
            
            <td>
                {
                    averageCoverage === 0 ? "N/A" : averageCoverage.toFixed(2)


                }
            </td>
            
            <Tooltip title={cnvCall.downsampledCoverage?.map(target => target.coverage_diff.toFixed(2) + ", ")}>
                <td>
                    {averageBasedFootprint.map(bin => bin.toFixed(2) + ", ")
                    }
                    {/* <Button className="remove-button" onClick={handleClick}>{
                        selected ? <RemoveCircleIcon></RemoveCircleIcon> : <AddCircleIcon></AddCircleIcon>}
                    </Button> */}
                </td>
            </Tooltip>
            <Tooltip title={binnedVafData.map(bin => (bin.length ?? 0) > 0 ? bin.x0?.toFixed(2) + ": " + bin.length+ ", " : "") }>
                <td>
                    {<table className="vaf-table">
                        <tbody>
                            
                            <tr> {
                                binnedVafData.map(bin => <th> { bin.x0 }</th>)
                                 }</tr>
                            <tr>
                                { binnedVafData.map(bin => (bin.length ? <td> {bin.length}</td> : <td>{0}</td>))}
                            </tr>
                        </tbody>
                    </table>
                    }
                    {/* // nonZeroVafData.length > 0 ? nonZeroVafData.map(bin => (bin.x0 ?? 0).toFixed(2) + ", " ) : "-"} */}
                    {/* <Button className="remove-button" onClick={handleClick}>{
                        selected ? <RemoveCircleIcon></RemoveCircleIcon> : <AddCircleIcon></AddCircleIcon>}
                    </Button> */}
                </td>
            </Tooltip>
            <td>
                <Button className="favorite-button" onClick={handleClickFavorite}>{isFavorite ? <StarIcon></StarIcon> : <StarOutline></StarOutline>}</Button>
            </td>
        </tr>
    );
};

export default BasicCallItem;
