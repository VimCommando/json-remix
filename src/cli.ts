#!/usr/bin/env node
import jsonMerge from '../lib/jsonMerge';
import jsonSplit from '../lib/jsonSplit';
import ndjsonUnbundle from '../lib/ndjsonUnbundle';
import ndjsonBundle from '../lib/ndjsonBundle';
import { mkdir, opendir, readFile, writeFile } from 'fs/promises';
import yargs, { Arguments } from 'yargs';
import logger from '../lib/logger';
import { Entry } from '../lib/types';

const log = logger.label('cli');

// adjust logger level if command-line arguments were given
const setLoggingLevel = (argv: Arguments) => {
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
const readObjectFromFile = async (file: string) => {
    try {
        const buffer = await readFile(file, 'binary');
        return JSON.parse(buffer.toString());
    } catch (err) {
        // Expand on failures, can fail separately on read or parse
        log.error(`${err}: ${file}`);
    }
};

/**
 * Writes a JavaScript object to a file in JSON format.
 * @param object - The JavaScript object to write to the file.
 * @param options - Object containing the file path and an optional pretty flag.
 * @param options.file - The path of the file to write the object to.
 * @param options.pretty - Optional. If true, the JSON data will be formatted
 * with 4-space indentation for readability.
 * @throws If there is an error writing the file.
 */
const writeObjectToFile = async (
    object: object,
    {
        file,
        pretty,
    }: {
        file: string;
        pretty?: boolean;
    }
) => {
    const formatJson = pretty
        ? (o: object): string => JSON.stringify(o, null, 2)
        : (o: object): string => JSON.stringify(o);

    try {
        const data = new Uint8Array(Buffer.from(formatJson(object)));
        log.debug(`Writing ${pretty ? 'pretty' : 'one-line'} file ${file}`);
        await writeFile(file, data);
    } catch (err) {
        log.error(`${err}: ${file}`);
    }
};

/**
 * Writes an array of key-value pairs to JSON files in a directory.
 * @param entries - An array of key-value pairs to write to files.
 * @param options - Object containing the target directory path and optional pretty flag.
 * @param options.dir - The path of the directory to write the files to.
 * @param options.pretty - Optional. If true, the JSON data will be formatted
 * with 4-space indentation for readability.
 * @throws If there is an error creating the directory or writing any of the files.
 */
const writeEntriesToFiles = async (
    entries: Entry[],
    {
        dir,
        pretty,
    }: {
        dir: string;
        pretty?: boolean;
    }
) => {
    // Don't create the directory if it is the present working directory
    try {
        if (dir !== '.') {
            log.verbose(`Creating directory ${dir}`);
            await mkdir(dir, { recursive: true });
        }
        entries.map(async ([key, object]: Entry) => {
            await writeObjectToFile(object, { file: `${dir}/${key}.json`, pretty });
        });
    } catch (err) {
        log.error(`${err}: ${dir}`);
    }
};

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
const readEntriesFromDirectory = async (
    dir: string,
    extension?: string,
    sort?: boolean
): Promise<Entry[]> => {
    const entries: Entry[] = [];

    log.verbose(`Trimming extension: ${extension}`);
    // Helper function to trim file extensions
    const trimExtension = (s: string) =>
        extension == undefined ? s : s.substring(0, s.lastIndexOf(extension));

    try {
        const directory = await opendir(dir);
        for await (const dirent of directory) {
            const object = await readObjectFromFile(`${dir}/${dirent.name}`);
            const name = trimExtension(dirent.name);
            log.debug(`Appending entry ${name} from '${dir}/${dirent.name}'`);
            entries.push([name, object]);
        }
    } catch (err) {
        log.error(`${err}: ${dir}`);
    }

    return sort ? entries.sort() : entries;
};

// Configure command-line arguments
const argv = yargs
    .command(
        'split',
        'Splits single-object .json file object into multiple ${key}.json files. ',
        {
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
        },
        async (argv) => {
            setLoggingLevel(argv);
            log.verbose(
                `Splitting file '${argv.file}' into '${argv.dir}/\${key}.json'`
            );
            const object: object = await readObjectFromFile(argv.file);
            await writeEntriesToFiles(jsonSplit(object, argv.filter), argv);
        }
    )
    .command(
        'merge',
        'Merges multiple single-object ${key}.json files into one object.json file. ',
        {
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
        },
        async (argv) => {
            setLoggingLevel(argv);
            log.verbose(
                `Merging files '${argv.dir}/*.json' into file '${argv.file}'`
            );
            const entries = await readEntriesFromDirectory(
                argv.dir,
                argv.trim,
                argv.sort
            );
            await writeObjectToFile(jsonMerge(entries, argv.filter), argv);
        }
    )
    .command(
        'bundle',
        'Bundles multiple .json files into one .ndjson file',
        {
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
        },
        async (argv) => {
            setLoggingLevel(argv);
            await ndjsonBundle(argv);
        }
    )
    .command(
        'unbundle',
        'Unbundle single .ndjson file into multiple .json files',
        {
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
        },
        async (argv) => {
            setLoggingLevel(argv);
            await ndjsonUnbundle(argv);
        }
    )
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
