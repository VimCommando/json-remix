import { opendir, readFile, writeFile } from 'fs/promises';
import logger from './logger';

const log = logger.label('bundle');

// Convert directory of .json files into single .ndjson
const bundleNdjson = async (dir: string, file: string) => {
    let output = '';
    let i = 0;
    try {
        const directory = await opendir(dir);
        for await (const dirent of directory) {
            const buffer = await readFile(`${dir}/${dirent.name}`, 'binary');
            log.verbose(`Bundling '${dir}/${dirent.name}'`);
            output += JSON.stringify(JSON.parse(buffer)) + '\n';
            i++;
        }
        const data = new Uint8Array(Buffer.from(output));
        await writeFile(file, data);
        log.info(`Wrote ${i} objects to ${file}`);
    } catch (err) {
        log.error(err);
    }
}
export default bundleNdjson;