import { Button, CircularProgress, Tooltip } from "@mui/material";

import "../../styles/App.css";
import "../../styles/App.scss";
import RestoreIcon from '@mui/icons-material/Restore';
import React, { useEffect, useRef, useState } from "react";
import { Annotation, CnvCall, Interval, CoverageWindow, CoveragePosition } from "src/common/common";
import CallGraph from "../CallGraph";

import CallList from "../CallList";
// import { Grid, GridItem } from "../Grid";
import { Grid } from "@mui/material";
import MultipleChoice from "./MultipleChoice";
import SelectCalls, { SelectCallsQuestion } from "./SelectCalls";
import { calculateExonLength } from "../../../src/common/callHelper";
import * as d3 from "d3";
import BasicList from "../BasicList";
import { interval } from "d3";
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
// import { CoveragePosition} from "src/models/segment";

export interface Option {
    text: string;
    correct: boolean;
    id: number;
}

export interface OptionTemplate {
    text: string;
    id: number;
}

export interface Question {
    text: string;
    options: OptionTemplate[];
    id: string;
    correctOptionId: number;
}

export interface CaseQuestion {
    text: string;
    propertyName: string;
    criteria: string;
    id: string;
}

export interface QuestionTemplate {
    text: string;
    optionTemplates: OptionTemplate[]
    id: string;
}

export interface GradingResult {
    correctlySelectedIds: number[],
    incorrectlySelectedIds: number[],
    missedIds: number[]
}

interface Props {
    CnvCalls: CnvCall[];
    handleClickOnCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    selectCall?(id: number): void;
    contextMenu(id: number): void;
    hoverCall(id: number, isEnter: boolean, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    nextClick(event: React.MouseEvent<HTMLElement, MouseEvent>, gradingResult?: GradingResult): void;
    selectedCalls: CnvCall[];
    highlightedCallIds: number[];
    minimizedCalls: CnvCall[];
    visitedCallIds: number[];
    favoriteCallIds?: number[];
    minimizeCalls(): void;
    handleClearClick(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    handleClearClickFavorite(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    mode: "list" | "start" | "graph";
    handleFavoriteClick(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    isTest?: boolean;
    maxCoverageDiffGlyph?: number;
    maxCoverageDiff?: number;
}

const QuestionApp = ({
    CnvCalls: cnvCalls, 
    handleClickOnCall: handleClickOnCall, 
    selectedCalls: selectedCalls, 
    minimizedCalls: minimizedCalls,
    highlightedCallIds: highlightedCallIds, 
    visitedCallIds: visitedCallIds,
    hoverCall: handleHoverGlyph,
    contextMenu: handleContextMenu,
    nextClick: nextClick,
    minimizeCalls: minimizeCalls,
    handleClearClick: handleClearClick,
    handleClearClickFavorite: handleClearClickFavorite,
    mode: mode,
    handleFavoriteClick: handleFavoriteClick,
    isTest,
    maxCoverageDiffGlyph,
    maxCoverageDiff,
    favoriteCallIds
}: Props) => {
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [graphContainerWidth, setGraphContainerWidth] = useState<number>(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    const [questionState, setQuestionState] = useState<"multiChoice" | "selectCalls">("selectCalls")
    const [gradingResult, setGradingResult] = useState<GradingResult>({missedIds:[], correctlySelectedIds: [], incorrectlySelectedIds: []})



    const questionTexts: string[] = [
        "How much of this CNV is covered by exon?",
        "Which approximate allele ratio is the most common for this CNV?",
        "What is the average coverage difference for this CNV?",
        "What is the distribution of coverage for this CNV?"
    ] 

    const questionTemplates: QuestionTemplate[] = [
        {
            text: questionTexts[0],
            optionTemplates: [
                {text: "0-20 %", id: 0},
                {text: "20-40 %", id: 1},
                {text: "40-60 %", id: 2},
                {text: "60-80 %", id: 3},
                {text: "80-100 %", id: 4},
            ],
            id: "exon_coverage"
        }, 
        {
            text: questionTexts[1],
            optionTemplates: [
                {text: "0-0.2 ", id: 0},
                {text: "0.2-0.4 ", id: 1},
                {text: "0.4- 0.6 ", id: 2},
                {text: "0.6 - 0.8 ", id: 3},
                {text: "0.8 - 1.0 ", id: 4},
            ],
            id: "common_allele_ratio"
        }, 
        {
            text: questionTexts[2],
            optionTemplates: [
                {text: "< -200", id: 0},
                {text: "-200 - -100", id: 1},
                {text: "-100 - 100 ", id: 2},
                {text: "100 - 200 ", id: 3},
                {text: "> 200 ", id: 4},
            ],
            id: "average_coverage_diff"
        }, 
        {
            text: questionTexts[3],
            optionTemplates: [
                {text: "Entirely negative", id: 0},
                {text: "Mostly negative", id: 1},
                {text: "Equally negative and positive", id: 2},
                {text: "Mostly positive", id: 3},
                {text: "Entirely positive", id: 4},
            ],
            id: "exon_coverage"
        }, 
    ]

  


    const selectCallQuestions: SelectCallsQuestion[] = [
        {
            text: "Find the call with the highest copy ratio",
            correctCallIds: [5]
        },
        {
            text: "Find the call with the most exon coverage",
            correctCallIds: [7]
        },
        {
            text: "Select all calls with an average increase in coverage that is higher than 200",
            correctCallIds: [3]
        }
    ]
    



    const selectCallsCaseQuestions: CaseQuestion[] = [
        // Copy ratios
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        // {
        //     text: "Find the call with the highest copy ratio",
        //     criteria: "max",
        //     propertyName: "Log2CopyRatio",
        //     id: "maxCR",
        // },
        // Allele fractions
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },        
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },
        // {
        //     text: "Select a call with a majority of its allele fractions between 0.0 and 0.2 (excluding fractions between 0.9 and 1) ",
        //     criteria: "=[0.0,0.2]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },        
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },   
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },   
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },
        // {
        //     text: "Select a call with a majority of its allele fractions between 0.0 and 0.2 (excluding fractions between 0.9 and 1) ",
        //     criteria: "=[0.0,0.2]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.0 and 0.2 ",
        //     criteria: "!=[0.0,0.2]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.4 and 0.6 ",
        //     criteria: "!=[0.4,0.6]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.2 and 0.4 ",
        //     criteria: "!=[0.2,0.4]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // }0
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.6 and 0.8 ",
        //     criteria: "!=[0.6,0.8]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.8 and 0.9 ",
        //     criteria: "!=[0.8,0.9]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Find the call with copy number closest to 4",
        //     criteria: "~=4",
        //     propertyName: "copyNumber",
        //     id: "closestTo4",
        // },
        // {
        //     text: "Find the call with copy number closest to 1",
        //     criteria: "~=1",
        //     propertyName: "copyNumber",
        //     id: "closestTo1",
        // },
        // {
        //     text: "Select all deletions (all calls with log2 copy ratio < 0)",
        //     criteria: "<0",
        //     propertyName: "Log2CopyRatio",
        //     id: "copyRatio"

        // },
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },        
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },
        // {
        //     text: "Select all calls with mean coverage difference that is larger than 400",
        //     criteria: ">400",
        //     propertyName: "absMeanCoverage",
        //     id: "maxAbsMeanCoverage"

        // },
        // {
        //     text: "Select a call where 70% or more of the regions have NEGATIVE median coverage depth diff",
        //     criteria: "<0",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },
        // {
        //     text: "Select a call where 70% or more of the regions have POSITIVE median coverage depth diff",
        //     criteria: ">0",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },
        // {
        //     text: "Select a call where 70% or more of the regions have POSITIVE median coverage depth diff",
        //     criteria: ">0",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },
        // {
        //     text: "Select a call where 70% or more of the regions have NEGATIVE median coverage depth diff",
        //     criteria: "<0",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },
        // {
        //     text: "Select a call where 70% or more of the regions have POSITIVE median coverage depth diff",
        //     criteria: ">0",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },

        // {
        //     text: "Select a call that has no SNVs with allele fraction between 0.4 and 0.6, estimated copy number 1, and has mostly negative coverage difference. ",
        //     criteria: "!=[0.4,0.6], ~1, <0",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },


    ]
    

    const selectCallsCaseQuestionsTest: CaseQuestion[] = [
        {
            text: "Find the call with the highest copy ratio",
            criteria: "max",
            propertyName: "Log2CopyRatio",
            id: "maxCR",
        },
        {
            text: "Select a call with a majority of its allele fractions between 0.4 and 0.6 (excluding fractions between 0.9 and 1) ",
            criteria: "=[0.4,0.6]",
            propertyName: "snvCalls",
            id: "variantAlleleFreq"

        },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.2 and 0.4 ",
        //     criteria: "!=[0.2,0.4]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"
        // },
        {
            text: "Find the call with the highest exon coverage (percentage)",
            criteria: "max",
            propertyName: "exonPercentage",
            id: "maxExon"
        },
        {
            text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
            criteria: "mixed",
            propertyName: "coverage",
            id: "mostlyBelow"

        },
        // {
        //     text: "Find the call with the highest copy ratio",
        //     criteria: "max",
        //     propertyName: "Log2CopyRatio",
        //     id: "maxCR",
        // },
        // {
        //     text: "Select a call with few (< 10%) allele fractions between 0.4 and 0.6 ",
        //     criteria: "!=[0.4,0.6]",
        //     propertyName: "snvCalls",
        // //     id: "variantAlleleFreq"

        // // },
        // {
        //     text: "Select a call with a majority of its allele fractions between 0.0 and 0.2 (excluding fractions between 0.9 and 1) ",
        //     criteria: "=[0.0,0.2]",
        //     propertyName: "snvCalls",
        //     id: "variantAlleleFreq"

        // },
        // {
        //     text: "Find the call with the highest exon coverage (percentage)",
        //     criteria: "max",
        //     propertyName: "exonPercentage",
        //     id: "maxExon"
        // },
        // {
        //     text: "Select a call that has at least 20% positive and 20% negative coverage diff regions",
        //     criteria: "mixed",
        //     propertyName: "coverage",
        //     id: "mostlyBelow"

        // },

    ]


    useEffect(() => {
        function updateGraphContainerWidth() {
            if (graphContainerRef.current === null) { return; }

            const graphRect = graphContainerRef.current.getBoundingClientRect();
            setGraphContainerWidth(graphRect.width);
        }
        updateGraphContainerWidth();
        const resizeObserver = new ResizeObserver(updateGraphContainerWidth);
        resizeObserver.observe(document.body);
        return () => { resizeObserver.disconnect(); };
    }, [graphContainerRef]);


    const handleNextClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        // if(currentQuestionIndex === questionsA.length - 1) { return }
        setCurrentQuestionIndex(currentQuestionIndex + 1)
        const grading = handleGradeAnswer(selectCallsCaseQuestions[Math.floor(currentQuestionIndex)])
        if(grading === undefined) {nextClick(event)}
        nextClick(event, grading)
        setGradingResult({missedIds:[], incorrectlySelectedIds: [], correctlySelectedIds: []})
    }

    const handleGradeAnswer = (question: CaseQuestion) => {

        // find correct selections
        let facitIds: number[] = [];
        if( question.criteria === "max") {

            if ( question.propertyName === "exonPercentage") {
                facitIds.push(findMaxExomeId())
            }

            if ( question.propertyName === "Log2CopyRatio") {
                facitIds.push(findMaxCopyRatioId())
            }

            if ( question.propertyName === "absMeanCoverage") {
                facitIds.push(findMaxCoverageId())
            }

        }
        if (question.criteria.match(/>.*$/)) {
            const threshold:number = Number(question.criteria.match(/\d+/g))

            if (question.propertyName === "absMeanCoverage") {
                facitIds.push(...findMeanCoveragesAbove(threshold))
            }
            if (question.propertyName === "coverage") {
                facitIds.push(...checkSelectedCoverage70percentAbove(threshold))
            }
        }

        if (question.criteria.match(/<.*$/)) {
            const threshold:number = Number(question.criteria.match(/\d+/g))

            if (question.propertyName === "Log2CopyRatio") {
                facitIds.push(...findCopyRatiosBelow(threshold))
            }
            if (question.propertyName === "coverage") {
                facitIds.push(...checkSelectedCoverage70percentBelow(threshold))
            }
        }

        if (question.criteria.match(/mixed.*$/)) {
            const threshold:number = Number(question.criteria.match(/\d+/g))

            if (question.propertyName === "coverage") {
                facitIds.push(...checkSelectedCoverageMixed(threshold))
            }
        }

        if (question.criteria.match(/~=.*$/)) {
            const target:number = Number(question.criteria.match(/\d+/g))
            if (question.propertyName === "copyNumber") {
                facitIds.push(findClosestCopyNumber(target))
            }
        }

        if (question.criteria.match(/!=\[.*$/)) {
            const interval = question.criteria.match(/0.\d/g)
            if (interval === null) {return} 
            const interval_start:number = Number( interval[0])
            const interval_end:number = Number( interval[1] )


            if (question.propertyName === "snvCalls") {
                facitIds.push(...findVafFrequency([interval_start, interval_end], 0.1))
            }
        }

        if (question.criteria.match(/=\[.*$/)) {
            const interval = question.criteria.match(/0.\d/g)
            if (interval === null) {return} 
            const interval_start:number = Number( interval[0])
            const interval_end:number = Number( interval[1] )


            if (question.propertyName === "snvCalls") {
                facitIds.push(...findVafMostly([interval_start, interval_end], 0.1))
            }
        }

        const selectedIds: number[] = selectedCalls.map(call => call.id)

        const correctlySelectedIds: number[] = []
        const incorrectlySelectedIds: number[] = []
        const missedIds: number[] = []

        // do grading
        cnvCalls.forEach(call => {

            //correct selected list
            if( selectedIds.includes(call.id) ){
                if( facitIds.includes(call.id)) {
                    correctlySelectedIds.push(call.id)
                }
                else { incorrectlySelectedIds.push(call.id)}
            }
            //look for missed calls
            else{
                if( facitIds.includes(call.id)) {
                    missedIds.push(call.id)
                }
            }
        })

        setGradingResult({
            correctlySelectedIds: correctlySelectedIds,
            incorrectlySelectedIds: incorrectlySelectedIds,
            missedIds: missedIds,
        })

        // setHighlightedCallIds([...gradingResult.missedIds, ...gradingResult.correctlySelectedIds, ...gradingResult.incorrectlySelectedIds])

        return {
            correctlySelectedIds: correctlySelectedIds,
            incorrectlySelectedIds: incorrectlySelectedIds,
            missedIds: missedIds,
        }

        
    }

    const findMaxExomeId = () => {
        const exonPercentages: {id: number, exonPercentage: number}[] = cnvCalls.map(call => {
            const featuresRefSeq: Annotation[] = call.annotations.filter(feature => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon');
            const exonLength = calculateExonLength(featuresRefSeq, call.genomicInterval)
    

            return {id: call.id, exonPercentage: exonLength / (call.genomicInterval.end - call.genomicInterval.start)}
        });
        const maxExonPercentageIndex: number = d3.maxIndex(exonPercentages.map(call=> call.exonPercentage))
        const maxExonPercentageId: number = exonPercentages[maxExonPercentageIndex].id



        return maxExonPercentageId;

    }

    const findMaxCoverageId = () => {

        const maxCoverageIndex: number = d3.maxIndex(cnvCalls.map(call=> Math.abs(call.meanCoverage)))
        const maxCoverageId: number = cnvCalls[maxCoverageIndex].id

        return maxCoverageId

    }

    const findMaxCopyRatioId = () => {

        const maxCopyRatioIndex: number = d3.maxIndex(cnvCalls.map(call=> call.log2CopyRatio))
        const maxCopyRatioId: number = cnvCalls[maxCopyRatioIndex].id

        return maxCopyRatioId

    }


    const findMeanCoveragesAbove = (threshold: number) => {
        let ids: number[] = [];


        cnvCalls.forEach(call => {
            if(call.downsampledCoverage !== undefined) {
                const meanCoverage:number = (d3.mean( call.downsampledCoverage.map((position) => position.coverage_diff)) ?? 0)
                if( meanCoverage > threshold) { 
                    ids.push(call.id) 
                }
            }
        })
        return ids;
    }

    const findCopyRatiosBelow = (threshold: number) => {
        let ids: number[] = [];
        cnvCalls.forEach(call => {

                if( call.log2CopyRatio < threshold) { 
                    ids.push(call.id) 
                }
            }
        )
        return ids;
    }

    const findCoverage70percentBelow = (threshold: number) => {
        let ids: number[] = [];


        cnvCalls.forEach(call => {
            let belowThresholdCount = 0;
            let aboveThresholdCount = 0;
            call.downsampledCoverage?.forEach(window =>{
                window.coverage_diff < threshold ? belowThresholdCount++ : aboveThresholdCount++;
            })
            
            if( belowThresholdCount/(aboveThresholdCount + belowThresholdCount) > 0.7) {ids.push(call.id)}
            }
        )
        return ids;
    }

    const checkSelectedCoverage70percentBelow = (threshold: number) => {
        let ids: number[] = [];


        cnvCalls.forEach(call => { 
            let belowThresholdCount = 0;
            let aboveThresholdCount = 0;
            call.downsampledCoverage?.forEach(window =>{
                window.coverage_diff < threshold ? belowThresholdCount++ : aboveThresholdCount++;
            })
            // if(call.coverageWindows !== undefined) {
            //     const coverage_differences: number[] = call.coverageWindows.map(window => {
            //         return window.map(pos => pos.coverage_diff)
            //     }).flat()
            //     coverage_differences.flat().forEach(pos => {
            //         (pos < threshold) ? belowThresholdCount++ : aboveThresholdCount++;
            //     })
            // }
            console.log(belowThresholdCount, aboveThresholdCount, aboveThresholdCount + belowThresholdCount)
            if( belowThresholdCount/(aboveThresholdCount + belowThresholdCount) > 0.7) {ids.push(call.id)}
            }
        )
        return ids;
    }

    const checkSelectedCoverage70percentAbove = (threshold: number) => {
        let ids: number[] = [];


        cnvCalls.forEach(call => {
            let belowThresholdCount = 0;
            let aboveThresholdCount = 0;
            call.downsampledCoverage?.forEach(window =>{
                window.coverage_diff < threshold ? belowThresholdCount++ : aboveThresholdCount++;
            })
            // if(call.coverageWindows !== undefined) {
            //     const coverage_differences: number[] = call.coverageWindows.map(window => {
            //         return window.map(pos => pos.coverage_diff)
            //     }).flat()
                
            //     coverage_differences.flat().forEach(pos => {
            //         (pos < threshold) ? belowThresholdCount++ : aboveThresholdCount++;
            //     })
            // }
            
            if( aboveThresholdCount/(belowThresholdCount + aboveThresholdCount) > 0.7) {ids.push(call.id)}
            }
        )
        return ids;
    }


    const checkSelectedCoverageMixed = (threshold: number) => {
        let ids: number[] = [];


        cnvCalls.forEach(call => {
            let belowThresholdCount = 0;
            let aboveThresholdCount = 0;
            call.downsampledCoverage?.forEach(window =>{
                window.coverage_diff < threshold ? belowThresholdCount++ : aboveThresholdCount++;
            })
            // if(call.coverageWindows !== undefined) {
            //     const coverage_differences: number[] = call.coverageWindows.map(window => {
            //         return window.map(pos => pos.coverage_diff)
            //     }).flat()
                
            //     coverage_differences.flat().forEach(pos => {
            //         (pos < threshold) ? belowThresholdCount++ : aboveThresholdCount++;
            //     })
            // }
            
            if( aboveThresholdCount/(belowThresholdCount + aboveThresholdCount) >= 0.2 && belowThresholdCount/(belowThresholdCount + aboveThresholdCount) >= 0.2) {ids.push(call.id)}
            }
        )
        return ids;
    }

    const findClosestCopyNumber = (target: number) => {
        let minDiff = Math.abs(Math.pow(2,cnvCalls[0].log2CopyRatio*2) - target)
        let closestCallId = 0;



        cnvCalls.forEach(call => {
            const diff = Math.abs( target - Math.pow(2, call.log2CopyRatio) * 2)
            if( diff < minDiff) { 
                closestCallId = call.id; 
                minDiff = diff;
            }
        })
        return closestCallId;
    }

    const findVafOutside = (interval: [start: number, end: number]) => {
        let ids: number[] = cnvCalls.map(call => call.id);
        let subtractIds: number[] = []


        cnvCalls.forEach(call => {
            call.snvCalls.forEach(snv => {
                if(
                    snv.alleleFrequency[0] > interval[0] 
                    && snv.alleleFrequency[0] < interval[1]
                ) {
                    subtractIds.push(call.id)
                }
            })
        })

        const facitIds = ids.filter(id => !subtractIds.includes(id));
        return facitIds;
    }

    
    const findVafFrequency = (interval: [start: number, end: number], threshold: number) => {
        let ids: number[] = cnvCalls.map(call => call.id);
        let subtractIds: number[] = [];

        // const numberOfSnvs = ids.length;
        cnvCalls.forEach(call => {
            const numberOfSnvs: number = call.snvCalls.length;
            let numberOfSnvsInInterval = 0;
            call.snvCalls.forEach(snv => {
                if(
                    snv.alleleFrequency[0] > interval[0] 
                    && snv.alleleFrequency[0] < interval[1]
                ) {
                    numberOfSnvsInInterval++
                }
            })
            if(numberOfSnvsInInterval/numberOfSnvs > threshold){
                subtractIds.push(call.id)
            }
        })

        const facitIds = ids.filter(id => !subtractIds.includes(id));
        return facitIds;
    }

    const findVafMostly = (interval: [start: number, end: number], threshold: number) => {
        let ids: number[] = cnvCalls.map(call => call.id);
        let subtractIds: number[] = [];

        // const numberOfSnvs = ids.length;
        cnvCalls.forEach(call => {
            const numberOfSnvs: number = call.snvCalls.length;
            let numberOfSnvsInInterval = 0;
            let numberAbove09 = 0;
            call.snvCalls.forEach(snv => {
                if(
                    snv.alleleFrequency[0] > interval[0] 
                    && snv.alleleFrequency[0] < interval[1]
                ) {
                    numberOfSnvsInInterval++
                }
                else if(snv.alleleFrequency[0] >= 0.9){
                    numberAbove09++
                }   
            })
            if(numberOfSnvsInInterval/(numberOfSnvs-numberAbove09) > 0.5){
                subtractIds.push(call.id)
            }
        })

        const facitIds = ids.filter(id => !subtractIds.includes(id));
        return subtractIds;
    }

    let currentQuestion = isTest ? selectCallsCaseQuestionsTest[Math.floor(currentQuestionIndex % 4)] : selectCallsCaseQuestions[Math.floor(currentQuestionIndex)];

    if(mode === "list"){
        return (
            <div className="app">
                <Grid container>
                    <Grid item className="app-menu" sm={1}>
                        <div>
                            <img src="./static/copycat.svg" alt="copycat-logo" width="30%" />
                            <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
                        </div>
                    <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
                    <Button variant="contained" onClick={handleClearClickFavorite} > <DeleteSweepIcon fontSize="small"></DeleteSweepIcon> Deselect non-favorites</Button>

          
                    </Grid >
                    <Grid item className={"app-main-grid"} sm={11}>
                        <Grid container>
                            <Grid item className={"app-basic-call-list"}>
                            {cnvCalls !== undefined && cnvCalls?.length > 0 && cnvCalls[0]?.genomicInterval !== undefined
                                         
                                ? <BasicList 
                                    CnvCalls={cnvCalls} 
                                    selectCall={handleClickOnCall} 
                                    highlightedCalls={highlightedCallIds} 
                                    hoverCall={handleHoverGlyph}
                                    handleClearClick={handleClearClick}
                                    selectedCallIds={selectedCalls.map(call => call.id)}
                                    gradingResult={isTest ? gradingResult : undefined}
                                    favoriteCall={handleFavoriteClick}
                                    favoriteCallIds={favoriteCallIds}
                                />
                                :  <CircularProgress class-name="loading-spinner" style={{justifyContent: "center"}}/> }
                            </Grid>
                            <Grid item className="app-question-box-basic">

                                {questionState === "multiChoice"
                                ? <></>
                                : <SelectCalls
                                    question={currentQuestion}
                                    nextQuestion={handleNextClick}
                                    gradeAnswer={handleGradeAnswer}
                                    gradingResult={gradingResult}
                                    isTest={isTest}
                                    isUpdated={
                                        isTest 
                                        ? currentQuestion.text !== selectCallsCaseQuestionsTest[Math.floor(currentQuestionIndex-1)]?.text 
                                        : currentQuestion.text !== selectCallsCaseQuestions[Math.floor(currentQuestionIndex-1)]?.text
                                    }
                                ></SelectCalls>}
                                {gradingResult?.missedIds.map(id => id)}
                            </Grid>
                        </Grid>
                    </Grid>
            </Grid>
        </div>
        )
                    
    }

    return(
        <div className="app">
        <Grid container>
            <Grid item className="app-menu" sm={1}>
                <div>
                    <img src="./static/copycat.svg" alt="copycat-logo" width="30%" />
                    <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
                </div>
                {/* <Button variant="contained" onClick={toggleDisplay} > <ListIcon fontSize="small"></ListIcon> Change display</Button> */}
                <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
            </Grid>
            <Grid item className="app-main-grid" id={"app-main-grid"} sm={11}>
                        <Grid container>
                            <Grid item classes="call-list call-graph-window" id={"call-list-div"} sm={6} ref={graphContainerRef} style={{"position": "relative"}}>
                                {cnvCalls !== undefined && cnvCalls?.length > 0 && cnvCalls[0]?.genomicInterval !== undefined
                                    ? <CallGraph 
                                    CnvCalls={cnvCalls}
                                    selectCall={handleClickOnCall}
                                    width={graphContainerWidth}
                                    selectedCalls={selectedCalls}
                                    minimizedCalls={minimizedCalls}
                                    hoverCall={handleHoverGlyph}
                                    highlightedCallIds={highlightedCallIds}
                                    contextMenu={handleContextMenu}
                                    visitedCallIds={visitedCallIds} 
                                    areAxesLocked={true} 
                                    gradingResult={isTest ? gradingResult : undefined}
                                    toggleAxisLock={function (): void {
                                        throw new Error("Function not implemented.");
                                    } } 
                                    areCollapsed={false} 
                                    toggleCollapse={minimizeCalls} 
                                    isColorByChromosome={false}
                                    maxCoverageDiff={maxCoverageDiffGlyph ?? 500}
                                    favoriteCallIds={favoriteCallIds}
                                    />
                                    : <CircularProgress class-name="loading-spinner"/> 
                                }
                            </Grid>
                            <Grid item className="app-right-menu" sm={6}>
                                
                                <CallList 
                                    CnvCalls={selectedCalls} 
                                    selectCall={handleClickOnCall} 
                                    highlightedCalls={highlightedCallIds} 
                                    hoverCall={handleHoverGlyph}
                                    favoriteCall={handleFavoriteClick}
                                    classname={"question-selected-list"}
                                    gradingResult={isTest ? gradingResult : undefined}
                                    maxCoverageDiff={maxCoverageDiff ?? 900}
                                    favoriteCallIds={favoriteCallIds}
                                    deleteSweep={handleClearClickFavorite}
                                />
                                {questionState === "multiChoice"
                                ? <></>
                                : <SelectCalls
                                    question={currentQuestion}
                                    nextQuestion={handleNextClick}
                                    gradeAnswer={handleGradeAnswer}
                                    gradingResult={gradingResult}
                                    isTest={isTest}
                                    isUpdated={
                                        isTest 
                                        ? currentQuestion.text !== selectCallsCaseQuestionsTest[Math.floor(currentQuestionIndex-1)]?.text 
                                        : currentQuestion.text !== selectCallsCaseQuestions[Math.floor(currentQuestionIndex-1)]?.text
                                    }
                                ></SelectCalls>}
                                {gradingResult?.missedIds.map(id => id)}
                            </Grid>
                        </Grid>
            </Grid>
        </Grid>

        </div>
    );
}

export default QuestionApp