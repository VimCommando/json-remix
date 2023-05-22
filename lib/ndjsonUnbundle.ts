import { mkdir, writeFile } from 'fs/promises';
import { createReadStream } from 'fs';
import * as readline from 'node:readline';
import { isNil, path as valueFrom } from 'ramda';
import logger from './logger';

const log = logger.label('unbundle');

/**
 * Retrieves the prefix from a JSON object based on the specified path.
 *
 * @param {any} json - The JSON object from which to retrieve the prefix.
 * @param {(number | string)[]} name - The path to the prefix as an array of
 * numbers or strings.
 * @returns {string | undefined} - The retrieved prefix or undefined if it
 * doesn't exist.
 */

const getPrefix = (json: any, name?: (number | string)[]): string | undefined => {
    if (!name) return undefined

    /**
     * Converts valid strings in the `name` array into arrays of strings by
     * splitting them with periods.
     *
     * @param {(number | string)} x - The value to filter and convert.
     * @returns {string[][]} - The resulting array of string arrays.
     */

    const paths: string[][] = name
        .filter((x) => typeof x === 'string')
        .map((s) => (s as string).split('.'));

    return paths
        .map((path) => valueFrom(path, json))
        .filter((value) => !isNil(value))
        .filter((value) => typeof value === 'string')
        .join('.');
}

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

const ndjsonUnbundle = async ({
    input,
    output,
    name,
    pretty,
}: {
    input: string;
    output: string;
    name?: (string | number)[];
    pretty?: boolean;
}) => {
    const formatJson = pretty
        ? (o: object): string => JSON.stringify(o, null, 4)
        : (o: object): string => JSON.stringify(o);
    let lineNumber = 0; // top scope so we can use in error handling

    try {
        const inputStream = input === '-' ? process.stdin : createReadStream(input);
        const outputStream = output === '-' ? process.stdout : undefined;
        const rl = readline.createInterface({
            input: inputStream,
            output: outputStream,
            terminal: false, // don't echo input lines to the output
            crlfDelay: Infinity, // ensures we only get one line break
        });

        if (!outputStream) {
            log.debug(`Creating directory: ${output}`);
            await mkdir(output, { recursive: true });
        }

        log.verbose(`Unbundling ${input === '-' ? 'stdin' : input} to ${output === '-' ? 'stdout' : output + '/'}`);
        for await (const line of rl) {
            ++lineNumber; // to keep valid line numbers, always increment
            if (!line || line === '') return; // only output defined and non-empty lines
            const json = JSON.parse(line);
            const prefix = getPrefix(json, name);
            const number = lineNumber.toString().padStart(6, '0');
            const filename = prefix ? `${prefix}.json` : `object-${number}.json`;

            if (outputStream) {
                console.log(JSON.stringify(json, null, 2));
            } else {
                log.silly(`unbundle: ${JSON.stringify(json, null, 2)}`);
                log.debug(`Writing ${pretty ? 'pretty' : 'one-line'} file ${filename}`);
                const data = new Uint8Array(Buffer.from(formatJson(json)));
                await writeFile(`${output}/${filename}`, data);
            }
        };
    } catch (err) {
        if (err instanceof SyntaxError) {
            log.warn(`Failed to parse: ${input}:${lineNumber}`);
            log.debug(SyntaxError);
        } else {
            log.error(`File not found: ${input}`);
            log.debug(err);
        }
    }
};

export default ndjsonUnbundle;