export function hashWAD(string: string, isHex?: boolean | undefined): bigint;
export function extractWAD(fileWAD: string, configsExtractRaw: RawExtractConfig[]): Promise<ExtractConfig[]>;
export type RawExtractConfig = import("./bases.d.ts").RawExtractConfig;
export type ExtractConfig = import("./bases.d.ts").ExtractConfig;
