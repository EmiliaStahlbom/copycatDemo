import React, { useState } from "react";
import { CnvCall } from "src/common/common";
import CnvCallItem from "./CnvCallItem";
import "./CallList.scss";
import { GradingResult } from "./Questions/QuestionApp";
import { calculateExonLength } from "../common/callHelper";
import * as d3 from "d3";
import { Button } from "@mui/material";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

interface Props {
    CnvCalls: CnvCall[];
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    hoverCall(id: number, isEnter: boolean, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    favoriteCall?(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    highlightedCalls: number[];
    handleClearClick?(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    handleContinueClick?(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    favoriteCallIds?: number[];
    classname?: string,
    gradingResult?: GradingResult;
    maxCoverageDiff?: number;
    deleteSweep?(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
}




const CallList = ({ 
    CnvCalls, 
    selectCall, 
    hoverCall, 
    favoriteCall, 
    highlightedCalls, 
    handleClearClick, 
    handleContinueClick, 
    favoriteCallIds, 
    classname, 
    gradingResult,
    maxCoverageDiff,
    deleteSweep
}: Props) => {


    const [sortedCalls, setSortedCalls] = useState<CnvCall[]>(CnvCalls)


    // setSortedCalls(CnvCalls)

    const handleSortClickPosition = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "position")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickLength = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "length")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickExon = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "exon")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickCopyRatio = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "copyRatio")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAlleleFractions = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "alleleFractions")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAnnotations = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "annotations")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickMeanCoverage= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "meanCoverage")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickAbsMeanCoverage= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "absMeanCoverage")
        setSortedCalls(newSortedCalls)
    }

    const handleSortClickProbes= (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        const newSortedCalls = sortOnColumn([...CnvCalls], "probes")
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
        <div className={classname}>
            <table className="call-list selected-list">
                <tbody>
                    <tr className="header" key="selected-list-header">

                        <th className="length-col" onClick={handleSortClickLength}><span>Position and length</span></th>
                        
                        <th  onClick={handleSortClickProbes}><span>Number of probes</span></th>
                        <th onClick={handleSortClickAlleleFractions}><span>Sample B-allele fractions</span></th>
                        <th onClick={handleSortClickCopyRatio}><span>Copy ratio</span></th>
                        <th onClick={handleSortClickMeanCoverage} className="coverage-col"><span>Coverage depth diff. from normal</span></th>
                        <th>
                        <Button variant="contained" onClick={deleteSweep} > <DeleteSweepIcon fontSize="small"></DeleteSweepIcon> Deselect non-favorites</Button>
                    </th>
                    </tr>
                    

                    {sortedCalls.length === CnvCalls.length 
                    ? sortedCalls.map((call) => {    
                        return (
                            <CnvCallItem
                                cnvCall={call}
                                selectCall={selectCall}
                                id={call.id}
                                key={call.id + "cnvCallItem"}
                                highlighted={highlightedCalls.includes(call.id)}
                                hoverCall={hoverCall}
                                favoriteCall={favoriteCall}
                                isFavorite={favoriteCallIds?.includes(call.id) ?? false}
                                missed={gradingResult?.missedIds.includes(call.id)}
                                correct={gradingResult?.correctlySelectedIds.includes(call.id)}
                                incorrect={gradingResult?.incorrectlySelectedIds.includes(call.id)}
                                maxCoverageDiff={maxCoverageDiff}

                            ></CnvCallItem>
                        )})
                    
                    : CnvCalls.map((call) => {
                        
                        return (
                            <CnvCallItem
                                cnvCall={call}
                                selectCall={selectCall}
                                id={call.id}
                                key={call.id + "cnvCallItem"}
                                highlighted={highlightedCalls.includes(call.id)}
                                hoverCall={hoverCall}
                                favoriteCall={favoriteCall}
                                isFavorite={favoriteCallIds?.includes(call.id) ?? false}
                                missed={gradingResult?.missedIds.includes(call.id)}
                                correct={gradingResult?.correctlySelectedIds.includes(call.id)}
                                incorrect={gradingResult?.incorrectlySelectedIds.includes(call.id)}
                                maxCoverageDiff={maxCoverageDiff}

                            ></CnvCallItem>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default CallList;
