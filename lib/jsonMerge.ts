import { Entry } from './types';
import logger from './logger';

const log = logger.label('merge');

/**
 * Merges an array of Entry objects into a single object,
 * filtered by an optional regular expression on the keys.
 * 
 * @param {Entry[]} entries - The array of Entry objects to merge.
 * @param {string} [expression] - The regular expression string used to filter the keys.
 * 
 * @returns {object} - A new object that is the merged version of the Entry values.
 * 
 * @example
 * const merged = merge(entries);
 * const filtered = merge(entries, "^foo"); // Only include entries with keys starting with "foo"
 */
const merge = (entries: Entry[], expression?: string): object => {

    if (expression === undefined) {
        log.verbose(`No key filter given`);
        return Object.fromEntries(entries);
    } else {
        const regex = new RegExp(expression);
        log.verbose(`Regex key filter: ${regex}`);
        const includeKey = ([key, value]: Entry) => regex.test(key);

        return Object.fromEntries(entries.filter(includeKey));
    }
};

export default merge;