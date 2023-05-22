import { opendir, readFile } from 'fs/promises';
import logger from './logger';
import { createWriteStream } from 'fs';

const log = logger.label('bundle');

/**
 * Bundles multiple JSON files in a directory into one NDJSON file.
 *
 * @async
 * @function bundleNdjson
 * @param {Object} options - The options object.
 * @param {string} options.output - The output name.
 * @param {string} options.dir - The directory containing the input files.
 * @returns {Promise<void>} - A Promise that resolves when the operation completes.
 * @throws {SyntaxError} - If there is an error parsing the input files.
 * @throws {Error} - If there is any other error during the operation.
 */

const bundleNdjson = async ({ output, dir }: { output: string, dir: string }): Promise<void> => {
    const stdout = output === '-';

    let objectCount = 0;

    const outputStream = stdout ? undefined : createWriteStream(output);
    const directory = await opendir(dir);
    log.debug(`Writing to ${stdout ? 'stdout' : output}`)
    for await (const dirent of directory) {
        try {
            const buffer = await readFile(`${dir}/${dirent.name}`, 'binary');
            const data = JSON.stringify(JSON.parse(buffer));
            log.debug(`Bundling '${dir}/${dirent.name}'`);
            if (outputStream) {
                outputStream.write(data + '\n');
            } else {
                console.log(data);
            }
            objectCount++;
        } catch (err) {
            if (err instanceof SyntaxError) {
                log.warn(`Failed to parse object ${objectCount}: ${output}`);
                log.debug(SyntaxError);
            } else {
                log.error(`Directory not found: ${dir}`);
                log.debug(err);
            }
        }
    }
    log.debug(`Wrote ${objectCount} objects to ${output}`);
}
export default bundleNdjson;