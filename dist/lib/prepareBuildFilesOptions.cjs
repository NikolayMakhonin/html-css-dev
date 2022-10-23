'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var path = require('path');
var fse = require('fs-extra');
var postcssLoadConfig = require('postcss-load-config');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var postcssLoadConfig__default = /*#__PURE__*/_interopDefaultLegacy(postcssLoadConfig);

function prepareBuildFilesOptions({ inputDir, outputDir, watchDirs, sourceMap, clear, }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        inputDir = path__default["default"].resolve(inputDir);
        outputDir = path__default["default"].resolve(outputDir);
        const watchDirsSet = new Set(watchDirs && watchDirs.map(o => path__default["default"].resolve(o)) || []);
        watchDirsSet.add(inputDir);
        let postcssConfig;
        yield Promise.all([
            clear && fse__default["default"].rmdir(outputDir, { recursive: true })
                .catch(err => {
                console.error(err);
            }),
            (() => tslib.__awaiter(this, void 0, void 0, function* () {
                postcssConfig = yield postcssLoadConfig__default["default"]({
                    map: sourceMap === true ? { inline: false }
                        : sourceMap === 'inline' ? { inline: true }
                            : null,
                });
            }))(),
        ]);
        return {
            inputDir,
            outputDir,
            watchDirs: Array.from(watchDirsSet.values()),
            postcssConfig,
        };
    });
}

exports.prepareBuildFilesOptions = prepareBuildFilesOptions;
