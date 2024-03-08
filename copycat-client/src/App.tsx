import React, { useEffect, useRef, useState } from "react";
import "./styles/App.css";
import "./styles/App.scss";
import {
    CnvCall,
    SnvCall,
    Annotation,
    CaseCalls,
    CoverageWindow,
    CoveragePosition,
} from "./common/common";
// import { Grid, GridItem } from "./components/Grid";
import { api } from "./services/api";
import { logClick, logContinueClick, logHover, logReset, } from "./services/saveInteraction";
import CallList from "./components/CallList";
import CallGraph from "./components/CallGraph";
import { BrowserRouter, Route, Switch} from "react-router-dom";
import Next from './Next'
import BasicList from "./components/BasicList";
import { Button, CircularProgress, ToggleButton, Tooltip } from "@mui/material";
import QuestionApp, { GradingResult, Question } from "./components/Questions/QuestionApp";
import StartPageApp from "./components/StartPageApp";
import RestoreIcon from '@mui/icons-material/Restore';
import DvrIcon from '@mui/icons-material/Dvr';
import ArtTrackIcon from '@mui/icons-material/ArtTrack';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import ListIcon from '@mui/icons-material/List';
import DoneIcon from '@mui/icons-material/Done';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import * as d3 from "d3";
import { Grid } from '@mui/material'

export interface Task {
    question: Question;
    caseId: number;
    
}

export type caseSet = "questionA" | "questionB" | "caseA" | "caseB" | "test" | "casetest" | "questiontest" | undefined;

function App() {
    const numberOfSamples: number=20;

    // Data hooks
    const [cnvCalls, setCnvCalls] = useState<CnvCall[]>([]);
    const [selectedCalls, setSelectedCalls] = useState<CnvCall[]>([]);
    const [minimizedCalls, setMinimizedCalls] = useState<CnvCall[]>([]);
    const [isHovered, setIsHovered] = useState<boolean>(false)
    const [highlightedCallIds, setHighlightedCallIds] = useState<number[]>([]);
    const [visitedCallIds, setVisitedCallIds] = useState<number[]>([]);
    const [favoriteCallIds, setFavoriteCallIds] = useState<number[]>([]);
    const [graphContainerWidth, setGraphContainerWidth] = useState<number>(0);
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const [next, setNext] = useState<Boolean>(false);
    const [index, setIndex] = useState<number>(0)
    const [scaleAxes, setScaleAxes] = useState<boolean>(false);
    const [savedCalls, setSavedCalls] = useState<CaseCalls[]>([]);
    const [mode, setMode] = useState<"start"|"graph"|"list">("start")
    const [state, setState] = useState<"question"|"case">("question")
    const [selectedCaseSet, setSelectedCaseSet] = useState<caseSet>()
    const [maxCoverageDiff, setMaxCoverageDiff] = useState<number>(20)
    const [maxCoverageDiffGlyph, setMaxCoverageDiffGlyph] = useState<number>(1)


    // Load cnv calls
    useEffect(() => {
        if( index >= numberOfSamples) {
            let jsonBlob = new Blob([JSON.stringify(savedCalls)])
            downloadBlob(jsonBlob, 'myfile.json');
        }
        if ( selectedCaseSet === undefined) { return ;}

        let newCalls: CnvCall[] = [];


        api.getCnvCalls(index.toString(), selectedCaseSet).then((response) => {
            response.calls.forEach((call, i) => {
                let newSnvCalls: SnvCall[] = [];
                call.snvs.forEach((snv_call) => {
                    newSnvCalls.push({
                        chr: snv_call.chr,
                        position: snv_call.position,
                        reference: snv_call.reference,
                        alternative: snv_call.alternatives.map((alts) => alts.split("")),
                        alleleFrequency: snv_call.alleleFrequencies,
                    });
                });

                let newAnnoations: Annotation[] = [];
                call.annotations.forEach((feature) => {
                    newAnnoations.push({
                        genomicInterval: { start: feature.start,  end: feature.end },
                        featureType: feature.type,
                        chr: feature.chr,
                        id: feature.id,
                        source: feature.source,
                    });
                });

                newCalls.push({
                    genomicInterval: { start: call.start, end: call.end },
                    chromosome: call.chr,
                    log2CopyRatio: call.copyRatio,
                    snvCalls: newSnvCalls,
                    meanCoverage: call.meanCoverage,
                    annotations: newAnnoations,
                    id: i,
                    downsampledCoverage: call.downsampledCoverage,
                    nProbes: call.nProbes,
                });
            });
            setCnvCalls(newCalls);
            setMaxCoverageDiffGlyph(d3.max(newCalls.map(cnvCall => Math.abs(d3.mean(cnvCall.downsampledCoverage?.map(pos => pos.coverage_diff) ?? [0]) ?? 0))) ?? maxCoverageDiffGlyph)
        });
        

    }, [index, selectedCaseSet]);

    useEffect(() => {
        if (cnvCalls === undefined || cnvCalls.length === 0 || selectedCaseSet === undefined){return;} 
        if (cnvCalls[0].coverageWindows !== undefined) {return;}

        api.getCnvCoverages(index.toString(), selectedCaseSet).then((response) => {
            let modifiedCalls: CnvCall[] = [];
            response.cnvCoverage.forEach((call, i) =>
                modifiedCalls.push(
                    {
                        coverageWindows: call.coverageWindows,
                        ...cnvCalls[i],
                    },
                )
                );
            setCnvCalls(modifiedCalls);
            
            const callsCoverageWindowsMax: number[][] = modifiedCalls.map(call => {
                if (call.coverageWindows === undefined){
                    return [0];
                }
                return call.coverageWindows.map(window => Math.max(...window.map(pos => Math.abs(pos.coverage_diff))))
            })
            const maxCoverageDifference: number  = Math.max(...callsCoverageWindowsMax.map(call => Math.max(...call)));


            setMaxCoverageDiff(maxCoverageDifference/5)
        });
    }, [cnvCalls, index, selectedCaseSet]);

    useEffect(() => {
        const listDivElement = document.getElementById("call-list-div");
        if (listDivElement === null){
            return;
        }
        
    }, [cnvCalls]);

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
    }, [graphContainerRef.current]);


    const selectCall = (id: number) => {
        const selectedCall: CnvCall | undefined = cnvCalls ? cnvCalls.find(call => call.id === id) : undefined;
        if (selectedCall === undefined) {
            return;
        }
        if (selectedCalls.map(call => call.id).includes(id)) {
            return;
        }
        // add item to list
        let newSelectedCalls: CnvCall[] = [...selectedCalls];
        newSelectedCalls.push(selectedCall);
        setSelectedCalls(newSelectedCalls);
        
        if(scaleAxes){
            // remove item from graph
            let CnvCallsDisplayed = cnvCalls?.filter((call) => call.id !== id)
            setCnvCalls(CnvCallsDisplayed)
        }
    };


    const deSelectCall = (id: number) => {
        if (scaleAxes){
            // add items to graph
            let newCallsDisplayed: CnvCall[] = [...cnvCalls ?? []]
            const selectedCall = selectedCalls?.find(call => call.id === id)
            if (selectedCall === undefined) { return }
            newCallsDisplayed.push(selectedCall)
            setCnvCalls(newCallsDisplayed)

        }

        // remove items from list
        let newSelectedCalls: CnvCall[] = [];
        selectedCalls.forEach(call => {
            if (call.id === id) {return;}
            newSelectedCalls.push({ ...call });
        });
        setSelectedCalls(newSelectedCalls);
        const newFavoriteCallIds = favoriteCallIds.filter(favoriteId => favoriteId !== id)
        setFavoriteCallIds(newFavoriteCallIds)
        // let newVisitedCallIds: number[] = [...visitedCallIds]
        // newVisitedCallIds.push(id)
        // setVisitedCallIds(newVisitedCallIds)
    };


    const minimizeCall = (id: number) => {
        const selectedCall: CnvCall | undefined = cnvCalls ? cnvCalls.find(call => call.id === id) : undefined;
        if (selectedCall === undefined) {
            return;
        }

        let newMinimizedCalls: CnvCall[] = [...minimizedCalls];
        newMinimizedCalls.push(selectedCall)
        setMinimizedCalls(newMinimizedCalls)
    }

    const favoriteCall = (id: number) => {
        const selectedCall: CnvCall | undefined = cnvCalls ? cnvCalls.find(call => call.id === id) : undefined;
        if (selectedCall === undefined) {
            return;
        }
        let newFavoriteCallIds: number[] = [...favoriteCallIds];
        newFavoriteCallIds.push(selectedCall.id)
        setFavoriteCallIds(newFavoriteCallIds)
        selectCall(id)
    }


    const unMinimizeCall = (id: number) => {

        let newMinimizedCalls: CnvCall[] = [...minimizedCalls];
        newMinimizedCalls = newMinimizedCalls.filter((call) => call.id !== id)
        setMinimizedCalls(newMinimizedCalls)
    }


    const unFavoriteCall = (id: number) => {
        const selectedCall: CnvCall | undefined = cnvCalls ? cnvCalls.find(call => call.id === id) : undefined;
        if (selectedCall === undefined) {
            return;
        }

        let newFavoriteCallIds: number[] = [...favoriteCallIds];
        newFavoriteCallIds = newFavoriteCallIds.filter(callId => callId !== id)
        setFavoriteCallIds(newFavoriteCallIds)

    }

    const handleClickOnCall = ( id: number, event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        // if (visitedCallIds.includes(id)) {
        //     setVisitedCallIds([...visitedCallIds].filter(callId => callId !== id))
        //     return;
        // }
        // if (minimizedCalls.map(call => call.id).includes(id)){
        //     unMinimizeCall(id);
        //     return;
        // }

        const selectedCall: CnvCall | undefined = cnvCalls ? cnvCalls.find(call => call.id === id) : undefined;
        logClick(id, event);


        if (selectedCalls.map(call => call.id).includes(id)){
            deSelectCall(id);
            return;
        }
        selectCall(id);

    };

    const handleFavoriteClick = (id: number, event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        if (favoriteCallIds.includes(id)){
            unFavoriteCall(id);
            return;
        }
        favoriteCall(id);

    };


    const handleContextMenu = (id: number) => {
        event?.preventDefault()

        if (minimizedCalls.map(call => call.id).includes(id)){
            unMinimizeCall(id)
            return
        }

        minimizeCall(id)
    };

    const handleHoverGlyph = (id: number, isEnter: boolean, event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        
        if(isEnter) {
            logHover(id, event)
            setHighlightedCallIds([id])
            setIsHovered(true)
            return;
        }
        setHighlightedCallIds([])
        setIsHovered(false)

    }

    const handleClearClick = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        logReset(-1, event, selectedCalls, favoriteCallIds, minimizedCalls)

        let newCnvCalls = [...cnvCalls]
        selectedCalls.forEach(call => newCnvCalls.push(call))
        // setCnvCalls(newCnvCalls);
        setSelectedCalls([]);
        setMinimizedCalls([]);
        setFavoriteCallIds([]);
        setHighlightedCallIds([]);
        setVisitedCallIds([]);
    }

    const handleClearClickFavorite = (event: React.MouseEvent<HTMLElement, MouseEvent>) => {
        logReset(-1, event, selectedCalls, favoriteCallIds, minimizedCalls)

        let newCnvCalls = [...cnvCalls]
        selectedCalls.forEach(call => newCnvCalls.push(call))
        // setCnvCalls(newCnvCalls);
        setSelectedCalls([...selectedCalls.filter(call => favoriteCallIds.includes(call.id))]);
        setMinimizedCalls([]);
        setFavoriteCallIds([...favoriteCallIds]);
        setHighlightedCallIds([]);
        setVisitedCallIds([]);
    }

    const handleContinueClick = (event: React.MouseEvent<HTMLElement, MouseEvent>, gradingResult?: GradingResult) => {

        logContinueClick(0, event, selectedCalls, favoriteCallIds, minimizedCalls, cnvCalls, gradingResult)
        const updatedCaseCalls = [...savedCalls];
        updatedCaseCalls.push({
            calls: selectedCalls,
            caseIndex: index
        })
        setSavedCalls(updatedCaseCalls);
        setSelectedCalls([])
        setMinimizedCalls([])
        setHighlightedCallIds([])
        setCnvCalls([])

        setNext(true);
        setIndex(index+1);

    }

    const handleContinueClickQuestion = () => {
        const updatedCaseCalls = [...savedCalls];
        updatedCaseCalls.push({
            calls: selectedCalls,
            caseIndex: index
        })
        setSavedCalls(updatedCaseCalls);
        setSelectedCalls([])
        setMinimizedCalls([])
        setHighlightedCallIds([])

        setNext(true);
        setIndex(index+1);

    }

    const toggleAxisLock = () => {
        setScaleAxes(!scaleAxes)
    }

    const toggleDisplay = () => {
        
        setMode(mode === "list" ? "graph" : "list")
    }

    const dismissRemainingCalls = () => {
        let newMinimizedCalls = [...minimizedCalls];
        cnvCalls.forEach(call => {
            newMinimizedCalls.push(call)
        })
        setMinimizedCalls(newMinimizedCalls)
    }

    const undoMinityrization = () => {
        setMinimizedCalls([]);
    }

    const toggleMinityrization = () => {
        if(minimizedCalls.length > 0 ){
            setMinimizedCalls([]) 
            return;
        }

        let newMinimizedCalls = [...minimizedCalls];
        cnvCalls.forEach(call => {
            newMinimizedCalls.push(call)
        })
        setMinimizedCalls(newMinimizedCalls)
    }

    function downloadBlob(blob: Blob, name = 'file.txt') {
        // Convert your blob into a Blob URL (a special url that points to an object in the browser's memory)
        const blobUrl = URL.createObjectURL(blob);
      
        // Create a link element
        const link = document.createElement("a");
      
        // Set link's href to point to the Blob URL
        link.href = blobUrl;
        link.download = name;
      
        // Append link to the body
        document.body.appendChild(link);
      
        // Dispatch click event on the link
        // This is necessary as link.click() does not work on the latest firefox
        link.dispatchEvent(
          new MouseEvent('click', { 
            bubbles: true, 
            cancelable: true, 
            view: window 
          })
        );
      
        // Remove link from body
        document.body.removeChild(link);
      }

    document.body.classList.add("stop-scrolling");
                    

    if(mode === "start"){
        return (
            <StartPageApp
            setCase={setSelectedCaseSet}
            setMode={setMode}
            setTaskState={setState}
            ></StartPageApp>
            
        )
                    
    }

    if(state === "question"){
        return (
            <QuestionApp
                CnvCalls={cnvCalls}
                handleClickOnCall={handleClickOnCall}
                selectedCalls={selectedCalls}
                minimizedCalls={minimizedCalls}
                highlightedCallIds={highlightedCallIds}
                visitedCallIds={visitedCallIds}
                hoverCall={handleHoverGlyph}
                contextMenu={handleContextMenu}
                nextClick={handleContinueClick}
                minimizeCalls={toggleMinityrization} 
                handleClearClick={handleClearClick}
                mode={mode}
                handleFavoriteClick={handleFavoriteClick}
                isTest={selectedCaseSet === "test"}
                maxCoverageDiffGlyph={maxCoverageDiffGlyph}
                maxCoverageDiff={maxCoverageDiff}
                favoriteCallIds={favoriteCallIds}
                handleClearClickFavorite={handleClearClickFavorite}
            />
        )
    }

    if (state === "case" && mode === "graph")
    return (
        <div className="app">
            <Grid container>
                <Grid item className="app-menu" sm={1}>
                    <div>
                        <img src="./static/copycat.svg" alt="copycat-logo" width="80%"/>
                        <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
                    </div>
                    {/* <Button variant="contained" onClick={toggleDisplay} > <ListIcon fontSize="small"></ListIcon> Change display</Button> */}
                    <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
                    {/* <Button variant="contained" onClick={handleClearClickFavorite} > <DeleteSweepIcon fontSize="small"></DeleteSweepIcon> Deselect non-favorites</Button> */}
                    <Button variant="contained" onClick={handleContinueClick} ><DoneIcon fontSize="small"></DoneIcon> Continue</Button>

                </Grid>
                <Grid item className="app-main-grid" id={"app-main-grid"} sm={11}>

                            <Grid container>
                                <Grid item className="call-list call-graph-window" id={"call-list-div"} sm={6} ref={graphContainerRef} style={{"position": "relative"}}>
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
                                                favoriteCallIds={favoriteCallIds}
                                                areAxesLocked={true}
                                                toggleAxisLock={toggleAxisLock}
                                                areCollapsed={minimizedCalls.length > 0}
                                                toggleCollapse={toggleMinityrization}
                                                isColorByChromosome={false}
                                                maxCoverageDiff={maxCoverageDiffGlyph}

                                        />
                                        : <CircularProgress class-name="loading-spinner"/> 
                                    }
                                </Grid>
                                <Grid item className="app-right-menu " sm={6}>
                                    
                                    <CallList 
                                        CnvCalls={selectedCalls} 
                                        selectCall={handleClickOnCall} 
                                        highlightedCalls={highlightedCallIds} 
                                        hoverCall={handleHoverGlyph}
                                        handleClearClick={handleClearClick}
                                        handleContinueClick={handleContinueClick}
                                        favoriteCall={handleFavoriteClick}
                                        favoriteCallIds={favoriteCallIds}
                                        classname={"case-selected-list"}
                                        maxCoverageDiff={maxCoverageDiff}
                                        deleteSweep={handleClearClickFavorite}

                                    />
                                </Grid>
                            </Grid>
  
                </Grid>
            </Grid>
        </div>
        
    );

    return (
        <div className="app">
            <Grid container>
                <Grid item className="app-menu" sm={1}>
                    <div>
                        <img src="./static/copycat.svg" alt="copycat-logo" width="80%"/>
                        <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
                    </div>
                    {/* <Button variant="contained" onClick={toggleDisplay} > <ListIcon fontSize="small"></ListIcon> Change display</Button> */}
                    <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
                    <Button variant="contained" onClick={handleContinueClick} ><DoneIcon fontSize="small"></DoneIcon> Continue</Button>

                </Grid>
                <Grid item className="app-main-grid" id={"app-main-grid"} sm={11}>

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
                                favoriteCall={handleFavoriteClick}
                                favoriteCallIds={favoriteCallIds}
                            />
                            :  <CircularProgress class-name="loading-spinner" style={{justifyContent: "center"}}/> }
                        </Grid>
                    </Grid>

                </Grid>
            </Grid>
        </div>
        
    );
}

    // return (
    //     <div className="app">
    //         <Grid noWrap={false}>
    //             <GridItem className="app-menu" sm={1}>
    //                 <div>
    //                     <img src="./static/copycat.svg" alt="copycat-logo" width="80%"/>
    //                     <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
    //                 </div>
    //                 <Button variant="contained" onClick={toggleDisplay} > <ListIcon fontSize="small"></ListIcon> Change display</Button>
    //                 <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
    //                 <Button variant="contained" onClick={handleContinueClick} ><DoneIcon fontSize="small"></DoneIcon> Continue</Button>

    //             </GridItem>
    //             <GridItem className="app-main-grid" id={"app-main-grid"} sm={11}>

    //                         <Grid>
    //                             <GridItem className="call-list call-graph-window" id={"call-list-div"} sm={6} ref={graphContainerRef} >
    //                                 {cnvCalls !== undefined && cnvCalls?.length > 0 && cnvCalls[0]?.genomicInterval !== undefined
    //                                     ? <CallGraph 
    //                                             CnvCalls={cnvCalls} 
    //                                             selectCall={handleClickOnCall} 
    //                                             width={graphContainerWidth}
    //                                             selectedCalls={selectedCalls}
    //                                             minimizedCalls={minimizedCalls}
    //                                             hoverCall={handleHoverGlyph}
    //                                             highlightedCallIds={highlightedCallIds}
    //                                             contextMenu={handleContextMenu}
    //                                             visitedCallIds={visitedCallIds}
    //                                             favoriteCallIds={favoriteCallIds}
    //                                             areAxesLocked={true}
    //                                             toggleAxisLock={toggleAxisLock}
    //                                             areCollapsed={minimizedCalls.length > 0}
    //                                             toggleCollapse={toggleMinityrization}
    //                                             isColorByChromosome={false}
    //                                             maxCoverageDiff={maxCoverageDiffGlyph}

    //                                     />
    //                                     : <CircularProgress class-name="loading-spinner"/> 
    //                                 }
    //                             </GridItem>
    //                             <GridItem className="app-right-menu " sm={6}>
                                    
    //                                 <CallList 
    //                                     CnvCalls={selectedCalls} 
    //                                     selectCall={handleClickOnCall} 
    //                                     highlightedCalls={highlightedCallIds} 
    //                                     hoverCall={handleHoverGlyph}
    //                                     handleClearClick={handleClearClick}
    //                                     handleContinueClick={handleContinueClick}
    //                                     favoriteCall={handleFavoriteClick}
    //                                     favoriteCallIds={favoriteCallIds}
    //                                     classname={"case-selected-list"}
    //                                     maxCoverageDiff={maxCoverageDiff}

    //                                 />
    //                             </GridItem>
    //                         </Grid>
  
    //             </GridItem>
    //         </Grid>
    //     </div>
        
    // );


//     return (
//         <div className="app">
//             <Grid noWrap={false}>
//                 <GridItem className="app-menu" sm={1}>
//                     <div>
//                         <img src="./static/copycat.svg" alt="copycat-logo" width="80%"/>
//                         <h1  style={{ display: "inline-block", fontSize: "large", fontWeight: "normal", fontFamily: "monospace", margin: "10px"}}>Copycat</h1>
//                     </div>
//                     <Button variant="contained" onClick={toggleDisplay} > <ListIcon fontSize="small"></ListIcon> Change display</Button>
//                     <Button variant="contained" onClick={handleClearClick} > <RestoreIcon fontSize="small"></RestoreIcon> Reset</Button>
//                     <Button variant="contained" onClick={handleContinueClick} ><DoneIcon fontSize="small"></DoneIcon> Continue</Button>

//                 </GridItem>
//                 <GridItem className="app-main-grid" id={"app-main-grid"} sm={11}>

//                     <Grid>
//                         <GridItem className={"app-basic-call-list"}>
//                         {cnvCalls !== undefined && cnvCalls?.length > 0 && cnvCalls[0]?.genomicInterval !== undefined
                                    
//                             ? <BasicList 
//                                 CnvCalls={cnvCalls} 
//                                 selectCall={handleClickOnCall} 
//                                 highlightedCalls={highlightedCallIds} 
//                                 hoverCall={handleHoverGlyph}
//                                 handleClearClick={handleClearClick}
//                                 selectedCallIds={selectedCalls.map(call => call.id)}
//                             />
//                             :  <CircularProgress class-name="loading-spinner" style={{justifyContent: "center"}}/> }
//                         </GridItem>
//                     </Grid>

//                 </GridItem>
//             </Grid>
//         </div>
        
//     );
// }

export default App;
