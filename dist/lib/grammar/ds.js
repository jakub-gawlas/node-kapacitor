"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * VarType is an enumeration of TICKscript var types.
 */
var VarType;
(function (VarType) {
    VarType["Bool"] = "bool";
    VarType["Int"] = "int";
    VarType["Float"] = "float";
    VarType["String"] = "string";
    VarType["Regex"] = "regex";
    VarType["Duration"] = "duration";
    VarType["Lambda"] = "lambda";
    VarType["List"] = "list";
    VarType["Star"] = "star";
})(VarType = exports.VarType || (exports.VarType = {}));
/**
 * TemplateFields is an enumeration of kapacitor template fields.
 */
var TemplateFields;
(function (TemplateFields) {
    /**
     * When creating resources in Kapacitor the API server will
     * return a `link` object with an `href` of the resource.
     * Clients should not need to perform path manipulation in
     * most cases and can use the `link` provided from previous calls.
     */
    TemplateFields["link"] = "link";
    /**
     * Unique identifier for the template. If empty a random ID will be chosen.
     */
    TemplateFields["id"] = "id";
    /**
     * The template type: `stream` or `batch`.
     */
    TemplateFields["type"] = "type";
    /**
     * The content of the script.
     */
    TemplateFields["script"] = "script";
    /**
     * [GraphViz](https://en.wikipedia.org/wiki/Graphviz) DOT
     * syntax formatted representation of the template DAG.</br>
     * NOTE: lables vs attributes does not matter since a
     * template is never executing.
     */
    TemplateFields["dot"] = "dot";
    /**
     * Any error encountered when reading the template.
     */
    TemplateFields["error"] = "error";
    /**
     * Date the template was first created
     */
    TemplateFields["created"] = "created";
    /**
     * Date the template was last modified
     */
    TemplateFields["modified"] = "modified";
    /**
     * A set of vars for overwriting any defined vars in the TICKscript.
     */
    TemplateFields["vars"] = "vars";
})(TemplateFields = exports.TemplateFields || (exports.TemplateFields = {}));
/**
 * TaskFields is an enumeration of kapacitor task fields.
 */
var TaskFields;
(function (TaskFields) {
    /**
     * When creating resources in Kapacitor the API server will
     * return a `link` object with an `href` of the resource.
     * Clients should not need to perform path manipulation in
     * most cases and can use the `link` provided from previous calls.
     */
    TaskFields["link"] = "link";
    /**
     * Unique identifier for the task. If empty a random ID will be chosen.
     */
    TaskFields["id"] = "id";
    /**
     * An optional ID of a template to use instead of specifying a TICKscript
     *  and type directly.
     */
    TaskFields["templateId"] = "template-id";
    /**
     * The task type: `stream` or `batch`.
     */
    TaskFields["type"] = "type";
    /**
     * List of database retention policy pairs the task is allowed to access.
     */
    TaskFields["dbrps"] = "dbrps";
    /**
     * The content of the script.
     */
    TaskFields["script"] = "script";
    /**
     * [GraphViz](https://en.wikipedia.org/wiki/Graphviz) DOT
     *  syntax formatted representation of the task DAG.
     */
    TaskFields["dot"] = "dot";
    /**
     * One of `enabled` or `disabled`.
     */
    TaskFields["status"] = "status";
    /**
     * Whether the task is currently executing.
     */
    TaskFields["executing"] = "executing";
    /**
     * Any error encountered when executing the task.
     */
    TaskFields["error"] = "error";
    /**
     * Map of statistics about a task.
     */
    TaskFields["stats"] = "stats";
    /**
     * Date the template was first created
     */
    TaskFields["created"] = "created";
    /**
     * Date the template was last modified
     */
    TaskFields["modified"] = "modified";
    /**
     * Date the task was last set to status `enabled`
     */
    TaskFields["lastEnabled"] = "last-enabled";
    /**
     * A set of vars for overwriting any defined vars in the TICKscript.
     */
    TaskFields["vars"] = "vars";
})(TaskFields = exports.TaskFields || (exports.TaskFields = {}));
