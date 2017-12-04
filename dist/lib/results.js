"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * A ResultError is thrown when a query generates errorful results from Kapacitor.
 */
class ResultError extends Error {
    constructor(message) {
        super();
        this.message = `Error from Kapacitor: ${message}`;
    }
}
exports.ResultError = ResultError;
/**
 * An ServiceNotAvailableError is returned as an error from requests that
 * result in a > 500 error code.
 */
class ServiceNotAvailableError extends Error {
    constructor(message) {
        super();
        this.message = message;
        Object.setPrototypeOf(this, ServiceNotAvailableError.prototype);
    }
}
exports.ServiceNotAvailableError = ServiceNotAvailableError;
/**
 * An RequestError is returned as an error from requests that
 * result in a 300 <= error code <= 500.
 */
class RequestError extends Error {
    constructor(req, res, body) {
        super();
        this.req = req;
        this.res = res;
        this.statusCode = res.statusCode;
        this.statusMessage = res.statusMessage;
        this.message = body;
        try {
            this.message = JSON.parse(body).error;
        }
        catch (e) { }
        Object.setPrototypeOf(this, RequestError.prototype);
    }
    static Create(req, res, callback) {
        let body = '';
        res.on('data', str => body = body + str.toString());
        res.on('end', () => callback(new RequestError(req, res, body)));
    }
}
exports.RequestError = RequestError;
/**
 * Checks if there are any errors in the IResponse and, if so, it throws them.
 * @private
 * @throws {ResultError}
 */
function assertNoErrors(res) {
    const { error } = res;
    if (error) {
        throw new ResultError(error);
    }
    return res;
}
exports.assertNoErrors = assertNoErrors;
