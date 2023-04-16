import { mkdir,readFile,writeFile } from 'fs/promises'
import logger from './logger';

const log = logger.label('unbundle');

/**
 * Unbundles NDJSON files to individual JSON files
 * @async
 * @param {Object} options - Options object
 * @param {string} options.file - The NDJSON file to unbundle
 * @param {string} options.dir - The directory to write the individual JSON files to
 * @param {boolean} [options.pretty] - Whether or not to prettify the JSON output (default is false)
 * @throws {Error} If the file cannot be read or the directory cannot be created
 */

const ndjsonUnbundle = async ({file, dir, pretty}: {file: string, dir: string, pretty?: boolean}) => {
    const formatJson = pretty 
        ? (o: object): string => JSON.stringify(o,null,4)
        : (o: object): string => JSON.stringify(o);

    try {
        const buffer = await readFile(file, 'binary');
        await mkdir(dir, { recursive: true });
    
        log.verbose(`Unbundling ${file} to ${dir}`);
        buffer.split('\n').forEach(async (line, index) => {
            if(line === "") return; // don't create a file for an empty line
            const filename = `object-${(++index).toString().padStart(6,'0')}.json`;
            const json = line && JSON.parse(line);
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