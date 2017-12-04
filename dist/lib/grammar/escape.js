"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * tagEscaper escapes tag keys, tag values, and field keys.
 * @type {Object}
 * @property {function(s: string): string } quoted Escapes and wraps quoted values.
 *
 * @example
 * ```typescript
 *
 * console.log(escape.quoted('stream\n    |from()\n        .measurement("tick")\n'));
 * // => 'stream\n    |from()\n        .measurement('tick')\n'
 * ```
 */
exports.escape = {
    /**
     * quoted escapes quoted values.
     */
    quoted: (val) => val.replace(/"/g, '\'')
};
exports.dashToCamel = (obj) => {
    const str = JSON.stringify(obj);
    return JSON.parse(str.toLowerCase().replace(/-(.)/g, (match, group) => group.toUpperCase()));
};
exports.camelToDash = (obj, parse = false) => {
    let str = '';
    switch (typeof obj) {
        case 'object':
            str = JSON.stringify(obj);
            break;
        case 'string':
            str = obj;
            break;
    }
    const res = str
        .replace(/(^[A-Z])/, (first) => first.toLowerCase())
        .replace(/([A-Z])/g, (letter) => `-${letter.toLowerCase()}`);
    return parse ? JSON.parse(res) : res;
};
exports.formatAttrName = (obj) => {
    const keys = Object.keys(obj);
    keys.forEach((key) => {
        if (/[A-Z]/.test(key)) {
            obj[exports.camelToDash(key)] = obj[key];
            delete obj[key];
        }
    });
    return obj;
};
