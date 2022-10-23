import { startServer } from '../server.mjs';
import 'tslib';
import 'express';
import 'path';
import 'fs-extra';
import 'rollup';
import 'multimatch';
import '@flemist/easy-livereload';
import '../loadConfig.mjs';
import '../helpers/common.mjs';
import '../Watcher.mjs';
import '../prepareBuildFilesOptions.mjs';
import 'postcss-load-config';
import 'globby';
import '../prepareBuildFileOptions.mjs';
import '../helpers/build.mjs';
import 'postcss';
import '@flemist/postcss-remove-global';
import 'node-watch';
import '../buildRollup.mjs';
import '@flemist/async-utils';
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
