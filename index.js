import { closeSync, openSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

import GZIP from 'node-gzip';
import ZSTD from 'node-zstandard';
import XXHash from 'xxhashjs';

import Biffer from '@nuogz/biffer';


/** @typedef {import('./bases.d.ts').RawExtractConfig} RawExtractConfig */
/** @typedef {import('./bases.d.ts').ExtractConfig} ExtractConfig */



const dirTemp = tmpdir();
const fileTempInputZSTD = resolve(dirTemp, 'lol-wad-extract-zstd-input');
const fileTempOutputZSTD = resolve(dirTemp, 'lol-wad-extract-zstd-output');

const unzstd = async (buffer, fileSave = fileTempOutputZSTD, returnBuffer = true) => {
	writeFileSync(fileTempInputZSTD, buffer);

	await new Promise((resolver, rejecter) =>
		ZSTD.decompress(fileTempInputZSTD, fileSave, error => error ? rejecter(error) : resolver())
	);

	if(returnBuffer) { return readFileSync(fileTempOutputZSTD); }
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
 * @returns {Promise<ExtractConfig[]>}
 */
export const extractWAD = async (fileWAD, configsExtractRaw) => {
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
				configExtract.buffer = await GZIP.ungzip(bufferRaw);
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				configExtract.buffer = await unzstd(bufferRaw);
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
