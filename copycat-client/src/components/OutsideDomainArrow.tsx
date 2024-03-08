import React, { useEffect, useRef } from "react";
import { CnvCall } from "src/common/common";
import * as d3 from "d3";

interface Props {
    cnvCall: CnvCall;
    margin: number;
    direction: "top" | "right";
    position: {top:number, left:number}
    glyphHeight:number;
    glyphWidth: number;
    overshoot?: number;
}
import "./CnvCallItem.scss";
import { drawOutsideDomainArrowRight, drawOutsideDomainArrowTop } from "./drawOutsideDomainArrow";



const OutsideDomainArrow = ({ 
        cnvCall: cnvCall, 
        margin: margin, 
        direction: direction, 
        position: position, 
        glyphHeight, 
        glyphWidth,
        overshoot
    }: Props): JSX.Element => {
    const arrowRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const context = arrowRef.current?.getContext("2d")
        if (context === undefined || context === null) { return; }
        if (direction === "right") {
            drawOutsideDomainArrowRight(context, overshoot)
        }
        if (direction === "top") {
            drawOutsideDomainArrowTop(context, overshoot)
        }

    })

    if (direction === "top"){
        return(
        <canvas ref={arrowRef} key={cnvCall.id+"arrowTop"} style={{ 
            position:"absolute", 
            top: position.top - glyphHeight/2 - 15, 
            left: position.left-5}}>
        </canvas>
        );
    }
    if (direction === "right"){
        return(
        <canvas ref={arrowRef} key={cnvCall.id+"arrowRight"} style={{ 
            position:"absolute", 
            top: position.top-5, 
            left: position.left + glyphWidth/2+5}}>
        </canvas>
        );
    }
    return <></>
};

export default OutsideDomainArrow;
