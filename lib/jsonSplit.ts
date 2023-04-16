import { pick, test } from 'ramda';
import logger from './logger';
import { Entry } from './types';

const log = logger.label('divide');

/**
 * Splits the given object into an array of key-value pairs (entries), optionally filtered by key.
 *
 * @param {object} object - The object to split.
 * @param {string} [expression] - The optional regular expression string to use for filtering the keys.
 * @returns {Entry[]} - The array of filtered key-value pairs (entries) from the given object.
 */
const jsonSplit = (object: object, expression?: string): Entry[] => {
    if (expression === undefined) {
        log.verbose(`No key filter given`);
        return Object.entries(object);
    } else {
        const regex: RegExp = new RegExp(expression);
        log.verbose(`Key filter regex is: ${regex}`);
        const filteredKeys: string[] = Object.keys(object).filter(test(regex));
        log.debug(`Filtered keys: ${filteredKeys}`);
        const selection: object = pick(filteredKeys, object);

        return Object.entries(selection);
    }
};

export default jsonSplit;
