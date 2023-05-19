"use strict";
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
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.label('bundle');
/**
 * Bundles multiple JSON files in a directory into one NDJSON file.
 *
 * @async
 * @function bundleNdjson
 * @param {Object} options - The options object.
 * @param {string} options.file - The output filename.
 * @param {string} options.dir - The directory containing the input files.
 * @returns {Promise<void>} - A Promise that resolves when the operation completes.
 * @throws {SyntaxError} - If there is an error parsing the input files.
 * @throws {Error} - If there is any other error during the operation.
 */
const bundleNdjson = ({ file, dir }) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    let output = '';
    let i = 0;
    try {
        const directory = yield (0, promises_1.opendir)(dir);
        try {
            for (var _d = true, directory_1 = __asyncValues(directory), directory_1_1; directory_1_1 = yield directory_1.next(), _a = directory_1_1.done, !_a;) {
                _c = directory_1_1.value;
                _d = false;
                try {
                    const dirent = _c;
                    const buffer = yield (0, promises_1.readFile)(`${dir}/${dirent.name}`, 'binary');
                    log.debug(`Bundling '${dir}/${dirent.name}'`);
                    output += JSON.stringify(JSON.parse(buffer)) + '\n';
                    i++;
                }
                finally {
                    _d = true;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (!_d && !_a && (_b = directory_1.return)) yield _b.call(directory_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        const data = new Uint8Array(Buffer.from(output));
        yield (0, promises_1.writeFile)(file, data);
        log.verbose(`Wrote ${i} objects to ${file}`);
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.log(SyntaxError);
            log.warn(`Failed to parse: ${file}: ${SyntaxError}`);
        }
        else {
            log.error(`${err}: ${file}`);
        }
    }
});
exports.default = bundleNdjson;
