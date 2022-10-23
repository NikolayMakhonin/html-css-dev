'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var build = require('../build.cjs');
require('tslib');
require('../prepareBuildFilesOptions.cjs');
require('path');
require('fs-extra');
require('postcss-load-config');
require('globby');
require('../prepareBuildFileOptions.cjs');
require('../helpers/common.cjs');
require('../helpers/build.cjs');
require('postcss');
require('@flemist/postcss-remove-global');
require('../Watcher.cjs');
require('multimatch');
require('node-watch');
require('../loadConfig.cjs');

function buildCli(options) {
    build.build(options)
        .catch(err => {
        console.error(err);
        // eslint-disable-next-line node/no-process-exit
        process.exit(1);
    });
}

exports.buildCli = buildCli;
exports["default"] = buildCli;
