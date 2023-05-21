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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jsonMerge_1 = __importDefault(require("../lib/jsonMerge"));
const jsonSplit_1 = __importDefault(require("../lib/jsonSplit"));
const ndjsonUnbundle_1 = __importDefault(require("../lib/ndjsonUnbundle"));
const ndjsonBundle_1 = __importDefault(require("../lib/ndjsonBundle"));
const yargs_1 = __importDefault(require("yargs"));
const logger_1 = __importDefault(require("../lib/logger"));
const ramda_1 = require("ramda");
const file_1 = require("../lib/file");
// to adjust logger level set an environment variable, e.g.:
// `export LOG_LEVEL=debug` before running the command
const log = logger_1.default.label('cli');
// Configure command-line arguments
const argv = yargs_1.default
    .command('merge <dir> [file]', 'Merges multiple single-object <dir>/${key}.json files into one [file].json file. ', (yargs) => yargs
    .positional('dir', {
    demandOption: true,
    description: 'Target input directory',
    type: 'string',
})
    .positional('file', {
    default: 'object.json',
    description: 'Output filename',
    type: 'string',
})
    .option('filter', {
    alias: 'r',
    description: 'Only split keys matching regex filter',
    type: 'string',
})
    .option('pretty', {
    alias: 'y',
    default: true,
    description: 'Pretty-print output files',
    type: 'boolean',
})
    .option('sort', {
    alias: 's',
    default: false,
    description: 'Alphabetically sort object keys',
    type: 'boolean',
})
    .option('trim', {
    alias: 't',
    description: 'File extension to trim from object key names',
    type: 'string',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    log.verbose(`Merging files '${argv.dir}/*.json' into file '${argv.file}'`);
    const entries = yield (0, file_1.readEntriesFromDirectory)(argv.dir, argv.trim, argv.sort);
    log.debug(JSON.stringify(entries));
    if (!(0, ramda_1.isEmpty)(entries))
        yield (0, file_1.writeObjectToFile)((0, jsonMerge_1.default)(entries, argv.filter), argv);
}))
    .command('split <file> [dir]', 'Splits single-object .json <file> into multiple [dir]/${key}.json files. ', (yargs) => yargs
    .positional('file', {
    demandOption: true,
    description: 'Input filename',
    type: 'string',
})
    .positional('dir', {
    default: '.',
    description: 'Target output directory',
    type: 'string',
})
    .option('filter', {
    alias: 'r',
    description: 'Only split keys matching regex filter',
    type: 'string',
})
    .option('pretty', {
    alias: 'y',
    default: true,
    description: 'Pretty-print output files',
    type: 'boolean',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    log.verbose(`Splitting file '${argv.file}' into '${argv.dir}/\${key}.json'`);
    const object = yield (0, file_1.readObjectFromFile)(argv.file);
    if (object)
        yield (0, file_1.writeEntriesToFiles)((0, jsonSplit_1.default)(object, argv.filter), argv);
}))
    .command('bundle <dir> [file]', 'Bundles multiple <dir>/*.json files into one [file].ndjson file', (yargs) => yargs
    .positional('dir', {
    demandOption: true,
    description: 'Target input directory',
    type: 'string',
})
    .positional('file', {
    default: '-',
    description: 'Output filename (or stdout)',
    type: 'string',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, ndjsonBundle_1.default)(argv);
}))
    .command('unbundle [file] [dir]', 'Unbundle single [file].ndjson file into multiple [dir]/*.json files', (yargs) => yargs
    .positional('dir', {
    default: '-',
    description: 'Target output directory (or stdout)',
    type: 'string',
})
    .positional('file', {
    default: '-',
    demandOption: true,
    description: 'Input filename (or stdin)',
    type: 'string',
})
    .option('name', {
    alias: 'n',
    description: 'Output filename prefix',
    type: 'array',
})
    .option('pretty', {
    alias: 'y',
    default: true,
    description: 'Pretty-print output files',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, ndjsonUnbundle_1.default)(argv);
}))
    // .option('test', {
    //   description: 'Test mode, only print to console',
    //   type: 'boolean',
    // })
    .strictCommands()
    .demandCommand()
    .wrap(yargs_1.default.terminalWidth())
    .help().alias('help', 'h')
    .epilog('Use --help with any command to see additional options, e.g. json-remix split --help')
    .argv;
