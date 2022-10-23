import { __awaiter } from 'tslib';
import { prepareBuildFilesOptions } from './prepareBuildFilesOptions.mjs';
import globby from 'globby';
import { prepareBuildFileOptions } from './prepareBuildFileOptions.mjs';
import { buildFile } from './helpers/build.mjs';
import { Watcher } from './Watcher.mjs';
import { createConfig } from './loadConfig.mjs';
import { prepareGlobPatterns } from './helpers/common.mjs';
import 'path';
import 'fs-extra';
import 'postcss-load-config';
import 'postcss';
import '@flemist/postcss-remove-global';
import 'multimatch';
import 'node-watch';

function buildFiles({ inputDir, outputDir, filesPatterns, postcssConfig, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const patterns = prepareGlobPatterns(inputDir, filesPatterns);
        const inputFiles = yield globby(patterns);
        const buildOptions = inputFiles.map(pageFile => prepareBuildFileOptions(pageFile, {
            inputDir,
            outputDir,
            postcssConfig,
        }));
        yield Promise.all([
            ...buildOptions.map(buildFile),
        ]);
    });
}
function _build(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = yield prepareBuildFilesOptions(args);
        if (args.watch) {
            const watcher = new Watcher(options);
            return watcher.watchFiles({ filesPatterns: args.filesPatterns });
        }
        return buildFiles(Object.assign(Object.assign({}, options), { filesPatterns: args.filesPatterns }));
    });
}
function build(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const config = createConfig(args.baseConfig, { build: args });
        return _build(config.build);
    });
}

export { build, buildFiles };
