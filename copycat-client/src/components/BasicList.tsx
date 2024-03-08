import React, { useState } from "react";
import { CnvCall } from "src/common/common";
import BasicCallItem from "./BasicCallItem";
import CnvCallItem from "./CnvCallItem";
import "./BasicList.scss";
import { GradingResult } from "./Questions/QuestionApp";
import * as d3 from "d3";
import { calculateExonLength } from "../common/callHelper";
import { Button } from "@mui/material";

interface Props {
    CnvCalls: CnvCall[];
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    hoverCall(id: number, isEnter: boolean, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    highlightedCalls: number[];
    handleClearClick(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    handleContinueClick?(): void;
    selectedCallIds: number[];
    gradingResult?: GradingResult
    favoriteCallIds?: number[];
    favoriteCall?(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
}


const BasicList = ({ CnvCalls, selectCall, hoverCall, highlightedCalls, handleClearClick, handleContinueClick, selectedCallIds, gradingResult, favoriteCallIds, favoriteCall}: Props) => {

    const [sortedCalls, setSortedCalls] = useState<CnvCall[]>(CnvCalls)


    // setSortedCalls(CnvCalls)

    const handleSortClickPosition = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "position")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickLength = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "length")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickExon = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "exon")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickCopyRatio = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "copyRatio")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAlleleFractions = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "alleleFractions")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAnnotations = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "annotations")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickMeanCoverage= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "meanCoverage")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAbsMeanCoverage= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "absMeanCoverage")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickProbes= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...sortedCalls], "probes")
        setSortedCalls(newSortedCalls)
    }

    const sortOnColumn = (calls: CnvCall[], propertyName: string): CnvCall[] => {
        let copiedCalls = [...calls];
        let copiedSortedCalls: CnvCall[] = []
        switch (propertyName) {
            case "annotations": { 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => bcall.annotations.length - acall.annotations.length)
                return copiedSortedCalls;
                break;
            }
            case "absMeanCoverage": { 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => Math.abs(d3.mean(bcall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0) - Math.abs(d3.mean(acall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0))
                return copiedSortedCalls;
                break;
            }

            case "meanCoverage": { 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => (d3.mean(bcall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0) - (d3.mean(acall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0))
                return copiedSortedCalls;
                break;
            }
            // case("coverage") { 
            //     sortedCalls.sort(call => d3.mean(d3.mean(call.downsampledCoverage.map(position => position.coverage_diff)) ?? 0) ?? 0)
            // }
            
            case "exon": { 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => {
                    const exons = acall.annotations.filter(feature => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon')
                    const exonLength = calculateExonLength(exons, acall.genomicInterval)

                    const exonsb = bcall.annotations.filter(feature => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon')
                    const exonLengthB = calculateExonLength(exonsb, bcall.genomicInterval)
                    return exonLengthB/(bcall.genomicInterval.end - bcall.genomicInterval.start) - exonLength/(acall.genomicInterval.end - acall.genomicInterval.start) 
                })
                return copiedSortedCalls;
                break;
            }
            
            case "copyRatio": 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => bcall.log2CopyRatio - acall.log2CopyRatio)
                return copiedSortedCalls;
                break;
            
            case "length": 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => bcall.genomicInterval.end - bcall.genomicInterval.start - (acall.genomicInterval.end - acall.genomicInterval.start))
                return copiedSortedCalls;
                break;
            
            case "position": 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => Number(bcall.chromosome) - Number(acall.chromosome))
                return copiedSortedCalls;
                break;
            
            case "alleleFractions": 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => bcall.snvCalls.length - acall.snvCalls.length)
                return copiedSortedCalls;
            
            case "probes": 
                copiedSortedCalls = copiedCalls.sort((acall, bcall) => (bcall.nProbes ?? 0) - (acall.nProbes ?? 0) )
                return copiedSortedCalls;
            

            default:
                console.log("no matching sort")
        }


        return copiedSortedCalls;
    }

    return (
        <table className="call-list call-list-basic ">
            <tbody>
                <tr className="header">
                    <th className="length-col" onClick={handleSortClickPosition}>Position 
                    {/* <Button onClick={handleSortClickPosition}>
                        position
                    </Button> */}
                    </th>
                    <th className="length-col" onClick={handleSortClickLength}>
                        Length of CNV
                        {/* <Button onClick={handleSortClickLength}>Length of CNV</Button> */}
                    </th>                    
                    <th onClick={handleSortClickProbes}>
                        Number of probes
                        {/* <Button onClick={handleSortClickLength}>Length of CNV</Button> */}
                    </th>
                    <th onClick={handleSortClickCopyRatio}>
                        Log2 copy ratio
                        {/* <Button onClick={handleSortClickCopyRatio}>Log2 copy ratio</Button> */}
                    </th>
                    <th onClick={handleSortClickCopyRatio}>
                        Call copy number
                        {/* <Button onClick={handleSortClickCopyRatio}>Call copy number</Button> */}
                    </th>
                    <th onClick={handleSortClickAnnotations}>
                        {/* <Button onClick={handleSortClickAnnotations}>Genes and pseudogenes</Button> */}
                        Genes and pseudogenes
                    </th>
                    <th onClick={handleSortClickExon}>Percentage covered by exon</th>
                    <th className="coverage-col" onClick={handleSortClickAbsMeanCoverage}>
                        {/* <Button onClick={handleSortClickMeanCoverage}>Coverage diff</Button> */}
                        Coverage difference fr. normal (abs)</th>
                    <th onClick={handleSortClickMeanCoverage}>
                        Coverage differences from normal (binned)
                    </th>
                    <th onClick={handleSortClickAlleleFractions}>
                        Allele fractions
                        </th>
                </tr>
                

                {sortedCalls.map((call) => {
                    
                    return (
                        <BasicCallItem
                            cnvCall={call}
                            selectCall={selectCall}
                            id={call.id}
                            key={call.id}
                            highlighted={highlightedCalls.includes(call.id)}
                            hoverCall={hoverCall}
                            selected={selectedCallIds.includes(call.id)}
                            missed={gradingResult?.missedIds.includes(call.id)}
                            correct={gradingResult?.correctlySelectedIds.includes(call.id)}
                            incorrect={gradingResult?.incorrectlySelectedIds.includes(call.id)}
                            isFavorite={favoriteCallIds?.includes(call.id)}
                            favoriteCall={favoriteCall}
                        ></BasicCallItem>
                    );
                })}

            </tbody>
        </table>

    );
};

export default BasicList;
