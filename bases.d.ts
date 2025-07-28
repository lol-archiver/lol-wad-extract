export type ExtractOption = {
	fileZSTD: string;
	maxBufferUnzstd?: number;
}

export type RawExtractConfig = {
	fileInpack: string;
	fileSave: string;
}

export type ExtractConfig = {
	fileInpack: string;
	fileSave: string;

	hashInpack?: string;
	buffer?: Buffer;
	saved?: boolean;
}
