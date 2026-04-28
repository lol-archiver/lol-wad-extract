# CHANGELOG

v4.1.0 - 2026.04.28 11
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
