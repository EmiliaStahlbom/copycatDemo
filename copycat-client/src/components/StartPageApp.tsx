import { Button, Checkbox, CircularProgress, FormControlLabel, FormGroup } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

// import { Grid, GridItem } from "./Grid";
import { Grid } from '@mui/material'
import ListIcon from '@mui/icons-material/List';
import { caseSet } from "src/App"; 
import StartIcon from '@mui/icons-material/Start';



interface Props {
    setMode(state: "graph" | "list" | "start"): void;
    setCase(caseSetName: caseSet): void;
    setTaskState(state: "question" | "case"): void;
}

const StartPageApp = ({
    setMode,
    setCase,
    setTaskState,


}: Props) => {
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [graphContainerWidth, setGraphContainerWidth] = useState<number>(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
    // const [questionState, setQuestionState] = useState<"multiChoice" | "selectCalls">("selectCalls")
    const [displayGraphOrList, setDisplayGraphOrList] = useState<boolean[]>([false, false]);
    const [setAOrB, setSetAOrB] = useState<boolean[]>([false, false, false]);
    const [taskQuestionOrCase, setTaskQuestionOrCase] = useState<boolean[]>([false, false]);






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

    const toggleDisplay = () => {
        
    }


    const handleChangeDisplay = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name)
        let newCheckedBoxes = [...displayGraphOrList];
        newCheckedBoxes.fill(false)
        newCheckedBoxes[index] = !displayGraphOrList[index];
        setDisplayGraphOrList(newCheckedBoxes)
    }

    const handleChangeSet = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name)
        let newCheckedBoxes = [...setAOrB];
        newCheckedBoxes.fill(false)
        newCheckedBoxes[index] = !setAOrB[index];
        setSetAOrB(newCheckedBoxes)
    }
    const handleChangeTask = (event: React.ChangeEvent<HTMLInputElement>) => {
        const index = Number(event.target.name)
        let newCheckedBoxes = [...taskQuestionOrCase];
        newCheckedBoxes.fill(false)
        newCheckedBoxes[index] = !taskQuestionOrCase[index];
        setTaskQuestionOrCase(newCheckedBoxes)
    }

    const handleStartClick = () => {
        const mode = displayGraphOrList[0] 
            ? "graph" 
            : displayGraphOrList[1]
                ? "list"
                : "start"
        setMode(mode)
        const caseName = setAOrB[0] 
        ? taskQuestionOrCase[0] ? "questionA" : "caseA"
        : setAOrB[1] 
            ? taskQuestionOrCase[0] ? "questionB" : "caseB"
            : "test"
 
        setCase(caseName)

        const taskMode = taskQuestionOrCase[0] 
            ? "question" 
            : taskQuestionOrCase[1]
                ? "case"
                : "case";
        setTaskState(taskMode)
    }


    return(
        <div className="app">
        <Grid container>
            <Grid item className="app-menu" sm={1}>
                <div>
                    <img src="./static/copycat.svg" alt="copycat-logo" width="30%" />
                    <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
                </div>
                <Button variant="contained" onClick={handleStartClick} > <StartIcon fontSize="small"></StartIcon> Start</Button>
                
            </Grid>
            <Grid item className="app-main-grid" id={"app-main-grid"} sm={11}>
                        <Grid container>
                            <Grid item className="call-list call-graph-window" id={"call-list-div"} sm={6} ref={graphContainerRef} >
                                <div>
                                <FormGroup >
                                    Select display condition
                                    <FormControlLabel   control={<Checkbox name={`0`} key={`display-check-box-${0}`} checked={displayGraphOrList[0]}  onChange={handleChangeDisplay}/>} label={"Graph"} />
                                    <FormControlLabel   control={<Checkbox name={`1`} key={`display-check-box-${1}`} checked={displayGraphOrList[1]}  onChange={handleChangeDisplay}/>} label={"List"} />
                                </FormGroup>
                                </div>
                                <div>
                                <FormGroup >
                                    Select case set
                                    <FormControlLabel   control={<Checkbox name={`0`} key={`case-check-box-${0}`} checked={setAOrB[0]}  onChange={handleChangeSet}/>} label={"A"} />
                                    <FormControlLabel   control={<Checkbox name={`1`} key={`case-check-box-${1}`} checked={setAOrB[1]}  onChange={handleChangeSet}/>} label={"B"} />
                                    <FormControlLabel   control={<Checkbox name={`2`} key={`case-check-box-${2}`} checked={setAOrB[2]}  onChange={handleChangeSet}/>} label={"Test"} />
                                </FormGroup>
                                </div>
                                <div>
                                <FormGroup >
                                    Select task condition
                                    <FormControlLabel   control={<Checkbox name={`0`} key={`case-check-box-${0}`} checked={taskQuestionOrCase[0]}  onChange={handleChangeTask}/>} label={"Question"} />
                                    <FormControlLabel   control={<Checkbox name={`1`} key={`case-check-box-${1}`} checked={taskQuestionOrCase[1]}  onChange={handleChangeTask}/>} label={"Case"} />
                                </FormGroup>
                                </div>
                            </Grid>
                            <Grid item className="app-right-menu" sm={6}>
                                
                               
                            </Grid>
                        </Grid>
            </Grid>
        </Grid>
        </div>
    );
}

export default StartPageApp