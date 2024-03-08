import { Checkbox, FormControlLabel, FormGroup, SxProps } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import { CnvCall } from "src/common/common";
import { Option, Question } from "src/components/Questions/QuestionApp"

export interface Answer {
    question: Question;
    answer: number;
}

interface Props {
    question: Question;
    selectOption?(id: number): void;
    nextQuestion?(event: React.MouseEvent<HTMLElement, MouseEvent>): void;
}

const MultipleChoice = ({ question, nextQuestion: nextQuestion }: Props) => {
    const [checkedBoxes, setCheckedBoxes] = useState<boolean[]>(Array(question.options.length).fill(false));
    const [styleBoxes, setStyleBoxes] = useState<SxProps[]>(Array(question.options.length).fill({}));

    const answers: Answer[] = [] 


    const handleNextClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        nextQuestion ? nextQuestion(event) : console.log("No next click handler")
        const selectedOptionIndex = checkedBoxes.findIndex((value) => value)
        answers.push({
            question: question,
            answer: selectedOptionIndex,
        })
    }

    const gradeAnswer = () =>
    {
        // const correctAnswerPattern: boolean[] = question.options.map(option => option.correct)
        const selectedOptionIndex = checkedBoxes.findIndex((value) => value)
        
        if (selectedOptionIndex === question.correctOptionId) {
            console.log("correct answer!")
            let newStyle = [...styleBoxes].fill({color: "gray"})
            // question.options.forEach((option, i) => {
            //     if (i === question.correctOptionId) {
            //         newStyle[i] = {backgroundColor: "lightgreen"}
            //     }
            // })
            newStyle[question.correctOptionId] = {backgroundColor: "lightgreen"}

            setStyleBoxes(newStyle)
        }
        else{
            console.log("uh oh...not quite right")
            let newStyle = [...styleBoxes].fill({color: "gray"})

            newStyle[question.correctOptionId] = {backgroundColor: "green", borderColor: "green"}
            newStyle[selectedOptionIndex] = {backgroundColor: "red", bordercolor: "red"}
            setStyleBoxes(newStyle)
        }
    }

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name)
        let newCheckedBoxes = [...checkedBoxes];
        newCheckedBoxes.fill(false)
        newCheckedBoxes[index] = !checkedBoxes[index];
        setCheckedBoxes(newCheckedBoxes)
    }

    useEffect(() => {
        setCheckedBoxes(Array(question.options.length).fill(false))
        setStyleBoxes(Array(question.options.length).fill({}))
    }, [question])

    return (
        <div className="question-box">
            <div>{question.text}</div>
            <FormGroup >
                {question.options.map((option, i) => {

                    return <FormControlLabel sx={styleBoxes[i]}  control={<Checkbox name={`${i}`} key={`check-box-${i}`} checked={checkedBoxes[i]}  onChange={handleChange}/>} label={option.text} />
                })}
            </FormGroup>
            <div style={{margin: "10px"}}>
                <button onClick={handleNextClick}>Next question</button>
                <button onClick={gradeAnswer}>Grade answer</button>
            </div>
        </div>
    );
};

export default MultipleChoice;
