import { openSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

import GZIP from 'node-gzip';
import ZSTD from 'node-zstandard';


import Biffer from '@nuogz/biffer';


const dirTemp = tmpdir();
const pathTempInputZSTD = resolve(dirTemp, 'lol-wad-extract-zstd-input');
const pathTempOutputZSTD = resolve(dirTemp, 'lol-wad-extract-zstd-output');

const unzstd = async (buffer, pathSave = pathTempOutputZSTD, returnBuffer = true) => {
	writeFileSync(pathTempInputZSTD, buffer);

	await new Promise((resolve, reject) =>
		ZSTD.decompress(pathTempInputZSTD, pathSave, err => err ? reject(err) : resolve())
	);

	if(returnBuffer) { return readFileSync(pathTempOutputZSTD); }
};

/**
 * A function to extract specified files from League of Legends WAD file.
 * @version 1.0.0-2022.02.04.01
 * @function
 */
const extractWAD = async (pathWAD, mapHash_File) => {
	const fdWAD = await openSync(pathWAD);

	const bifferWAD = new Biffer(fdWAD);

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

	const [entryCount] = bifferWAD.unpack('I');
	const result = {};

	for(let i = 0; i < entryCount; i++) {
		let hash, offset, size, type, compressedSize, duplicate, sha256;

		if(versionMajor == 1) {
			[hash, offset, compressedSize, size, type] = bifferWAD.unpack('QIIII');
		}
		else {
			// eslint-disable-next-line no-unused-vars
			[hash, offset, compressedSize, size, type, duplicate, , , sha256] = bifferWAD.unpack('QIIIBBBBQ');
		}


		if(!(hash in mapHash_File)) { continue; }

		const [typeSave, paramSave] = mapHash_File[hash].split('|');

		const bifferExtract = new Biffer(fdWAD);
		bifferExtract.seek(offset);

		const bufferRaw = bifferExtract.slice(compressedSize);

		if(typeSave == 'buffer') {
			if(type == 0) {
				result[hash] = bufferRaw;
			}
			else if(type == 1) {
				result[hash] = await GZIP.ungzip(bufferRaw);
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				result[hash] = await unzstd(bufferRaw);
			}
		}
		else if(typeSave == 'file') {
			result[hash] = paramSave;

			if(type == 0) {
				writeFileSync(paramSave, bufferRaw);
			}
			else if(type == 1) {
				writeFileSync(paramSave, await GZIP.ungzip(bufferRaw));
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				await unzstd(bufferRaw, paramSave, false);
			}
		}
	}

	return result;
};


export default extractWAD;