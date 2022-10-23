import { __awaiter } from 'tslib';
import path from 'path';
import { filePathWithoutExtension, escapeRegExp, normalizePath, getPathStat } from './common.mjs';
import fse from 'fs-extra';
import postcss from 'postcss';
import postcssRemoveGlobal from '@flemist/postcss-remove-global';

function buildCss({ inputFile, outputFile, postcssConfig, }) {
    return __awaiter(this, void 0, void 0, function* () {
        outputFile = filePathWithoutExtension(outputFile) + '.css';
        const outputFiles = [];
        function writeFile(file, content) {
            return __awaiter(this, void 0, void 0, function* () {
                try {
                    yield fse.writeFile(file, content);
                }
                catch (err) {
                    console.error(err);
                }
                outputFiles.push(file);
            });
        }
        try {
            const source = yield fse.readFile(inputFile, { encoding: 'utf-8' });
            const map = postcssConfig && postcssConfig.options && postcssConfig.options.map;
            const result = yield postcss([
                ...postcssConfig && postcssConfig.plugins,
                postcssRemoveGlobal(),
            ])
                .process(source, Object.assign(Object.assign({}, postcssConfig && postcssConfig.options), { map: map || { inline: false }, from: inputFile, to: outputFile }));
            result.css = result.css.replace(new RegExp(`\\burl\\((${escapeRegExp(path.resolve('.'))
                .replace(/[/\\]/, '[/\\\\]')}[/\\\\][^)]+)\\)`, 'g'), (_, assetPath) => {
                const relativeAssetPath = path.relative(path.resolve(path.dirname(outputFile)), path.resolve(assetPath)).replace(/\\/g, '/');
                return `url(${relativeAssetPath})`;
            });
            const resultMap = result.map && result.map.toJSON();
            const dependencies = resultMap.sources
                && resultMap.sources
                    .filter(o => !o.includes('<')) // exclude "<no source>" lines
                    .map(o => normalizePath(path.resolve(path.dirname(outputFile), o)))
                    .filter(o => o !== inputFile);
            yield fse.mkdirp(path.dirname(outputFile));
            yield Promise.all([
                writeFile(outputFile, result.css),
                map && result.map && writeFile(outputFile + '.map', result.map.toString()),
            ]);
            return {
                dependencies,
                outputFiles,
            };
        }
        catch (err) {
            console.error(err);
            return null;
        }
    });
}
function copyFile({ inputFile, outputFile }) {
    return __awaiter(this, void 0, void 0, function* () {
        yield fse.mkdirp(path.dirname(outputFile));
        yield fse.copy(inputFile, outputFile, {
            overwrite: true,
            preserveTimestamps: true,
        });
        return {
            outputFiles: [outputFile],
        };
    });
}
function buildFile({ inputFile, outputFile, postcssConfig }) {
    return __awaiter(this, void 0, void 0, function* () {
        outputFile = normalizePath(path.resolve(outputFile));
        if (yield getPathStat(outputFile)) {
            yield fse.rm(outputFile, { recursive: true, force: true });
        }
        const ext = (path.extname(inputFile) || '').toLowerCase();
        switch (ext) {
            case '.pcss':
                return buildCss({ inputFile, outputFile, postcssConfig });
            default:
                return copyFile({ inputFile, outputFile });
        }
    });
}
function watchFile(options) {
    return buildFile(options);
}

export { buildCss, buildFile, copyFile, watchFile };
