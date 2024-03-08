import { useMemo, useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";

export function useQuery() {
    const { search } = useLocation();

    return useMemo(() => new URLSearchParams(search), [search]);
}

export function isDevMode() {
    return process.env.NODE_ENV === "development" ;
}

export function useMediaQuery(query: string): boolean {
    const getMatches = (matchQuery: string): boolean => {
        return window?.matchMedia(matchQuery).matches ?? false;
    };

    const [matches, setMatches] = useState<boolean>(getMatches(query));

    useEffect(() => {
        const matchMedia = window?.matchMedia(query);
        const onChange = () => setMatches(getMatches(query));

        // Triggered at the first client-side load and if query changes
        onChange(); 
        matchMedia?.addEventListener("change", onChange);

        return matchMedia != null ? () => matchMedia.removeEventListener("change", onChange) : undefined;
    }, [query]);

    return matches;
}

export function useRefState<S>(initialState: S | (() => S)): [React.RefObject<S>, (val: S)=>void] {
    const [state, setState] = useState<S>(initialState);
    const ref = useRef(state);
    const setter = (val: S) => {
        setState(ref.current = val);
    };
  
    return [ref, setter];
}