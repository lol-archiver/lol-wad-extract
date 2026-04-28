/** Options for extraction process */
export type ExtractOption = {
	/** Path to the ZSTD compressed file */
	fileZSTD: string;

	/** Maximum buffer size for unzstd operation */
	maxBufferUnzstd?: number;
};

/** Raw configuration for extraction */
export type RawExtractConfig = {
	/** Path to the input pack file */
	fileInpack: string;

	/** Path to save the extracted file */
	fileSave: string;
};

/** Configuration for extraction */
export type ExtractConfig = {
	/** Path to the input pack file */
	fileInpack: string;

	/** Path to save the extracted file */
	fileSave: string;


	/** Hash of the input pack file */
	hashInpack?: string;

	/** Buffer containing the extracted data */
	buffer?: Buffer;

	/** Indicates if the file has been saved */
	saved?: boolean;
};
