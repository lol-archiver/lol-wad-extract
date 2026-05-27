import { spawnSync } from 'node:child_process';
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { gunzipSync, zstdDecompressSync } from 'node:zlib';

import XXHash from 'xxhashjs';

import { RichError } from '@danor-lib/error';
import { Biffer } from '@danor-lib/biffer';

/** @import { ExtractConfig, ExtractOption, RawExtractConfig } from './types.ts' */



/**
 * Decompresses a buffer using zstd
 * @param {Buffer} buffer
 * @param {{ fileZSTD: string, maxBuffer: number }} options
 * @returns {buffer}
 */
const unzstd = (buffer, options) => {
	const result = spawnSync(options.fileZSTD, ['-d'], {
		input: buffer,
		maxBuffer: options.maxBuffer || buffer.length * 16,
		encoding: 'buffer',
	});

	if(result.error || result.stderr?.length) {
		throw new RichError({
			code: 'spawn-zstd-error', at: 'lol-wad-extract/unzstd',
			data: { buffer, fileZSTD: options.fileZSTD, maxBuffer: options.maxBuffer },
			cause: result.error || result.stderr?.toString(),
		});
	}

	return result.stdout;
};



/** @type {Object<string,bigint>} */
const hashPool = {};

/**
 * Calculates the hash of a WAD file entry
 * @param {string} string The input string to hash, typically the file path within the WAD
 * @param {string} [format='bigint'] The format of the returned hash. Can be 'bigint' or 'hexpad'
 * @returns {bigint|string}
 */
export const hashWAD = (string, format = 'bigint') => {
	if(typeof string != 'string') {
		throw new RichError({
			code: 'invalid-string', at: 'lol-wad-extract/hashWAD(1:string)',
			data: { string, isHex: format },
		});
	}


	const stringLower = string.toLowerCase();

	let hashBigint = hashPool[stringLower];
	if(!hashBigint) {
		const bufferString = Buffer.from(stringLower);

		hashBigint = BigInt(XXHash.h64(bufferString, 0));
		hashPool[stringLower] = hashBigint;
	}


	if(format == 'hexpad') {
		const hashHex = hashBigint.toString(16);

		return hashHex.padStart(10, '0');
	}


	return hashBigint;
};



/**
 * Extracts files from a WAD archive based on the provided configurations
 * @param {string} fileWAD The path to the WAD file to extract from
 * @param {RawExtractConfig[]} configsExtractRaw An array of raw extraction configurations, each containing the file path within the WAD and optional save path
 * @param {ExtractOption} [options={}] Optional extraction options, such as the path to the zstd executable and maximum buffer size for decompression
 * @returns {Promise<ExtractConfig[]>}
 */
export const extractWAD = async (fileWAD, configsExtractRaw = [], options = {}) => {
	let fdWAD;
	try {
		fdWAD = openSync(fileWAD);
		const bifferWAD = new Biffer(fdWAD);


		/** @type {Object<string,ExtractConfig>} */
		const configsExtract$hash = {};
		/** @type {ExtractConfig[]} */
		const configsExtract = [];
		for(const configExtract of configsExtractRaw) {
			const hashInpack = hashWAD(configExtract.fileInpack);

			configsExtract.push(configsExtract$hash[hashInpack] =
				Object.assign({ hashInpack }, configExtract)
			);
		}


		// eslint-disable-next-line no-unused-vars
		const [magic, versionMajor, versionMinor] = bifferWAD.unpack('2sBB');


		if(versionMajor == 1) {
			bifferWAD.seek(8);
		}
		else if(versionMajor == 2) {
			bifferWAD.seek(100);
		}
		else if(versionMajor == 3) {
			bifferWAD.seek(268);
		}


		const [sizeEntry] = bifferWAD.unpack('I');

		for(let i = 0; i < sizeEntry; i++) {
			const [hash, offset, compressedSize, /* size */, type/* , duplicate, , , sha256 */] =
				bifferWAD.unpack(versionMajor == 1 ? 'QIIII' : 'QIIIBBBBQ');


			const configExtract = configsExtract$hash[String(hash)];
			if(!configExtract) { continue; }




			const bifferExtract = new Biffer(fdWAD);
			bifferExtract.seek(offset);

			const bufferRaw = bifferExtract.slice(compressedSize, { wrap: false });


			if(type == 0) {
				configExtract.buffer = bufferRaw;
			}
			else if(type == 1) {
				configExtract.buffer = gunzipSync(bufferRaw);
			}
			else if(type == 2) {
				throw new RichError({
					code: 'unused-extract-type', at: 'lol-wad-extract/extractWAD',
					data: { type, bufferRaw, hash, offset, compressedSize },
				});
			}
			else if(type == 3) {
				if(options.fileZSTD) {
					configExtract.buffer = await unzstd(bufferRaw, {
						fileZSTD: options.fileZSTD,
						maxBuffer: options.maxBufferUnzstd
					});
				}
				else {
					configExtract.buffer = zstdDecompressSync(bufferRaw);
				}
			}


			if(configExtract.fileSave) {
				writeFileSync(configExtract.fileSave, configExtract.buffer);

				configExtract.saved = true;
			}
		}


		return configsExtract.filter(config => config.buffer);
	}
	finally {
		if(typeof fdWAD == 'number') { closeSync(fdWAD); }
	}
};
