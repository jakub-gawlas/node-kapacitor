/// <reference types="node" />
import { RequestOptions } from "https";
import { ITask, ITasks, IUpdateTask, ITaskOptions, IListTasksOptions } from "./grammar";
import { ITemplate, ITemplates, ITemplateOptions, IListTemplatesOptions } from "./grammar";
import { IConfigSections, IConfigSection, IConfigElement } from "./grammar";
import { IPingStats, IPoolOptions } from "./pool";
export * from "./grammar";
export { IPingStats, IPoolOptions } from "./pool";
export { IResponse, ResultError } from "./results";
export interface ConfigUpdateAction {
    /**
     * Set the value in the configuration overrides.
     */
    set?: {
        [Attr: string]: any;
    };
    /**
     * Delete the value from the configuration overrides.
     */
    delete?: string[];
    /**
     * Add a new element to a list configuration section.
     */
    add?: {
        [Attr: string]: any;
    };
    /**
     * Remove a previously added element from a list configuration section.
     */
    remove?: string[];
}
export interface IHostConfig {
    /**
     * Kapacitor host to connect to, defaults to 127.0.0.1.
     */
    host: string;
    /**
     * Kapacitor port to connect to, defaults to 9092.
     */
    port?: number;
    /**
     * Protocol to connect over, defaults to 'http'.
     */
    protocol?: "http" | "https";
    /**
     * Optional request option overrides.
     */
    options?: RequestOptions;
}
export interface ISingleHostConfig extends IHostConfig {
    /**
     * Settings for the connection pool.
     */
    pool?: IPoolOptions;
}
export interface IClusterConfig {
    /**
     * A list of cluster hosts to connect to.
     */
    hosts: IHostConfig[];
    /**
     * Settings for the connection pool.
     */
    pool?: IPoolOptions;
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
export declare class Kapacitor {
    /**
     * Connect pool for making requests.
     * @private
     */
    private pool;
    /**
     * Config options for Kapacitor.
     * @private
     */
    private options;
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
    constructor(options?: string | ISingleHostConfig | IClusterConfig);
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
    ping(timeout: number): Promise<IPingStats[]>;
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
    createTask(task: ITask): Promise<ITask>;
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
    createTemplate(template: ITemplate): Promise<ITemplate>;
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
    updateTask(task: IUpdateTask): Promise<ITask>;
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
    updateTemplate(template: ITemplate): Promise<ITemplate>;
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
    removeTask(taskId: string): Promise<void>;
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
    removeTemplate(templateId: string): Promise<void>;
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
    getTask(taskId: string, query?: ITaskOptions): Promise<ITask>;
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
    getTemplate(templateId: string, query?: ITemplateOptions): Promise<ITemplate>;
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
    getTasks(query?: IListTasksOptions): Promise<ITasks>;
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
    getTemplates(query?: IListTemplatesOptions): Promise<ITemplates>;
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
    updateConfig(action: ConfigUpdateAction, section: string, element?: string): Promise<void>;
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
    getConfig(section?: string, element?: string): Promise<IConfigSections | IConfigSection | IConfigElement>;
    /**
     * Creates options to be passed into the pool to request kapacitor.
     * @private
     */
    private getRequestOpts(opt);
}
