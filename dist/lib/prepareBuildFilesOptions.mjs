import { __awaiter } from 'tslib';
import path from 'path';
import fse from 'fs-extra';
import postcssLoadConfig from 'postcss-load-config';

function prepareBuildFilesOptions({ inputDir, outputDir, watchDirs, sourceMap, clear, }) {
    return __awaiter(this, void 0, void 0, function* () {
        inputDir = path.resolve(inputDir);
        outputDir = path.resolve(outputDir);
        const watchDirsSet = new Set(watchDirs && watchDirs.map(o => path.resolve(o)) || []);
        watchDirsSet.add(inputDir);
        let postcssConfig;
        yield Promise.all([
            clear && fse.rmdir(outputDir, { recursive: true })
                .catch(err => {
                console.error(err);
            }),
            (() => __awaiter(this, void 0, void 0, function* () {
                postcssConfig = yield postcssLoadConfig({
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

export { prepareBuildFilesOptions };
