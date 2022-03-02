import { closeSync, openSync, readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { tmpdir } from 'os';

import GZIP from 'node-gzip';
import ZSTD from 'node-zstandard';
import XXHash from 'xxhashjs';


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


export const hashWAD = function(string, isHex = false) {
	if(typeof string != 'string') { throw 'argv not String'; }

	const stringLower = string.toLowerCase();
	const bufferString = Buffer.from(stringLower);
	const bufferHash = Buffer.from(XXHash.h64(bufferString, 0).toString(16).padStart(16, '0').split(/(?<=^(?:.{2})+)(?!$)/).reverse().map(a => Number(`0x${a}`)));
	const hexHashRaw = bufferHash.swap64().toString('hex');
	const bntHash = BigInt(`0x${hexHashRaw}`);

	if(isHex) {
		const hexHash = bntHash.toString('16').toUpperCase();
		const hexHashPad = hexHash.padStart(10, '0');

		return hexHashPad;
	}

	return bntHash;
};


/**
 * A function to extract specified files from League of Legends WAD file.
 * @version 1.2.2-2022.03.02.02
 * @function
 */
export const extractWAD = async (pathWAD, infosExtractRaw, typeKey = 'ingame') => {
	const infosExtract = Object.entries(infosExtractRaw)
		.reduce((infosExtract, [pathIngame, infoSaveRaw]) => {
			infosExtract[hashWAD(pathIngame)] = {
				pathIngame,
				infoSaveRaw
			};

			return infosExtract;
		}, {});



	const fdWAD = openSync(pathWAD);

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


		if(!(hash in infosExtract)) { continue; }


		const { pathIngame, infoSaveRaw } = infosExtract[hash];

		let [typeSave, keySave, pathSave] = infoSaveRaw.split('|');

		if(!keySave) { keySave = typeKey == 'ingame' ? pathIngame : hash; }
		else if(keySave == '{hash}') { keySave = hash; }
		else if(keySave == '{ingame}') { keySave = pathIngame; }

		const bifferExtract = new Biffer(fdWAD);
		bifferExtract.seek(offset);

		const bufferRaw = bifferExtract.slice(compressedSize);


		if(typeSave == 'buffer') {
			if(type == 0) {
				result[keySave] = bufferRaw;
			}
			else if(type == 1) {
				result[keySave] = await GZIP.ungzip(bufferRaw);
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				result[keySave] = await unzstd(bufferRaw);
			}
		}
		else if(typeSave == 'file') {
			result[keySave] = pathSave;

			if(type == 0) {
				writeFileSync(pathSave, bufferRaw);
			}
			else if(type == 1) {
				writeFileSync(pathSave, await GZIP.ungzip(bufferRaw));
			}
			else if(type == 2) {
				throw Error('unused extract type');
			}
			else if(type == 3) {
				await unzstd(bufferRaw, pathSave, false);
			}
		}
	}

	closeSync(fdWAD);

	return result;
};