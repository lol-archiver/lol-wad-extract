import { spawnSync } from 'node:child_process';
import { closeSync, openSync, writeFileSync } from 'node:fs';
import { gunzipSync, zstdDecompressSync } from 'node:zlib';

import XXHash from 'xxhashjs';

import Biffer from '@nuogz/biffer';


/** @typedef {import('./bases.d.ts').ExtractOption} ExtractOption */
/** @typedef {import('./bases.d.ts').RawExtractConfig} RawExtractConfig */
/** @typedef {import('./bases.d.ts').ExtractConfig} ExtractConfig */



/**
 * @param {Buffer} buffer
 * @param {{ fileZSTD: string, maxBuffer: number }} option
 * @returns {buffer}
 */
const unzstd = (buffer, option) => {
	const result = spawnSync(option.fileZSTD, ['-d'], {
		input: buffer,
		maxBuffer: option.maxBuffer || buffer.length * 16,
		encoding: 'buffer',
	});

	if(result.error || result.stderr.length) { throw Error(result.error || result.stderr.toString()); }

	return result.stdout;
};



/**
 * @param {string} string
 * @param {boolean} [isHex=false]
 * @returns {bigint}
 */
export const hashWAD = (string, isHex = false) => {
	if(typeof string != 'string') { throw Error('argv not String'); }


	const stringLower = string.toLowerCase();
	const bufferString = Buffer.from(stringLower);
	const bufferHash = Buffer.from(XXHash.h64(bufferString, 0).toString(16).padStart(16, '0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
	const hexHashRaw = bufferHash.swap64().toString('hex');
	const bigIntHash = BigInt(`0x${hexHashRaw}`);


	if(isHex) {
		const hexHash = bigIntHash.toString('16');
		const hexHashPad = hexHash.padStart(10, '0');

		return hexHashPad;
	}


	return bigIntHash;
};



/**
 * @param {string} fileWAD
 * @param {RawExtractConfig[]} configsExtractRaw
 * @param {ExtractOption} [option={}]
 * @returns {Promise<ExtractConfig[]>}
 */
export const extractWAD = async (fileWAD, configsExtractRaw, option = {}) => {
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

			const bufferRaw = bifferExtract.slice(compressedSize);


			if(type == 0) {
				configExtract.buffer = bufferRaw;
			}
			else if(type == 1) {
				configExtract.buffer = gunzipSync(bufferRaw);
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				if(option.fileZSTD) {
					configExtract.buffer = await unzstd(bufferRaw, {
						fileZSTD: option.fileZSTD,
						maxBuffer: option.maxBufferUnzstd
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
