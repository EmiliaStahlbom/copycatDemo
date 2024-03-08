import { Button, Checkbox, FormControlLabel, FormGroup, SxProps } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { CnvCall } from "src/common/common";
import { CaseQuestion, GradingResult, Option, Question } from "src/components/Questions/QuestionApp"
import CheckIcon from '@mui/icons-material/Check';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { waitFor } from "@testing-library/react";

export interface Answer {
    question: SelectCallsQuestion;
    answeredCallIds: number[];
}

interface Props {
    question: CaseQuestion;
    nextQuestion?(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    gradeAnswer?(question: CaseQuestion): void;
    gradingResult?: GradingResult;
    classname?: string;
    isTest?: boolean;
    isUpdated: boolean;
}

export interface SelectCallsQuestion {
    text: string;
    correctCallIds: number[]; 
}

const SelectCalls = ({ question, nextQuestion: nextQuestion, gradeAnswer, gradingResult: grading , classname, isTest, isUpdated}: Props) => {


    const answers: Answer[] = [] 


    const handleNextClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        nextQuestion ? nextQuestion(event) : console.log("No next click handler")
    }

    const handleGradeAnswer = () =>
    {
        gradeAnswer ? gradeAnswer(question) : console.log("No grading implemented")
    }
// 
    // const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    //     const index = Number(event.target.name)
    //     let newCheckedBoxes = [...checkedBoxes];
    //     newCheckedBoxes.fill(false)
    //     newCheckedBoxes[index] = !checkedBoxes[index];
    //     setCheckedBoxes(newCheckedBoxes)
    // }

    // useEffect(() => {
    //     setCheckedBoxes(Array(question.options.length).fill(false))
    //     setStyleBoxes(Array(question.options.length).fill({}))
    // }, [question])


    let borderColor = isUpdated ? "orange" : "#fcfcf7";


    return (
        <div className="question-box">
            <div style={{borderColor: borderColor, borderStyle: "solid", borderWidth: 0, borderLeftWidth: "4px"}}>{question.text}</div>
        
            <div>
                {isTest ? <Button onClick={handleGradeAnswer}>Grade answer<CheckIcon></CheckIcon></Button> : <></>}
                <Button onClick={handleNextClick}>Next question <ArrowForwardIosIcon></ArrowForwardIosIcon></Button>

            </div>
            {/* <div>
                <p>Missed IDs: {grading?.missedIds}</p>
                <p>Correctly selected IDs: {grading?.correctlySelectedIds}</p>
                <p>Incorrectly selected IDs: {grading?.incorrectlySelectedIds}</p>

            </div> */}
        </div>
    );
};

export default SelectCalls;
