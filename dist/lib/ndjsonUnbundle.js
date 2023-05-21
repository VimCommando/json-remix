"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __asyncValues = (this && this.__asyncValues) || function (o) {
    if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
    var m = o[Symbol.asyncIterator], i;
    return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
    function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
    function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const readline = __importStar(require("node:readline"));
const ramda_1 = require("ramda");
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.label('unbundle');
/**
 * Retrieves the prefix from a JSON object based on the specified path.
 *
 * @param {any} json - The JSON object from which to retrieve the prefix.
 * @param {(number | string)[]} name - The path to the prefix as an array of
 * numbers or strings.
 * @returns {string | undefined} - The retrieved prefix or undefined if it
 * doesn't exist.
 */
const getPrefix = (json, name) => {
    if (!name)
        return undefined;
    /**
     * Converts valid strings in the `name` array into arrays of strings by
     * splitting them with periods.
     *
     * @param {(number | string)} x - The value to filter and convert.
     * @returns {string[][]} - The resulting array of string arrays.
     */
    const paths = name
        .filter((x) => typeof x === 'string')
        .map((s) => s.split('.'));
    return paths
        .map((path) => (0, ramda_1.path)(path, json))
        .filter((value) => !(0, ramda_1.isNil)(value))
        .filter((value) => typeof value === 'string')
        .join('.');
};
/**
 * Reads an NDJSON file and writes each object to a separate file.
 *
 * @async
 * @param {Object} options - The function options.
 * @param {string} options.dir - The output directory path.
 * @param {string} options.file - The input NDJSON file path.
 * @param {Array<string|number>} [options.name] - An array of property names or
 * indices to use as a filename prefix.
 * @param {boolean} [options.pretty=false] - Whether to format the output JSON
 * with indentation and line breaks.
 * @returns {Promise<void>}
 * @throws {SyntaxError} When the input file contains invalid JSON.
 * @throws {Error} When any other error occurs.
 */
const ndjsonUnbundle = ({ file, dir, pretty, name, }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const formatJson = pretty
        ? (o) => JSON.stringify(o, null, 4)
        : (o) => JSON.stringify(o);
    let lineNumber = 0; // top scope so we can use in error handling
    try {
        const input = file === '-' ? process.stdin : (0, fs_1.createReadStream)(file);
        const output = dir === '-' ? process.stdout : undefined;
        const rl = readline.createInterface({
            input,
            output,
            terminal: false,
            crlfDelay: Infinity, // ensures we only get one line break
        });
        if (!output) {
            log.debug(`Creating directory: ${dir}`);
            yield (0, promises_1.mkdir)(dir, { recursive: true });
        }
        log.verbose(`Unbundling ${file === '-' ? 'stdin' : file} to ${dir === '-' ? 'stdout' : dir + '/'}`);
        try {
            for (var _d = true, rl_1 = __asyncValues(rl), rl_1_1; rl_1_1 = yield rl_1.next(), _a = rl_1_1.done, !_a;) {
                _c = rl_1_1.value;
                _d = false;
                try {
                    const line = _c;
                    ++lineNumber; // to keep valid line numbers, always increment
                    if (!line || line === '')
                        return; // only output defined and non-empty lines
                    const json = JSON.parse(line);
                    const prefix = getPrefix(json, name);
                    const number = lineNumber.toString().padStart(6, '0');
                    const filename = prefix ? `${prefix}.json` : `object-${number}.json`;
                    if (output) {
                        console.log(JSON.stringify(json, null, 2));
                    }
                    else {
                        log.silly(`unbundle: ${JSON.stringify(json, null, 2)}`);
                        log.debug(`Writing ${pretty ? 'pretty' : 'one-line'} file ${filename}`);
                        const data = new Uint8Array(Buffer.from(formatJson(json)));
                        yield (0, promises_1.writeFile)(`${dir}/${filename}`, data);
                    }
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = rl_1.return)) yield _b.call(rl_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        ;
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.log(SyntaxError);
            log.warn(`Failed to parse: ${file}:${lineNumber}`);
        }
        else {
            log.error(`File not found: ${file}`);
            log.debug(err);
        }
    }
});
exports.default = ndjsonUnbundle;
