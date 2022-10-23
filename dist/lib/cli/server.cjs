'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var server = require('../server.cjs');
require('tslib');
require('express');
require('path');
require('fs-extra');
require('rollup');
require('multimatch');
require('@flemist/easy-livereload');
require('../loadConfig.cjs');
require('../helpers/common.cjs');
require('../Watcher.cjs');
require('../prepareBuildFilesOptions.cjs');
require('postcss-load-config');
require('globby');
require('../prepareBuildFileOptions.cjs');
require('../helpers/build.cjs');
require('postcss');
require('@flemist/postcss-remove-global');
require('node-watch');
require('../buildRollup.cjs');
require('@flemist/async-utils');
require('../importModule.cjs');
require('url');

function startServerCli(options) {
    server.startServer(options)
        .catch(err => {
        console.error(err);
        // eslint-disable-next-line node/no-process-exit
        process.exit(1);
    });
}

exports["default"] = startServerCli;
exports.startServerCli = startServerCli;
