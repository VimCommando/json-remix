"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.label('merge');
/**
 * Merges an array of Entry objects into a single object,
 * filtered by an optional regular expression on the keys.
 *
 * @param {Entry[]} entries - The array of Entry objects to merge.
 * @param {string} [expression] - The regular expression string used to filter the keys.
 *
 * @returns {object} - A new object that is the merged version of the Entry values.
 *
 * @example
 * const merged = merge(entries);
 * const filtered = merge(entries, "^foo"); // Only include entries with keys starting with "foo"
 */
const merge = (entries, expression) => {
    if (expression === undefined) {
        log.verbose(`No key filter given`);
        return Object.fromEntries(entries);
    }
    else {
        const regex = new RegExp(expression);
        log.verbose(`Regex key filter: ${regex}`);
        const includeKey = ([key, value]) => regex.test(key);
        return Object.fromEntries(entries.filter(includeKey));
    }
};
exports.default = merge;
