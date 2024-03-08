import React, { useEffect, useRef } from "react";
import { Annotation, CnvCall } from "src/common/common";
import * as d3 from "d3";

interface Props {
    cnvCall: CnvCall;
    id: number;
    selectCall(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    hoverCall(id:number, isEnter: boolean,  event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    highlighted?: boolean;
    favoriteCall?(id: number, event: React.MouseEvent<HTMLElement, MouseEvent>): void;
    isFavorite: boolean;
    missed?: boolean;
    correct?: boolean;
    incorrect?: boolean;
    maxCoverageDiff?: number;
}
import "./CnvCallItem.scss";
import { drawCopyRatioGlyph } from "./CopyRatioGlyph";
import { DrawCoverageGlyph as drawCoverageGlyph } from "./coverageGlyph";
import { drawLengthGlyphSector } from "./LengthGlyph";
import { drawVafGlyphAnglebased, drawVafGlyphLinear } from "./vafGlyph";
import { Button, Tooltip } from "@mui/material";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import StarsIcon from '@mui/icons-material/Stars';
import StarIcon from '@mui/icons-material/Star';
import { pink, yellow } from "@mui/material/colors";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { StarOutline } from "@mui/icons-material";

const CnvCallItem = ({ 
    cnvCall: cnvCall, 
    selectCall, 
    hoverCall, 
    id: id, 
    highlighted, 
    favoriteCall, 
    isFavorite, 
    missed, 
    correct, 
    incorrect,
    maxCoverageDiff
 }: Props) => {
    
    function handleClick(event: React.MouseEvent<HTMLElement, MouseEvent>) {
        selectCall(id, event);
    }

    function handleClickFavorite(event: React.MouseEvent<HTMLElement, MouseEvent>) {
        favoriteCall ? favoriteCall(id, event) : console.log("No function attached to button");
    }

    function handleMouseEnter( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        hoverCall(id, true, event);
    }

    function handleMouseLeave( event: React.MouseEvent<HTMLElement, MouseEvent>) {
        hoverCall(id, false, event);
    }

    const vafReference = useRef<SVGSVGElement>(null);
    const coverageReferenceDiv = useRef<HTMLDivElement>(null);

    const intervalReference = useRef<SVGSVGElement>(null);
    const ratioReference = useRef<SVGSVGElement>(null);

    const callReference = useRef<HTMLTableRowElement>(null);

    const refseq_features = cnvCall.annotations.filter((feature) => feature.source === "BestRefSeq" || feature.source === 'BestRefSeq%2CGnomon')
    const genesAndPseudogenes: Annotation[] = refseq_features.filter((feature) =>
        ["gene", "pseudogene"].includes(feature.featureType),
    );

    let borderColor= "rgb(230,230,230)";
    if( missed ) { borderColor ="purple"}
    if( correct ) { borderColor ="green" }
    if( incorrect ) { borderColor ="red"}


    useEffect(() => {

        if (intervalReference.current === null) {return;}
        drawLengthGlyphSector(intervalReference.current, cnvCall.genomicInterval);

        if (ratioReference.current === null) {return;}
        drawCopyRatioGlyph(ratioReference.current, cnvCall.log2CopyRatio);

        if (vafReference.current === null) {return;}
        drawVafGlyphLinear(vafReference.current, cnvCall.snvCalls);

        if (coverageReferenceDiv.current === null || cnvCall.coverageWindows === undefined) {return;}
        drawCoverageGlyph(coverageReferenceDiv.current, cnvCall.coverageWindows, cnvCall.genomicInterval, cnvCall.annotations, maxCoverageDiff);
     
    }, [intervalReference, ratioReference, vafReference, coverageReferenceDiv, cnvCall, cnvCall.coverageWindows, callReference]);



    return (
        <tr 
            key={String(id) + "detailed"}  
            // onClick={handleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className={highlighted ? "cnv-call-item hover " : "cnv-call-item"} 
            ref={callReference} 
            style={{borderLeftColor: highlighted ? "goldenrod" : borderColor}}
            >

            <td>
                <div>{cnvCall.chromosome + ": " + cnvCall.genomicInterval.start + "-" + cnvCall.genomicInterval.end}</div>
                <svg height={30} width={60} key={id + "lengthGlyph"} className={"LengthGlyph"} ref={intervalReference} />
            </td>
            <td>
                {cnvCall.nProbes ?? "Unknown"}
            </td>
            <td>
                <svg height={100} width={80} key={id + "vafGlyph"} className={"VafGlyph"} ref={vafReference} />
            </td>
            <td> 
                <svg height={100} width={60} key={id + "copyRatioGlyph"} className={"CopyRatioGlyph"}ref={ratioReference} />
            </td>
            <Tooltip  title={<>{genesAndPseudogenes.map(annotation => <span>{annotation.id.split("gene-")[1] + ", "}</span>)}</>}>
                <td>
                    <div className={"CoverageGlyphCanvas"} ref={coverageReferenceDiv}></div>

                </td>
            </Tooltip>
            <td >
                <div>
                    <Button className="favorite-button" onClick={handleClickFavorite}>{isFavorite ? <StarIcon></StarIcon> : <StarOutline></StarOutline>}</Button>
                    <Button className="remove-button" onClick={handleClick}><RemoveCircleIcon></RemoveCircleIcon></Button>
                </div>
            </td>
            
        </tr>
    );
};

export default CnvCallItem;
