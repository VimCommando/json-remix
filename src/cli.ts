#!/usr/bin/env node
import jsonMerge from '../lib/jsonMerge';
import jsonSplit from '../lib/jsonSplit';
import ndjsonUnbundle from '../lib/ndjsonUnbundle';
import ndjsonBundle from '../lib/ndjsonBundle';
import yargs from 'yargs';
import logger from '../lib/logger';
import {
    readEntriesFromDirectory,
    readObjectFromFile,
    writeEntriesToFiles,
    writeObjectToFile
} from '../lib/file';
import { Entry } from '../lib/types';

// To adjust logger level set an environment variable:
// Example: `export LOG_LEVEL=debug`
// Log messages default to stderr to not polute output
const log = logger.label('cli');

// Configure command-line arguments
const argv = yargs
    .command(
        'merge <dir> [output]',
        'Merges multiple single-object <dir>/${key}.json files into one json object. ',
        (yargs) => yargs
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
            })
        ,
        async (argv) => {
            const useStdout = argv.output === '-';
            log.verbose(
                `Merging files '${argv.dir}/*.json' ` +
                `into ${useStdout ? 'stdout' : `'${argv.output}'`}`
            );

            const entries = await readEntriesFromDirectory(
                argv.dir,
                argv.trim,
                argv.sort
            );

            const object = jsonMerge(entries, argv.filter);
            if (useStdout) {
                console.log(JSON.stringify(object, null, 4));
            } else {
                log.silly(JSON.stringify(entries));
                await writeObjectToFile(object, argv.output, argv.pretty);
            }
        }
    )
    .command(
        'split [input] [output]',
        'Splits single JSON object into multiple json objects. ',
        (yargs) => yargs
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
                alias: 'y',
                default: true,
                description: 'Pretty-print output files',
                type: 'boolean',
            })
        ,
        async (argv) => {
            const useStdin = argv.input === '-';
            const useStdout = argv.output === '-';
            log.verbose(
                `Splitting ${useStdin ? 'stdin' : 'input ' + argv.input} ` +
                `into ${useStdout ? 'stdout' : argv.output + `'/\${key}.json files'`}`
            );

            const writeEntries = async (entries: Entry[]) => {
                if (useStdout) {
                    console.log(JSON.stringify(Object.fromEntries(entries), null, 4));
                } else {
                    await writeEntriesToFiles(entries, argv.output, argv.pretty);
                }
            }

            if (useStdin) {
                process.stdin.on('data', async (data) => {
                    const entries = jsonSplit(JSON.parse(data.toString()), argv.filter);
                    writeEntries(entries);
                })
            } else {
                log.debug(`Reading from ${argv.input}`);
                const entries = jsonSplit(await readObjectFromFile(argv.input), argv.filter);
                writeEntries(entries)
            }
        }
    )
    .command(
        'bundle <dir> [output]',
        'Bundles multiple <dir>/*.json files into one ndjson file',
        (yargs) => yargs
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
        ,
        async (argv) => {
            await ndjsonBundle(argv);
        }
    )
    .command(
        'unbundle [intput] [output]',
        'Unbundle single [input].ndjson file into multiple json objects',
        (yargs) => yargs
            .positional('input', {
                default: '-',
                demandOption: true,
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
                alias: 'y',
                default: true,
                description: 'Pretty-print output objects',
            })
        ,
        async (argv) => {
            await ndjsonUnbundle(argv);
        }
    )
    .strictCommands()
    .demandCommand()
    .wrap(yargs.terminalWidth())
    .help().alias('help', 'h')
    .epilog('Use --help with any command to see additional options, e.g. json-remix split --help')
    .argv;
