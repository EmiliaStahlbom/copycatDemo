
import { GradingResult } from "src/components/Questions/QuestionApp";
import { CnvCall } from "../common/common";
import { api } from "./api";

export interface logInteraction{
    timestamp: number;
    eventType: string;
    elementId: number | undefined;
    mouseXCoordinate: number;
    mouseYCoordinate: number;
    misc?: string;

}

export function logClick(callId: number, event: React.MouseEvent<HTMLElement, MouseEvent>, call?: CnvCall) {

    const timestamp = Date.now()
    const jsonRepresentation: logInteraction = {
        timestamp: timestamp,
        eventType: "click-call",
        elementId: callId,
        mouseXCoordinate: event.clientX,
        mouseYCoordinate: event.clientY,
        misc: JSON.stringify(call)

    }
    api.postInteraction(JSON.stringify(jsonRepresentation)) 
}



export function logHover(id:number, event: React.MouseEvent<HTMLElement, MouseEvent>) {
    const timestamp = Date.now()
    const jsonRepresentation: logInteraction = {
        timestamp: timestamp,
        eventType: "hover-call",
        elementId: id,
        mouseXCoordinate: event.clientX,
        mouseYCoordinate: event.clientY,

    }

    api.postInteraction(JSON.stringify(jsonRepresentation))
}


export function logReset(id:number, event: React.MouseEvent<HTMLElement, MouseEvent>, selectedCalls?: CnvCall[], favoriteIds?: number[], minimized?: CnvCall[]) {
    const timestamp = Date.now()
    const jsonRepresentation: logInteraction = {
        timestamp: timestamp,
        eventType: "reset-click",
        elementId: -1,
        mouseXCoordinate: event.clientX,
        mouseYCoordinate: event.clientY,
        misc: JSON.stringify({"selectedCalls": selectedCalls, "favoriteIds": favoriteIds, "minimized": minimized})

    }
    api.postInteraction(JSON.stringify(jsonRepresentation)) 

}

export function logContinueClick(callId: number, event: React.MouseEvent<HTMLElement, MouseEvent>, selectedCalls: CnvCall[], favoriteIds: number[], minimized: CnvCall[], caseCalls: CnvCall[], grading?: GradingResult) {
    const timestamp = Date.now()
    const jsonRepresentation: logInteraction = {
        timestamp: timestamp,
        eventType: "continue-click",
        elementId: -1,
        mouseXCoordinate: event.clientX,
        mouseYCoordinate: event.clientY,
        misc: JSON.stringify({"selectedCalls": selectedCalls, "grading": grading, "favoriteIds": favoriteIds, "minimized": minimized, "caseCalls": caseCalls})

    }
    api.postInteraction(JSON.stringify(jsonRepresentation)) 
}