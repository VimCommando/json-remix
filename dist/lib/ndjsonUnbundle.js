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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const ramda_1 = require("ramda");
const logger_1 = __importDefault(require("./logger"));
const log = logger_1.default.label('unbundle');
/**
 * Reads an NDJSON file and writes each object to a separate file.
 *
 * @async
 * @param {Object} options - The function options.
 * @param {string} options.dir - The output directory path.
 * @param {string} options.file - The input NDJSON file path.
 * @param {Array<string|number>} [options.name] - An array of property names or indices to use as a filename prefix.
 * @param {boolean} [options.pretty=false] - Whether to format the output JSON with indentation and line breaks.
 * @returns {Promise<void>}
 * @throws {SyntaxError} When the input file contains invalid JSON.
 * @throws {Error} When any other error occurs.
 */
const ndjsonUnbundle = ({ file, dir, pretty, name, }) => __awaiter(void 0, void 0, void 0, function* () {
    const formatJson = pretty
        ? (o) => JSON.stringify(o, null, 4)
        : (o) => JSON.stringify(o);
    try {
        const buffer = yield (0, promises_1.readFile)(file, 'binary');
        yield (0, promises_1.mkdir)(dir, { recursive: true });
        log.verbose(`Unbundling ${file} to ${dir}`);
        buffer.split('\n').forEach((line, index) => __awaiter(void 0, void 0, void 0, function* () {
            if (!line || line === '')
                return; // only create defined and non-empty lines
            const json = JSON.parse(line);
            // Splits provided names on `.` to create a path to pick the value from
            // then joins picked values with `.` to create a filename
            const prefix = name === null || name === void 0 ? void 0 : name.map((name) => (0, ramda_1.path)(name.split('.'), json)).filter((x) => !(0, ramda_1.isNil)(x)).join('.');
            const number = (++index).toString().padStart(6, '0');
            const filename = prefix ? `${prefix}.json` : `object-${number}.json`;
            log.silly(`unbundle: ${JSON.stringify(json, null, 2)}`);
            log.debug(`Writing ${pretty ? 'pretty' : 'one-line'} file ${filename}`);
            const data = new Uint8Array(Buffer.from(formatJson(json)));
            yield (0, promises_1.writeFile)(`${dir}/${filename}`, data);
        }));
    }
    catch (err) {
        if (err instanceof SyntaxError) {
            console.log(SyntaxError);
            log.warn(`Failed to parse: ${file}: ${SyntaxError}`);
        }
        else {
            log.error(`File not found: ${file}`);
            log.debug(err);
        }
    }
});
exports.default = ndjsonUnbundle;
