'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var path = require('path');
var helpers_common = require('./helpers/common.cjs');
require('tslib');
require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);

function prepareBuildFileOptions(inputFile, { inputDir, outputDir, postcssConfig, }) {
    const outputFile = helpers_common.normalizePath(path__default["default"].join(outputDir, path__default["default"].relative(inputDir, inputFile)));
    return {
        inputFile,
        outputFile,
        postcssConfig,
    };
}

exports.prepareBuildFileOptions = prepareBuildFileOptions;
