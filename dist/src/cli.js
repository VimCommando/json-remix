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
const file_1 = require("../lib/file");
// To adjust logger level set an environment variable:
// Example: `export LOG_LEVEL=debug`
// Log messages default to stderr to not polute output
const log = logger_1.default.label('cli');
// Configure command-line arguments
const argv = yargs_1.default
    .command('merge <dir> [output]', 'Merges multiple single-object <dir>/${key}.json files into one json object. ', (yargs) => yargs
    .positional('dir', {
    demandOption: true,
    description: 'Target input directory',
    type: 'string',
})
    .positional('output', {
    default: '-',
    description: 'Output filename or `-` for stdout',
    type: 'string',
})
    .option('filter', {
    alias: 'f',
    description: 'Only split keys matching regex filter',
    type: 'string',
})
    .option('pretty', {
    alias: 'p',
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
    const useStdout = argv.output === '-';
    log.verbose(`Merging files '${argv.dir}/*.json' ` +
        `into ${useStdout ? 'stdout' : `'${argv.output}'`}`);
    const entries = yield (0, file_1.readEntriesFromDirectory)(argv.dir, argv.trim, argv.sort);
    const object = (0, jsonMerge_1.default)(entries, argv.filter);
    if (useStdout) {
        console.log(JSON.stringify(object, null, 4));
    }
    else {
        log.silly(JSON.stringify(entries));
        yield (0, file_1.writeObjectToFile)(object, argv.output, argv.pretty);
    }
}))
    .command('split [input] [output]', 'Splits single JSON object into multiple json objects. ', (yargs) => yargs
    .positional('input', {
    default: '-',
    description: 'Input filename or `-` for stdin',
    type: 'string',
})
    .positional('output', {
    default: '-',
    description: 'Target output directory or `-` for stdout',
    type: 'string',
})
    .option('filter', {
    alias: 'f',
    description: 'Only split keys matching regex filter',
    type: 'string',
})
    .option('pretty', {
    alias: 'p',
    default: true,
    description: 'Pretty-print output files',
    type: 'boolean',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    const useStdin = argv.input === '-';
    const useStdout = argv.output === '-';
    log.verbose(`Splitting ${useStdin ? 'stdin' : 'input ' + argv.input} ` +
        `into ${useStdout ? 'stdout' : argv.output + `'/\${key}.json files'`}`);
    const writeEntries = (entries) => __awaiter(void 0, void 0, void 0, function* () {
        if (useStdout) {
            console.log(JSON.stringify(Object.fromEntries(entries), null, 4));
        }
        else {
            yield (0, file_1.writeEntriesToFiles)(entries, argv.output, argv.pretty);
        }
    });
    if (useStdin) {
        process.stdin.on('data', (data) => __awaiter(void 0, void 0, void 0, function* () {
            const entries = (0, jsonSplit_1.default)(JSON.parse(data.toString()), argv.filter);
            writeEntries(entries);
        }));
    }
    else {
        log.debug(`Reading from ${argv.input}`);
        const entries = (0, jsonSplit_1.default)(yield (0, file_1.readObjectFromFile)(argv.input), argv.filter);
        writeEntries(entries);
    }
}))
    .command('bundle <dir> [output]', 'Bundles multiple <dir>/*.json files into one ndjson file', (yargs) => yargs
    .positional('dir', {
    demandOption: true,
    description: 'Target input directory',
    type: 'string',
})
    .positional('output', {
    default: '-',
    description: 'Output filename or `-` for stdout',
    type: 'string',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, ndjsonBundle_1.default)(argv);
}))
    .command('unbundle [input] [output]', 'Unbundle single [input] file into multiple json objects', (yargs) => yargs
    .positional('input', {
    default: '-',
    description: 'Input filename or `-` for stdin',
    type: 'string',
})
    .positional('output', {
    default: '-',
    description: 'Target output directory or `-` for stdout',
    type: 'string',
})
    .option('name', {
    alias: 'n',
    description: 'Output filename prefix',
    type: 'array',
})
    .option('pretty', {
    alias: 'p',
    default: true,
    description: 'Pretty-print output objects',
}), (argv) => __awaiter(void 0, void 0, void 0, function* () {
    yield (0, ndjsonUnbundle_1.default)(argv);
}))
    .strictCommands()
    .demandCommand()
    .wrap(yargs_1.default.terminalWidth())
    .help().alias('help', 'h')
    .epilog('Use --help with any command to see additional options, e.g. json-remix split --help')
    .argv;
