import path from 'path';
import { normalizePath } from './helpers/common.mjs';
import 'tslib';
import 'fs-extra';

function prepareBuildFileOptions(inputFile, { inputDir, outputDir, postcssConfig, }) {
    const outputFile = normalizePath(path.join(outputDir, path.relative(inputDir, inputFile)));
    return {
        inputFile,
        outputFile,
        postcssConfig,
    };
}

export { prepareBuildFileOptions };
