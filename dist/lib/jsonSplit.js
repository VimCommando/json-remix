"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ramda_1 = require("ramda");
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.label('split');
/**
 * Splits the given object into an array of key-value pairs (entries), optionally filtered by key.
 *
 * @param {object} object - The object to split.
 * @param {string} [expression] - The optional regular expression string to use for filtering the keys.
 * @returns {Entry[]} - The array of filtered key-value pairs (entries) from the given object.
 */
const jsonSplit = (object, expression) => {
    if (expression === undefined) {
        log.verbose(`No key filter given`);
        return Object.entries(object);
    }
    else {
        const regex = new RegExp(expression);
        log.verbose(`Key filter regex is: ${regex}`);
        const filteredKeys = Object.keys(object).filter((0, ramda_1.test)(regex));
        log.debug(`Filtered keys: ${filteredKeys}`);
        const selection = (0, ramda_1.pick)(filteredKeys, object);
        return Object.entries(selection);
    }
};
exports.default = jsonSplit;
