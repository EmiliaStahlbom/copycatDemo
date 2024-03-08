import * as d3 from "d3";
import React, { useEffect, useRef } from "react";

interface Props {
    text: string[],
    position: [x: number, y: number]
}


const Tooltip = ({
    text,
    position
}: Props) => {

    return(
        <div style={{top: position[1], left: position[0]}}>
            {text.map(string => string + " \n")}
        </div>
        
    )
}

export default Tooltip