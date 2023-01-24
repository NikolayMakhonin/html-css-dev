'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var server = require('../server.cjs');
require('tslib');
require('express');
require('express-async-errors');
require('path');
require('fs-extra');
require('../loadConfig.cjs');
require('../helpers/common.cjs');
require('../Watcher.cjs');
require('../prepareBuildFilesOptions.cjs');
require('postcss-load-config');
require('globby');
require('multimatch');
require('../prepareBuildFileOptions.cjs');
require('../helpers/build.cjs');
require('postcss');
require('@flemist/postcss-remove-global');
require('node-watch');
require('../RollupWatcherController.cjs');
require('@flemist/async-utils');
require('rollup');
require('rollup/dist/loadConfigFile');

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
