import { build } from '../build.mjs';
import 'tslib';
import '../prepareBuildFilesOptions.mjs';
import 'path';
import 'fs-extra';
import 'postcss-load-config';
import 'globby';
import '../prepareBuildFileOptions.mjs';
import '../helpers/common.mjs';
import '../helpers/build.mjs';
import 'postcss';
import '@flemist/postcss-remove-global';
import '../Watcher.mjs';
import 'multimatch';
import 'node-watch';
import '../loadConfig.mjs';

function buildCli(options) {
    build(options)
        .catch(err => {
        console.error(err);
        // eslint-disable-next-line node/no-process-exit
        process.exit(1);
    });
}

export { buildCli, buildCli as default };
