/// <reference types="node" />
import * as http from 'http';
/**
 * A ResultError is thrown when a query generates errorful results from Kapacitor.
 */
export declare class ResultError extends Error {
    constructor(message: string);
}
/**
 * An ServiceNotAvailableError is returned as an error from requests that
 * result in a > 500 error code.
 */
export declare class ServiceNotAvailableError extends Error {
    constructor(message: string);
}
/**
 * An RequestError is returned as an error from requests that
 * result in a 300 <= error code <= 500.
 */
export declare class RequestError extends Error {
    req: http.ClientRequest;
    res: http.IncomingMessage;
    statusCode: number;
    statusMessage: string;
    static Create(req: http.ClientRequest, res: http.IncomingMessage, callback: (e: RequestError) => void): void;
    constructor(req: http.ClientRequest, res: http.IncomingMessage, body: string);
}
/**
 * KapacitorResults describes the result structure received from Kapacitor.
 */
export interface IResponse {
    error?: string;
}
/**
 * Checks if there are any errors in the IResponse and, if so, it throws them.
 * @private
 * @throws {ResultError}
 */
export declare function assertNoErrors(res: IResponse): IResponse;
