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
export declare const escape: {
    quoted: (val: string) => string;
};
export declare const dashToCamel: (obj: any) => any;
export declare const camelToDash: (obj: any, parse?: boolean) => any;
export declare const formatAttrName: (obj: any) => any;
