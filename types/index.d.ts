import type { RawExtractConfig, ExtractOption, ExtractConfig } from './types.ts';



/**
 * Calculates the hash of a WAD file entry
 * @param {string} string The input string to hash, typically the file path within the WAD
 * @param {string} [format='bigint'] The format of the returned hash. Can be 'bigint' or 'hexpad'
 * @returns {bigint|string}
 */
export function hashWAD(string: string, format?: string): bigint | string;


/**
 * Extracts files from a WAD archive based on the provided configurations
 * @param {string} fileWAD The path to the WAD file to extract from
 * @param {RawExtractConfig[]} configsExtractRaw An array of raw extraction configurations, each containing the file path within the WAD and optional save path
 * @param {ExtractOption} [options={}] Optional extraction options, such as the path to the zstd executable and maximum buffer size for decompression
 * @returns {Promise<ExtractConfig[]>}
 */
export function extractWAD(fileWAD: string, configsExtractRaw: RawExtractConfig[], options?: ExtractOption): Promise<ExtractConfig[]>;
