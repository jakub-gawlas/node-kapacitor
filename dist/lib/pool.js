"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const exponential_1 = require("./backoff/exponential");
const host_1 = require("./host");
const results_1 = require("./results");
const http = require("http");
const https = require("https");
const querystring = require("querystring");
/**
 * Status codes that will cause a host to be marked as 'failed' if we get
 * them from a request to Kapacitor.
 * @type {Array}
 */
const resubmitErrorCodes = [
    'ETIMEDOUT',
    'ESOCKETTIMEDOUT',
    'ECONNRESET',
    'ECONNREFUSED',
    'EHOSTUNREACH',
];
/**
 * Creates a function generation that returns a wrapper which only allows
 * through the first call of any function that it generated.
 */
function doOnce() {
    let handled = false;
    return fn => {
        return arg => {
            if (handled) {
                return;
            }
            handled = true;
            fn(arg);
        };
    };
}
function setToArray(itemSet) {
    const output = [];
    itemSet.forEach(value => {
        output.push(value);
    });
    return output;
}
const request = (options, callback) => {
    if (options.protocol === 'https:') {
        return https.request(options, callback);
    }
    else {
        return http.request(options, callback);
    }
};
/**
 *
 * The Pool maintains a list available Kapacitor hosts and dispatches requests
 * to them. If there are errors connecting to hosts, it will disable that
 * host for a period of time.
 */
class Pool {
    /**
     * Creates a new Pool instance.
     * @param {IPoolOptions} options
     */
    constructor(options) {
        this.options = Object.assign({
            backoff: new exponential_1.ExponentialBackoff({
                initial: 300,
                max: 10 * 1000,
                random: 1,
            }),
            maxRetries: 2,
            requestTimeout: 30 * 1000,
        }, options);
        this.index = 0;
        this.hostsAvailable = new Set();
        this.hostsDisabled = new Set();
        this.timeout = this.options.requestTimeout;
    }
    /**
     * Returns a list of currently active hosts.
     * @return {Host[]}
     */
    getHostsAvailable() {
        return setToArray(this.hostsAvailable);
    }
    /**
     * Returns a list of hosts that are currently disabled due to network
     * errors.
     * @return {Host[]}
     */
    getHostsDisabled() {
        return setToArray(this.hostsDisabled);
    }
    /**
     * Inserts a new host to the pool.
     */
    addHost(url, options = {}) {
        const host = new host_1.Host(url, this.options.backoff.reset(), options);
        this.hostsAvailable.add(host);
        return host;
    }
    /**
     * Returns true if there's any host available to by queried.
     * @return {Boolean}
     */
    hostIsAvailable() {
        return this.hostsAvailable.size > 0;
    }
    /**
     * Makes a request and calls back with the response, parsed as JSON.
     * An error is returned on a non-2xx status code or on a parsing exception.
     */
    json(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.text(options);
            if (res) {
                return JSON.parse(res);
            }
            return res;
        });
    }
    /**
     * Makes a request and resolves with the plain text response,
     * if possible. An error is raised on a non-2xx status code.
     */
    text(options) {
        return new Promise((resolve, reject) => {
            this.stream(options, (err, res) => {
                if (err) {
                    return reject(err);
                }
                let output = '';
                if (res) {
                    res.on('data', str => output = output + str.toString());
                    res.on('end', () => resolve(output));
                }
            });
        });
    }
    /**
     * Makes a request and discards any response body it receives.
     * An error is returned on a non-2xx status code.
     */
    discard(options) {
        return new Promise((resolve, reject) => {
            this.stream(options, (err, res) => {
                if (err) {
                    return reject(err);
                }
                if (res) {
                    res.on('data', () => { });
                    res.on('end', () => resolve());
                }
            });
        });
    }
    /**
     * Ping sends out a request to all available Kapacitor servers, reporting on
     * their response time and version number.
     */
    ping(timeout, path = '/kapacitor/v1/ping') {
        const todo = [];
        setToArray(this.hostsAvailable)
            .concat(setToArray(this.hostsDisabled))
            .forEach(host => {
            const start = Date.now();
            const url = host.url;
            const once = doOnce();
            return todo.push(new Promise(resolve => {
                const req = request(Object.assign({
                    hostname: url.hostname,
                    method: 'GET',
                    path,
                    port: Number(url.port),
                    protocol: url.protocol,
                    timeout,
                }, host.options), once((res) => {
                    resolve({
                        url,
                        res,
                        online: Number(res.statusCode) < 300,
                        rtt: Date.now() - start,
                        version: String(res.headers['x-kapacitor-version']),
                    });
                }));
                const fail = once(() => {
                    resolve({
                        online: false,
                        res: null,
                        rtt: Infinity,
                        url,
                        version: null,
                    });
                });
                req.on('timeout', fail);
                req.on('error', fail);
                req.end();
            }));
        });
        return Promise.all(todo);
    }
    /**
     * Makes a request and calls back with the IncomingMessage stream,
     * if possible. An error is returned on a non-2xx status code.
     */
    stream(options, callback) {
        if (!this.hostIsAvailable()) {
            return callback(new results_1.ServiceNotAvailableError('No host available'), null);
        }
        let path = options.path;
        if (options.query) {
            path += '?' + querystring.stringify(options.query);
        }
        const once = doOnce();
        const host = this.getHost();
        const req = request(Object.assign({
            headers: { 'content-length': options.body ? new Buffer(options.body).length : 0 },
            hostname: host.url.hostname,
            method: options.method,
            path,
            port: Number(host.url.port),
            protocol: host.url.protocol,
            timeout: this.timeout,
        }, host.options), once((res) => {
            if (Number(res.statusCode) >= 500) {
                return this.handleRequestError(new results_1.ServiceNotAvailableError(res.statusMessage || ''), host, options, callback);
            }
            if (Number(res.statusCode) >= 300) {
                return results_1.RequestError.Create(req, res, err => callback(err, res));
            }
            host.success();
            return callback(undefined, res);
        }));
        // Handle network or HTTP parsing errors:
        req.on('error', once((err) => {
            this.handleRequestError(err, host, options, callback);
        }));
        // Handle timeouts:
        req.on('timeout', once(() => {
            this.handleRequestError(new results_1.ServiceNotAvailableError('Request timed out'), host, options, callback);
        }));
        // Support older Nodes and polyfills which don't allow .timeout() in the
        // request options, wrapped in a conditional for even worse polyfills. See:
        if (typeof req.setTimeout === 'function') {
            req.setTimeout(this.timeout); // tslint:disable-line
        }
        // Write out the body:
        if (options.body) {
            req.write(options.body);
        }
        req.end();
    }
    /**
     * Returns the next available host for querying.
     * @return {Host}
     */
    getHost() {
        const available = setToArray(this.hostsAvailable);
        const host = available[this.index];
        this.index = (this.index + 1) % available.length;
        return host;
    }
    /**
     * Re-enables the provided host, returning it to the pool to query.
     * @param  {Host} host
     */
    enableHost(host) {
        this.hostsDisabled.delete(host);
        this.hostsAvailable.add(host);
    }
    /**
     * Disables the provided host, removing it from the query pool. It will be
     * re-enabled after a backoff interval
     */
    disableHost(host) {
        this.hostsAvailable.delete(host);
        this.hostsDisabled.add(host);
        this.index %= Math.max(1, this.hostsAvailable.size);
        setTimeout(() => this.enableHost(host), host.fail());
    }
    handleRequestError(err, host, options, callback) {
        if (!(err instanceof results_1.ServiceNotAvailableError) &&
            resubmitErrorCodes.indexOf(err.code) === -1) {
            return callback(err, null);
        }
        this.disableHost(host);
        const retries = options.retries || 0;
        if (retries < Number(this.options.maxRetries) && this.hostIsAvailable()) {
            options.retries = retries + 1;
            return this.stream(options, callback);
        }
        callback(err, null);
    }
}
exports.Pool = Pool;
