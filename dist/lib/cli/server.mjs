import { startServer } from '../server.mjs';
import 'tslib';
import 'express';
import 'express-async-errors';
import 'path';
import 'fs-extra';
import '../loadConfig.mjs';
import '../helpers/common.mjs';
import '../Watcher.mjs';
import '../prepareBuildFilesOptions.mjs';
import 'postcss-load-config';
import 'globby';
import 'multimatch';
import '../prepareBuildFileOptions.mjs';
import '../helpers/build.mjs';
import 'postcss';
import '@flemist/postcss-remove-global';
import 'node-watch';
import '../RollupWatcherController.mjs';
import '@flemist/async-utils';
import 'rollup';
import 'rollup/dist/loadConfigFile';

function startServerCli(options) {
    startServer(options)
        .catch(err => {
        console.error(err);
        // eslint-disable-next-line node/no-process-exit
        process.exit(1);
    });
}

export { startServerCli as default, startServerCli };
