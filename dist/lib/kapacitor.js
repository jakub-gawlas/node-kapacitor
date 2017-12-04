"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
const url = require("url");
const grammar_1 = require("./grammar");
const pool_1 = require("./pool");
const results_1 = require("./results");
const defaultHost = Object.freeze({
    host: "127.0.0.1",
    port: 9092,
    protocol: "http"
});
__export(require("./grammar"));
var results_2 = require("./results");
exports.ResultError = results_2.ResultError;
/**
 * Parses the URL out into into a IClusterConfig object
 */
function parseOptionsUrl(addr) {
    const parsed = url.parse(addr);
    const options = {
        host: String(parsed.hostname),
        port: Number(parsed.port),
        protocol: String(parsed.protocol).slice(0, -1)
    };
    return options;
}
/**
 * Works similarly to Object.assign, but only overwrites
 * properties that resolve to undefined.
 */
function defaults(target, ...srcs) {
    srcs.forEach(src => {
        Object.keys(src).forEach(key => {
            if (target[key] === undefined) {
                target[key] = src[key];
            }
        });
    });
    return target;
}
/**
 * Kapacitor is an open source framework for processing, monitoring,
 *  and alerting on time series data.</br>
 * This is a 'driver-level' module, not a a full-fleged ORM or ODM.</br>
 * you run queries directly by calling methods on this class.
 * @example
 * ```typescript
 *
 * import { Kapacitor } from 'kapacitor';
 * const kapacitor = new Kapacitor({
 *  host: 'localhost'
 * })
 *
 * kapacitor.getTasks().then(res => {
 *  console.log(JSON.stringify(res, null, 2));
 * })
 * ```
 */
class Kapacitor {
    /**
     * Connect to a single Kapacitor instance by specifying
     * a set of connection options.
     * @param {string | ISingleHostConfig | IClusterConfig} [options='http://root:root@127.0.0.1:9092']
     *
     * @example
     * ```typescript
     *
     * import { Kapacitor } from 'kapacitor';
     *
     * // Connects to a local, default kapacitor instance.
     * new Kapacitor()
     * ```
     *
     * @example
     * ```typescript
     *
     * import { Kapacitor } from 'kapacitor';
     *
     * // Connect to a single host with a DSN:
     * new Kapacitor('http://user:password@host:9092/')
     * ```
     *
     * @example
     * ```typescript
     *
     * import { Kapacitor } from 'kapacitor';
     *
     * // Connect to a single host with a full set of config details
     * const client = new Kapacitor({
     *   host: 'localhost',
     *   port: 9092
     * })
     * ```
     *
     * @example
     * ```typescript
     *
     * import { Kapacitor } from 'kapacitor';
     *
     * // Use a pool of several host connections and balance queries across them:
     * const client = new Kapacitor({
     *   hosts: [
     *     { host: 'kapa1.example.com' },
     *     { host: 'kapa2.example.com' },
     *   ]
     * })
     * ```
     */
    constructor(options) {
        // Figure out how to parse whatever we were passed in into a IClusterConfig.
        if (typeof options === "string") {
            // plain URI => ISingleHostConfig
            options = parseOptionsUrl(options);
        }
        else if (!options) {
            options = defaultHost;
        }
        if (!options.hasOwnProperty("hosts")) {
            // ISingleHostConfig => IClusterConfig
            options = {
                hosts: [options],
                pool: options.pool
            };
        }
        const resolved = options;
        resolved.hosts = resolved.hosts.map(host => {
            return defaults({
                host: host.host,
                port: host.port,
                protocol: host.protocol,
                options: host.options
            }, defaultHost);
        });
        this.pool = new pool_1.Pool(resolved.pool);
        this.options = defaults(resolved, { hosts: [] });
        resolved.hosts.forEach(host => {
            this.pool.addHost(`${host.protocol}://${host.host}:${host.port}`, host.options);
        });
    }
    /**
     * Pings all available hosts, collecting online status and version info.
     * @param  {Number} timeout Given in milliseconds
     * @return {Promise<IPingStats[]>}
     * @example
     * ```typescript
     *
     * kapacitor.ping(5000).then(hosts => {
     *   hosts.forEach(host => {
     *     if (host.online) {
     *       console.log(`${host.url.host} responded in ${host.rtt}ms running ${host.version})`)
     *     } else {
     *       console.log(`${host.url.host} is offline :(`)
     *     }
     *   })
     * })
     * ```
     */
    ping(timeout) {
        return this.pool.ping(timeout);
    }
    /**
     * Creates a new task.
     * @param {ITask} task
     * @return {Promise.<ITask>}
     * @example
     * ```typescript
     *
     * kapacitor.createTask({
     *   id: 'test_kapa',
     *   type: 'stream',
     *   dbrps: [{ db: 'test', rp: 'autogen' }],
     *   script: 'stream\n    |from()\n        .measurement("tick")\n',
     *   vars: {
     *     var1: {
     *       value: 42,
     *       type: VarType.Float
     *     }
     *   }
     * });
     * ```
     */
    createTask(task) {
        return this.pool
            .json(this.getRequestOpts({
            method: "POST",
            path: "tasks",
            body: JSON.stringify(grammar_1.formatAttrName(task))
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Creates a new template.
     * @param {ITemplate} template
     * @return {Promise.<ITemplate>}
     * @throws no template exists
     * @example
     * ```typescript
     *
     * kapacitor.createTemplate({
     *   id: 'test_template',
     *   type: 'stream',
     *   script: `
     *     // Which measurement to consume
     *     var measurement string
     *     // Optional where filter
     *     var where_filter = lambda: TRUE
     *     // Optional list of group by dimensions
     *     var groups = [*]
     *     // Which field to process
     *     var field string
     *     // Warning criteria, has access to 'mean' field
     *     var warn lambda
     *     // Critical criteria, has access to 'mean' field
     *     var crit lambda
     *     // How much data to window
     *     var window = 5m
     *     // The slack channel for alerts
     *     var slack_channel = '#alerts'
     *
     *     stream
     *         |from()
     *             .measurement(measurement)
     *             .where(where_filter)
     *             .groupBy(groups)
     *         |window()
     *             .period(window)
     *             .every(window)
     *         |mean(field)
     *         |alert()
     *             .warn(warn)
     *             .crit(crit)
     *             .slack()
     *             .channel(slack_channel)
     *   `,
     *   vars: {
     *     var1: {
     *       value: 42,
     *       type: VarType.Float
     *     }
     *   }
     * });
     * ```
     */
    createTemplate(template) {
        if (template.script) {
            template.script = grammar_1.escape.quoted(template.script);
        }
        return this.pool
            .json(this.getRequestOpts({
            method: "POST",
            path: "templates",
            body: JSON.stringify(grammar_1.formatAttrName(template))
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Update a task with the provided task id.
     * @param {IUpdateTask} task
     * @return {Promise.<ITask>}
     * @example
     * ```typescript
     *
     * kapacitor.updateTask({
     *   id: 'test_kapa',
     *   status: 'enabled'
     * });
     * ```
     */
    updateTask(task) {
        const taskId = task.id;
        delete task.id;
        return this.pool
            .json(this.getRequestOpts({
            method: "PATCH",
            path: "tasks/" + taskId,
            body: JSON.stringify(grammar_1.formatAttrName(task))
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Update a template with the provided template id.
     * @param {ITemplate} template
     * @return {Promise.<ITemplate>}
     * @example
     * ```typescript
     *
     * kapacitor.updateTemplate({
     *   id: 'test_template',
     *   vars: {
     *     var1: {
     *       value: 42,
     *       type: VarType.Float
     *     }
     *   }
     * });
     * ```
     */
    updateTemplate(template) {
        if (template.script) {
            template.script = grammar_1.escape.quoted(template.script);
        }
        const templateId = template.id;
        delete template.id;
        return this.pool
            .json(this.getRequestOpts({
            method: "PATCH",
            path: "templates/" + templateId,
            body: JSON.stringify(grammar_1.formatAttrName(template))
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * remove a task with the provided task id.
     * @param {string} taskId
     * @return {Promise.<void>}
     * @example
     * ```typescript
     *
     * kapacitor.removeTask('test_kapa');
     * ```
     */
    removeTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.pool.json(this.getRequestOpts({
                method: "DELETE",
                path: "tasks/" + taskId
            }));
            results_1.assertNoErrors(res);
        });
    }
    /**
     * remove a template with the provided template id.
     * @param {string} templateId
     * @return {Promise.<void>}
     * @example
     * ```typescript
     *
     * kapacitor.removeTemplate('test_template');
     * ```
     */
    removeTemplate(templateId) {
        return __awaiter(this, void 0, void 0, function* () {
            const res = yield this.pool.json(this.getRequestOpts({
                method: "DELETE",
                path: "templates/" + templateId
            }));
            results_1.assertNoErrors(res);
        });
    }
    /**
     * Return a task.
     * returns the results in a friendly format, {@link ITask}.
     * @param {String} taskId the task id.
     * @param {ITaskOptions} [query]
     * @return {Promise<ITask>} result
     * @throws {@link RequestError}
     *
     * statusCode  | statusMessage  | message
     * ------------- | ------------- | -------------
     * 404  | Not Found  | no task exists
     * @example
     * ```typescript
     *
     * kapacitor.getTask(taskId, {dotView: 'labels'}).then(results => {
     *   console.log(results)
     * })
     * ```
     */
    getTask(taskId, query) {
        if (query) {
            query.dotView = query.dotView ? query.dotView : "attributes";
            query.scriptFormat = query.scriptFormat
                ? query.scriptFormat
                : "formatted";
        }
        return this.pool
            .json(this.getRequestOpts({
            path: "tasks/" + taskId,
            query: query ? grammar_1.camelToDash(query, true) : undefined
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Return a template.
     * returns the results in a friendly format, {@link ITemplate}.
     * @param {String} templateId the template id.
     * @param {ITemplateOptions} [query]
     * @return {Promise<ITemplate]>} result(s)
     * @throws {@link RequestError}
     *
     * statusCode  | statusMessage  | message
     * ------------- | ------------- | -------------
     * 404  | Not Found  | no template exists
     * @example
     * ```typescript
     *
     * kapacitor.getTemplate(tmplId, {scriptFormat: 'raw'}).then(results => {
     *   console.log(results)
     * })
     * ```
     */
    getTemplate(templateId, query) {
        if (query) {
            query.scriptFormat = query.scriptFormat
                ? query.scriptFormat
                : "formatted";
        }
        return this.pool
            .json(this.getRequestOpts({
            path: "templates/" + templateId,
            query: query ? grammar_1.camelToDash(query) : undefined
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Return a array of tasks.
     * returns the results in a friendly format, {@link ITasks}.
     * @param {IListTasksOptions} [query]
     * @return {Promise<ITasks>} result(s)
     * @example
     * ```typescript
     *
     * kapacitor.getTasks({dotView: 'labels'}).then(results => {
     *   console.log(results)
     * })
     * ```
     */
    getTasks(query) {
        if (query) {
            query.dotView = query.dotView ? query.dotView : "attributes";
            query.scriptFormat = query.scriptFormat
                ? query.scriptFormat
                : "formatted";
            query.offset = query.offset ? query.offset : 0;
            query.limit = query.limit ? query.limit : 100;
        }
        return this.pool
            .json(this.getRequestOpts({
            path: "tasks",
            query: query ? grammar_1.camelToDash(query) : undefined
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Return a array of template.
     * returns the results in a friendly format, {@link ITemplates}.
     * @param {IListTemplatesOptions} [query]
     * @return {Promise<ITemplates>} result(s)
     * @example
     * ```typescript
     *
     * kapacitor.getTemplates({dotView: 'labels'}).then(results => {
     *   console.log(results)
     * })
     * ```
     */
    getTemplates(query) {
        if (query) {
            query.scriptFormat = query.scriptFormat
                ? query.scriptFormat
                : "formatted";
            query.offset = query.offset ? query.offset : 0;
            query.limit = query.limit ? query.limit : 100;
        }
        return this.pool
            .json(this.getRequestOpts({
            path: "templates",
            query: query ? grammar_1.camelToDash(query) : undefined
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Update config.
     * @param {ConfigUpdateAction} action
     * @param {string} section
     * @param {string} [element]
     * @return {Promise.<void>}
     * @example
     * ```typescript
     *
     * kapacitor.updateConfig({
     *  set: {
     *    'disable-subscriptions' : !disableSubscriptions
     *  }
     * }, 'influxdb', 'default');
     * ```
     */
    updateConfig(action, section, element) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.pool
                .json(this.getRequestOpts({
                method: "POST",
                path: "config/" + section + (element ? "/" + element : ""),
                body: JSON.stringify(action)
            }))
                .then(results_1.assertNoErrors);
        });
    }
    /**
     * Get config.
     * @param {string} [section]
     * @param {string} [element]
     * @return {Promise<IConfigSections|IConfigSection|IConfigElement>} result
     * @example
     * ```typescript
     *
     * kapacitor.getConfig('influxdb', 'default').then(results => {
     *   console.log(results)
     * })
     * ```
     */
    getConfig(section, element) {
        const path = "config" +
            (section ? "/" + section : "") +
            (element ? "/" + element : "");
        return this.pool
            .json(this.getRequestOpts({
            path
        }))
            .then(results_1.assertNoErrors);
    }
    /**
     * Creates options to be passed into the pool to request kapacitor.
     * @private
     */
    getRequestOpts(opt) {
        return Object.assign({
            method: "GET"
        }, opt, {
            path: url.resolve("/kapacitor/v1/", opt.path)
        });
    }
}
exports.Kapacitor = Kapacitor;
