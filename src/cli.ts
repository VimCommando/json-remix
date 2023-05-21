#!/usr/bin/env node
import jsonMerge from '../lib/jsonMerge';
import jsonSplit from '../lib/jsonSplit';
import ndjsonUnbundle from '../lib/ndjsonUnbundle';
import ndjsonBundle from '../lib/ndjsonBundle';
import yargs, { Arguments } from 'yargs';
import logger from '../lib/logger';
import { isEmpty } from 'ramda';
import {
    readEntriesFromDirectory,
    readObjectFromFile,
    writeEntriesToFiles,
    writeObjectToFile
} from '../lib/file';

// to adjust logger level set an environment variable, e.g.:
// `export LOG_LEVEL=debug` before running the command
const log = logger.label('cli');

// Configure command-line arguments
const argv = yargs
    .command(
        'merge <dir> [file]',
        'Merges multiple single-object <dir>/${key}.json files into one [file].json file. ',
        (yargs) => yargs
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
            })
        ,
        async (argv) => {
            log.verbose(
                `Merging files '${argv.dir}/*.json' into file '${argv.file}'`
            );
            const entries = await readEntriesFromDirectory(
                argv.dir,
                argv.trim,
                argv.sort
            );
            log.debug(JSON.stringify(entries));
            if (!isEmpty(entries))
                await writeObjectToFile(jsonMerge(entries, argv.filter), argv);
        }
    )
    .command(
        'split <file> [dir]',
        'Splits single-object .json <file> into multiple [dir]/${key}.json files. ',
        (yargs) => yargs
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
            })
        ,
        async (argv) => {
            log.verbose(
                `Splitting file '${argv.file}' into '${argv.dir}/\${key}.json'`
            );
            const object: object = await readObjectFromFile(argv.file);
            if (object)
                await writeEntriesToFiles(jsonSplit(object, argv.filter), argv);
        }
    )
    .command(
        'bundle <dir> [file]',
        'Bundles multiple <dir>/*.json files into one [file].ndjson file',
        (yargs) => yargs
            .positional('dir', {
                demandOption: true,
                description: 'Target input directory',
                type: 'string',
            })
            .positional('file', {
                default: '-',
                description: 'Output filename (or stdout)',
                type: 'string',
            })
        ,
        async (argv) => {
            await ndjsonBundle(argv);
        }
    )
    .command(
        'unbundle [file] [dir]',
        'Unbundle single [file].ndjson file into multiple [dir]/*.json files',
        (yargs) => yargs
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
            })
        ,
        async (argv) => {
            await ndjsonUnbundle(argv);
        }
    )
    // .option('test', {
    //   description: 'Test mode, only print to console',
    //   type: 'boolean',
    // })
    .strictCommands()
    .demandCommand()
    .wrap(yargs.terminalWidth())
    .help().alias('help', 'h')
    .epilog('Use --help with any command to see additional options, e.g. json-remix split --help')
    .argv;
