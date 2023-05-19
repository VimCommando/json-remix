#!/usr/bin/env node
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
const jsonMerge_1 = __importDefault(require("../lib/jsonMerge"));
const jsonSplit_1 = __importDefault(require("../lib/jsonSplit"));
const ndjsonUnbundle_1 = __importDefault(require("../lib/ndjsonUnbundle"));
const ndjsonBundle_1 = __importDefault(require("../lib/ndjsonBundle"));
const promises_1 = require("fs/promises");
const yargs_1 = __importDefault(require("yargs"));
const logger_1 = __importDefault(require("../lib/logger"));
const log = logger_1.default.label('cli');
// adjust logger level if command-line arguments were given
const setLoggingLevel = (argv) => {
    const { debug, verbose } = argv;
    log.level = debug ? 'debug' : verbose ? 'verbose' : 'info';
};
/**
 * Reads a JSON object from a file.
 * @param file - The path to the file to read the object from.
 * @returns A promise that resolves with the JSON object, or rejects with an
 * error if there was a problem reading or parsing the file.
 * @throws If there is an error reading or parsing the file.
 */
const readObjectFromFile = (file) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const buffer = yield (0, promises_1.readFile)(file, 'binary');
        return JSON.parse(buffer.toString());
    }
    catch (err) {
        // Expand on failures, can fail separately on read or parse
        log.error(`${err}: ${file}`);
    }
});
/**
 * Writes a JavaScript object to a file in JSON format.
 * @param object - The JavaScript object to write to the file.
 * @param options - Object containing the file path and an optional pretty flag.
 * @param options.file - The path of the file to write the object to.
 * @param options.pretty - Optional. If true, the JSON data will be formatted
 * with 4-space indentation for readability.
 * @throws If there is an error writing the file.
 */
const writeObjectToFile = (object, { file, pretty, }) => __awaiter(void 0, void 0, void 0, function* () {
    const formatJson = pretty
        ? (o) => JSON.stringify(o, null, 2)
        : (o) => JSON.stringify(o);
    try {
        const data = new Uint8Array(Buffer.from(formatJson(object)));
        log.debug(`Writing ${pretty ? 'pretty' : 'one-line'} file ${file}`);
        yield (0, promises_1.writeFile)(file, data);
    }
    catch (err) {
        log.error(`${err}: ${file}`);
    }
});
/**
 * Writes an array of key-value pairs to JSON files in a directory.
 * @param entries - An array of key-value pairs to write to files.
 * @param options - Object containing the target directory path and optional pretty flag.
 * @param options.dir - The path of the directory to write the files to.
 * @param options.pretty - Optional. If true, the JSON data will be formatted
 * with 4-space indentation for readability.
 * @throws If there is an error creating the directory or writing any of the files.
 */
const writeEntriesToFiles = (entries, { dir, pretty, }) => __awaiter(void 0, void 0, void 0, function* () {
    // Don't create the directory if it is the present working directory
    try {
        if (dir !== '.') {
            log.verbose(`Creating directory ${dir}`);
            yield (0, promises_1.mkdir)(dir, { recursive: true });
        }
        entries.map(([key, object]) => __awaiter(void 0, void 0, void 0, function* () {
            yield writeObjectToFile(object, { file: `${dir}/${key}.json`, pretty });
        }));
    }
    catch (err) {
        log.error(`${err}: ${dir}`);
    }
});
/**
 * Reads all JSON files in a directory and returns them as an array of entries.
 * @param dir - The path to the directory to read the JSON files from.
 * @param extension - The file extension of the JSON files to read (default:
 * undefined, read all files).
 * @param sort - Boolean to determine if returned entries are sorted by key.
 * @returns A promise that resolves with an array of entries, or rejects with an
 * error if there was a problem reading the directory or JSON files.
 * @throws If there is an error reading the directory or JSON files.
 */
const readEntriesFromDirectory = (dir, extension, sort) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, e_1, _b, _c;
    const entries = [];
    log.verbose(`Trimming extension: ${extension}`);
    // Helper function to trim file extensions
    const trimExtension = (s) => extension == undefined ? s : s.substring(0, s.lastIndexOf(extension));
    try {
        const directory = yield (0, promises_1.opendir)(dir);
        try {
            for (var _d = true, directory_1 = __asyncValues(directory), directory_1_1; directory_1_1 = yield directory_1.next(), _a = directory_1_1.done, !_a;) {
                _c = directory_1_1.value;
                _d = false;
                try {
                    const dirent = _c;
                    const object = yield readObjectFromFile(`${dir}/${dirent.name}`);
                    const name = trimExtension(dirent.name);
                    log.debug(`Appending entry ${name} from '${dir}/${dirent.name}'`);
                    entries.push([name, object]);
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
    }
    catch (err) {
        log.error(`${err}: ${dir}`);
    }
    return sort ? entries.sort() : entries;
});
// Configure command-line arguments
const argv = yargs_1.default
    .command('split', 'Splits single-object .json file object into multiple ${key}.json files. ', {
    dir: {
        alias: 'd',
        default: '.',
        description: 'Target output directory',
        type: 'string',
    },
    file: {
        alias: 'f',
        demandOption: true,
        description: 'Input filename',
        type: 'string',
    },
    filter: {
        alias: 'r',
        description: 'Only split keys matching regex filter',
        type: 'string',
    },
    pretty: {
        alias: 'y',
        default: true,
        description: 'Pretty-print output files',
        type: 'boolean',
    },
}, (argv) => __awaiter(void 0, void 0, void 0, function* () {
    setLoggingLevel(argv);
    log.verbose(`Splitting file '${argv.file}' into '${argv.dir}/\${key}.json'`);
    const object = yield readObjectFromFile(argv.file);
    yield writeEntriesToFiles((0, jsonSplit_1.default)(object, argv.filter), argv);
}))
    .command('merge', 'Merges multiple single-object ${key}.json files into one object.json file. ', {
    dir: {
        alias: 'd',
        demandOption: true,
        description: 'Target input directory',
        type: 'string',
    },
    file: {
        alias: 'f',
        default: 'object.json',
        description: 'Output filename',
        type: 'string',
    },
    filter: {
        alias: 'r',
        description: 'Only split keys matching regex filter',
        type: 'string',
    },
    pretty: {
        alias: 'y',
        default: true,
        description: 'Pretty-print output files',
        type: 'boolean',
    },
    sort: {
        alias: 's',
        default: false,
        description: 'Alphabetically sort object keys',
        type: 'boolean',
    },
    trim: {
        alias: 't',
        description: 'File extension to trim from object key names',
        type: 'string',
    },
}, (argv) => __awaiter(void 0, void 0, void 0, function* () {
    setLoggingLevel(argv);
    log.verbose(`Merging files '${argv.dir}/*.json' into file '${argv.file}'`);
    const entries = yield readEntriesFromDirectory(argv.dir, argv.trim, argv.sort);
    yield writeObjectToFile((0, jsonMerge_1.default)(entries, argv.filter), argv);
}))
    .command('bundle', 'Bundles multiple .json files into one .ndjson file', {
    dir: {
        alias: 'd',
        demandOption: true,
        description: 'Target input directory',
        type: 'string',
    },
    file: {
        alias: 'f',
        default: 'merged_objects.ndjson',
        description: 'Output filename',
        type: 'string',
    },
}, (argv) => __awaiter(void 0, void 0, void 0, function* () {
    setLoggingLevel(argv);
    yield (0, ndjsonBundle_1.default)(argv);
}))
    .command('unbundle', 'Unbundle single .ndjson file into multiple .json files', {
    dir: {
        alias: 'd',
        default: '.',
        description: 'Target output directory',
        type: 'string',
    },
    file: {
        alias: 'f',
        default: 'objects.ndjson',
        demandOption: true,
        description: 'Input filename',
        type: 'string',
    },
    name: {
        alias: 'n',
        description: 'Output filename prefix',
        type: 'array',
    },
    pretty: {
        alias: 'y',
        default: true,
        description: 'Pretty-print output files',
    },
}, (argv) => __awaiter(void 0, void 0, void 0, function* () {
    setLoggingLevel(argv);
    yield (0, ndjsonUnbundle_1.default)(argv);
}))
    // .option('test', {
    //   description: 'Test mode, only print to console',
    //   type: 'boolean',
    // })
    .option('debug', {
    description: 'Log in debug mode',
    type: 'boolean',
})
    .option('verbose', {
    alias: 'v',
    description: 'Log in verbose mode',
    type: 'boolean',
})
    .help()
    .alias('help', 'h').argv;
