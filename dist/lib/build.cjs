'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var prepareBuildFilesOptions = require('./prepareBuildFilesOptions.cjs');
var globby = require('globby');
var prepareBuildFileOptions = require('./prepareBuildFileOptions.cjs');
var helpers_build = require('./helpers/build.cjs');
var Watcher = require('./Watcher.cjs');
var loadConfig = require('./loadConfig.cjs');
var helpers_common = require('./helpers/common.cjs');
require('path');
require('fs-extra');
require('postcss-load-config');
require('postcss');
require('@flemist/postcss-remove-global');
require('multimatch');
require('node-watch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var globby__default = /*#__PURE__*/_interopDefaultLegacy(globby);

function buildFiles({ inputDir, outputDir, filesPatterns, postcssConfig, }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const patterns = helpers_common.prepareGlobPatterns(inputDir, filesPatterns);
        const inputFiles = yield globby__default["default"](patterns);
        const buildOptions = inputFiles.map(pageFile => prepareBuildFileOptions.prepareBuildFileOptions(pageFile, {
            inputDir,
            outputDir,
            postcssConfig,
        }));
        yield Promise.all([
            ...buildOptions.map(helpers_build.buildFile),
        ]);
    });
}
function _build(args) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const options = yield prepareBuildFilesOptions.prepareBuildFilesOptions(args);
        if (args.watch) {
            const watcher = new Watcher.Watcher(options);
            return watcher.watchFiles({ filesPatterns: args.filesPatterns });
        }
        return buildFiles(Object.assign(Object.assign({}, options), { filesPatterns: args.filesPatterns }));
    });
}
function build(args) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const config = loadConfig.createConfig(args.baseConfig, { build: args });
        return _build(config.build);
    });
}

exports.build = build;
exports.buildFiles = buildFiles;
