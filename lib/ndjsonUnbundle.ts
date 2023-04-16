import { mkdir,readFile,writeFile } from 'fs/promises'
import { isNil, path } from 'ramda';
import logger from './logger';

const log = logger.label('unbundle');
log.level = 'debug';

/**
 * Reads an NDJSON file and writes each object to a separate file.
 *
 * @async
 * @param {Object} options - The function options.
 * @param {string} options.dir - The output directory path.
 * @param {string} options.file - The input NDJSON file path.
 * @param {Array<string|number>} [options.name] - An array of property names or indices to use as a filename prefix.
 * @param {boolean} [options.pretty=false] - Whether to format the output JSON with indentation and line breaks.
 * @returns {Promise<void>}
 * @throws {SyntaxError} When the input file contains invalid JSON.
 * @throws {Error} When any other error occurs.
 */

const ndjsonUnbundle = async ({file, dir, pretty, name}: {
    dir: string, 
    file: string, 
    name?: (string|number)[],
    pretty?: boolean,
}) => {
    const formatJson = pretty 
        ? (o: object): string => JSON.stringify(o,null,4)
        : (o: object): string => JSON.stringify(o);

    try {
        const buffer = await readFile(file, 'binary');
        await mkdir(dir, { recursive: true });
    
        log.verbose(`Unbundling ${file} to ${dir}`);
        buffer.split('\n').forEach(async (line, index) => {
            if(!line || line === "") return; // only create defined and non-empty lines
            const json = JSON.parse(line);
            // Splits provided names on `.` to create a path to pick the value from
            // then joins picked values with `.` to create a filename
            const prefix = name?.map(name => path((name as string).split('.'),json))
                .filter(x => !isNil(x)).join('.');
            const number = (++index).toString().padStart(6,'0');
            const filename = prefix ? `${prefix}.json` : `object-${number}.json`;
            log.silly(`unbundle: ${JSON.stringify(json,null,2)}`);
            log.debug(`Writing ${pretty?'pretty':'one-line'} file ${filename}`);
            const data = new Uint8Array(Buffer.from(formatJson(json)));
            await writeFile(`${dir}/${filename}`, data);
        });
    } catch (err) {
        if (err instanceof SyntaxError ) {
            console.log(SyntaxError);
            log.warn(`Failed to parse: ${file}: ${SyntaxError}`);
        } else {
            log.error(`${err}: ${file}`);
        }
    }
}

export default ndjsonUnbundle;