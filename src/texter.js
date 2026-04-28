import { vof } from '@danor-lib/error';



const globalTop = globalThis ?? global;


const parseEnvironments = (env) => {
	/** @type {Object<string, string>} */
	const environments = {};

	try {
		const entries = [...new globalTop.URL(`https://world.peace?${env ?? ''}`).searchParams.entries()];

		for(const [key, value] of entries) { environments[key.toLowerCase()] = value; }
	}
	catch { void 0; }

	return environments;
};

const envHades = parseEnvironments(process.env?.DRENV_HADES);

const willStyle = envHades.style == 'true';
const isModeDynamic = envHades.modeStyle == 'dynamic';



const texterStill = {
	spawnError: (value) => `error while spawning zstd process, error: ${value}`,
	invalidString: (value) => `string argument must be of type string, value ${vof(value)}`,
	unusedExtractType: (type) => `found a unused extract type ${type}`,
};
const texterStyle = {
	spawnError: (value) => `error while spawning ~[zstd] process, error: ${value}`,
	invalidString: (value) => `~[string] argument must be of type string, value ${vof(value)}`,
	unusedExtractType: (type) => `found a unused ~[extract type] ${type}`,
};



export const T = !isModeDynamic
	? willStyle ? texterStyle : texterStill
	: Object.fromEntries(Object.keys(texterStyle)
		.map(key => (...args) => (parseEnvironments(process.env?.DRENV_HADES)?.style == 'true' ? texterStyle : texterStill)[key]?.(...args)));
