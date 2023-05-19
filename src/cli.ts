#!/usr/bin/env node
import jsonMerge from '../lib/jsonMerge';
import jsonSplit from '../lib/jsonSplit';
import ndjsonUnbundle from '../lib/ndjsonUnbundle';
import ndjsonBundle from '../lib/ndjsonBundle';
import { mkdir, opendir, readFile, writeFile } from 'fs/promises';
import yargs, { Arguments } from 'yargs';
import logger from '../lib/logger';
import { Entry } from '../lib/types';
import { isEmpty } from 'ramda';

const log = logger.label('cli');

// adjust logger level if command-line arguments were given
const setLoggingLevel = ({ debug, verbose }: Arguments) => {
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
        // Expand on failures, can fail on read or parse
        log.error(`File not found: ${file}`);
        log.debug(err);
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
        log.error(`Failed to write file: ${file}`);
        log.debug(`${err}`);
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
        log.error(`Failed to write files to directory: ${dir}`);
        log.debug(err);
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

    extension
        ? log.verbose(`Trimming extension: ${extension}`)
        : log.verbose(`No extension to trim`);

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
        log.error(`Directory not found: ${dir}`);
        log.debug(`${err}`);
    }

    return sort ? entries.sort() : entries;
};

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
            setLoggingLevel(argv);
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
            setLoggingLevel(argv);
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
                default: 'merged_objects.ndjson',
                description: 'Output filename',
                type: 'string',
            })
        ,
        async (argv) => {
            setLoggingLevel(argv);
            await ndjsonBundle(argv);
        }
    )
    .command(
        'unbundle <file> [dir]',
        'Unbundle single <file>.ndjson file into multiple [dir]/*.json files',
        (yargs) => yargs
            .positional('dir', {
                default: '.',
                description: 'Target output directory',
                type: 'string',
            })
            .positional('file', {
                default: 'objects.ndjson',
                demandOption: true,
                description: 'Input filename',
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
    .strictCommands()
    .demandCommand()
    .wrap(yargs.terminalWidth())
    .help().alias('help', 'h')
    .epilog('Use --help with any command to see additional options, e.g. json-remix split --help')
    .argv;
