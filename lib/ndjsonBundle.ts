import { opendir, readFile, writeFile } from 'fs/promises';
import logger from './logger';

const log = logger.label('bundle');

/**
 * Bundles multiple JSON files in a directory into one NDJSON file.
 *
 * @async
 * @function bundleNdjson
 * @param {Object} options - The options object.
 * @param {string} options.file - The output filename.
 * @param {string} options.dir - The directory containing the input files.
 * @returns {Promise<void>} - A Promise that resolves when the operation completes.
 * @throws {SyntaxError} - If there is an error parsing the input files.
 * @throws {Error} - If there is any other error during the operation.
 */

const bundleNdjson = async ({file, dir}: {file: string, dir: string}) => {
    let output = '';
    let i = 0;
    try {
        const directory = await opendir(dir);
        for await (const dirent of directory) {
            const buffer = await readFile(`${dir}/${dirent.name}`, 'binary');
            log.debug(`Bundling '${dir}/${dirent.name}'`);
            output += JSON.stringify(JSON.parse(buffer)) + '\n';
            i++;
        }
        const data = new Uint8Array(Buffer.from(output));
        await writeFile(file, data);
        log.verbose(`Wrote ${i} objects to ${file}`);
    } catch (err) {
        if (err instanceof SyntaxError ) {
            console.log(SyntaxError);
            log.warn(`Failed to parse: ${file}: ${SyntaxError}`);
        } else {
            log.error(`${err}: ${file}`);
        }
    }
}
export default bundleNdjson;