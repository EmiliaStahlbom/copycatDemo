/**
 *  api.js
 *  ======
 *  Contains code for interacting with all server side methods.
 *
 *  Notably exposes:
 *
 *  - this.api :: mount point for server side methods.
 *
 */
import {
    ApiSegments,
    ApiBins,
    ApiPileup,
    ApiReference,
    ApiAnnotations,
    ApiCnvCalls,
    ApiSnvCalls,
    ApiCnvCoverage,
} from "../models/segment";

type Data = BufferSource | unknown | null;
import { caseSet } from "src/App";

//  const baseUrl = document.baseURI || document.querySelector("base")?.href;
const baseUrl = "http://localhost:5000/";
const apiUrlPrefix = baseUrl + "api/";

function prefix(url: string) {
    return url.indexOf(apiUrlPrefix) === 0 ? url : apiUrlPrefix + url;
}

function http(method: string, url: string, init?: RequestInit) {
    url = prefix(url);

    init = {
        ...init,
        method,
        //  mode: "same-origin",
        //  credentials: "same-origin",
        headers: {
            ...init?.headers,
        },
    };

    return fetch(url, init).then(ensureSuccess);
}

function prepare(body: Data, init?: RequestInit): RequestInit {
    if (!body && init) {
        return init;
    }

    if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
        return {
            ...init,
            headers: { ...init?.headers, "Content-Type": "application/octet-stream" },
            body,
        };
    }

    return {
        ...init,
        headers: { ...init?.headers, "Content-Type": "application/json" },
        body: JSON.stringify(body),
    };
}

function get(url: string, init?: RequestInit) {
    return http("GET", url, init);
}

function post(url: string, data?: Data, init?: RequestInit) {
    return http("POST", url, prepare(data, init));
}

function ensureSuccess(response: Response) {
    return response.ok ? response : Promise.reject(response);
}

function json(response: Response) {
    const contentType = response.headers.get("Content-Type");
    if (!contentType) return Promise.resolve();
    if (contentType.indexOf("application/json") === -1) return Promise.resolve();
    return response.json();
}

export function qs(param: Record<string, string | number | boolean>) {
    return Object.keys(param)
        .filter((k) => param[k] !== void 0 && param[k] !== null)
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(param[k])}`)
        .join("&");
}

export function aborted(param: unknown): param is DOMException | Error {
    return (
        (param instanceof DOMException && param.code === DOMException.ABORT_ERR) ||
    (param instanceof Error &&
      param.name === "AbortError" &&
      param.message === "Aborted")
    );
}

export const api = {
    // Returns registered external apps with associated web hooks.
    getSegments: () => get("segments").then<ApiSegments>(json),

    getBins: () => get("bins").then<ApiBins>(json),

    getPileup: (
        chr1: string,
        interval_start: string,
        interval_end: string,
        loadComparison?: string,
    ) => {
        let searchParams = new URLSearchParams({
            chr: chr1,
            start: interval_start,
            end: interval_end,
            "load-comparison": loadComparison ?? "false",
        });
        return get(`pileup?${searchParams}`).then<ApiPileup>(json);
    },
    getReference: (
        chr1: string,
        interval_start: string,
        interval_end: string,
    ) => {
        const searchParams = new URLSearchParams({
            chr: chr1,
            start: interval_start,
            end: interval_end,
        });
        return get(`reference?${searchParams}`).then<ApiReference>(json);
    },
    setInterval: (start: number, end: number) => post("interval", [start, end]),

    getAnnotations: (
        chr1: string,
        interval_start: string,
        interval_end: string,
    ) => {
        const searchParams = new URLSearchParams({
            chr: chr1,
            start: interval_start,
            end: interval_end,
        });
        return get(`annotations?${searchParams}`).then<ApiAnnotations>(json);
    },

    getCnvCalls: (index: string, caseSet: caseSet) => get(`CnvCalls?${new URLSearchParams({index: index, caseSet: caseSet})}`).then<ApiCnvCalls>(json),

    getCnvCoverages: (index: string, caseSet: caseSet) =>  get(`CnvCoverages?${new URLSearchParams({index: index, caseSet: caseSet})}`).then<ApiCnvCoverage>(json),

    getSnvs: () => get("SnvCalls").then<ApiSnvCalls>(json),

    postInteraction: (jsonRepresentation: string) => post(`userInteraction`, jsonRepresentation)
};
