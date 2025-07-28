export function hashWAD(string: string, isHex?: boolean): bigint;
export function extractWAD(fileWAD: string, configsExtractRaw: RawExtractConfig[], option?: ExtractOption): Promise<ExtractConfig[]>;
export type ExtractOption = import("./bases.d.ts").ExtractOption;
export type RawExtractConfig = import("./bases.d.ts").RawExtractConfig;
export type ExtractConfig = import("./bases.d.ts").ExtractConfig;
