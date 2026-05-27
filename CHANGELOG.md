# CHANGELOG

## v4.2.0 - 2026.05.27 14
* docs: **IMPORTANT!** update license to ***MIT***
* refactor!: due to a change in design philosophy, remove all error message text
  * in my design philosophy, an error should only contain a code and associated data. text-based message should be rendered by the terminal (including i18n and terminal highlighting)
* regular!: bump up Node.js requirement to `>=26`
  * this requirement does not mean the library cannot run on older versions of Node.js. it only indicates the major version I am currently using
* docs: add error code reference table
* improve: standardize the `at` value of RichError thrown in code
* regular: update enviroment
* regular: bump up dependencies
  * bump up `@danor-lib/error` to `v2.x`


## v4.1.0 - 2026.04.28 11
* feat: add a hash pool in `hashWAD()` to reduce redundant hash computations
* docs: completely rewrite README with detailed API documentation
* refactor: refactor error handling with `@danor-lib/error`
* feat: add `src/texter.js` for styled error messages
* regular: update enviroment
* regular: bump up dependencies
  * new dependency `@danor-lib/error`
  * use `@danor-lib/biffer` instead `@nuogz/biffer`
  * update eslint majar version to `10`


## v4.0.0 - 2025.07.28 20
* refactor: fully embrace `node:zlib` for decompress gzip datas and zstandard datas
* refactor: remove old dependencies `node-gzip` and `node-zstandard`
* feat: `extractWAD()` has a third parameter `option`.
  * By passing `option.fileZSTD`, the function will use the external ZSTD via spawn
  * By passing `option.maxBufferUnzstd`, option `maxBuffer` when spawning the external ZSTD
* docs: update types
* chore: improve enviroment
* chore: bump up dependencies


## v3.0.0 - 2024.11.11 18
* refactor: improve code logic and style
* deps: bump up dependencies
* docs: add types
* chore: renew develop environments


## v2.0.0 - 2022.08.31 17
* tweak all files for publishing to npm
* start use `CHANGLOG.md` since version `v2.0.0`
