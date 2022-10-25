'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var path = require('path');
var helpers_common = require('./common.cjs');
var fse = require('fs-extra');
var postcss = require('postcss');
var postcssRemoveGlobal = require('@flemist/postcss-remove-global');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var postcss__default = /*#__PURE__*/_interopDefaultLegacy(postcss);
var postcssRemoveGlobal__default = /*#__PURE__*/_interopDefaultLegacy(postcssRemoveGlobal);

function buildCss({ inputFile, outputFile, postcssConfig, }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        outputFile = helpers_common.filePathWithoutExtension(outputFile) + '.css';
        const outputFiles = [];
        function writeFile(file, content) {
            return tslib.__awaiter(this, void 0, void 0, function* () {
                try {
                    yield fse__default["default"].writeFile(file, content, { encoding: 'utf-8' });
                }
                catch (err) {
                    console.error(err);
                }
                outputFiles.push(file);
            });
        }
        try {
            const source = yield fse__default["default"].readFile(inputFile, { encoding: 'utf-8' });
            const map = postcssConfig && postcssConfig.options && postcssConfig.options.map;
            const result = yield postcss__default["default"]([
                ...postcssConfig && postcssConfig.plugins,
                postcssRemoveGlobal__default["default"](),
            ])
                .process(source, Object.assign(Object.assign({}, postcssConfig && postcssConfig.options), { map: map || { inline: false }, from: inputFile, to: outputFile }));
            result.css = result.css.replace(new RegExp(`\\burl\\((${helpers_common.escapeRegExp(path__default["default"].resolve('.'))
                .replace(/[/\\]/, '[/\\\\]')}[/\\\\][^)]+)\\)`, 'g'), (_, assetPath) => {
                const relativeAssetPath = path__default["default"].relative(path__default["default"].resolve(path__default["default"].dirname(outputFile)), path__default["default"].resolve(assetPath)).replace(/\\/g, '/');
                return `url(${relativeAssetPath})`;
            });
            const resultMap = result.map && result.map.toJSON();
            const dependencies = resultMap.sources
                && resultMap.sources
                    .filter(o => !o.includes('<')) // exclude "<no source>" lines
                    .map(o => helpers_common.normalizePath(path__default["default"].resolve(path__default["default"].dirname(outputFile), o)))
                    .filter(o => o !== inputFile);
            yield fse__default["default"].mkdirp(path__default["default"].dirname(outputFile));
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
function buildHtml({ inputFile, outputFile, baseUrl }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        yield fse__default["default"].mkdirp(path__default["default"].dirname(outputFile));
        try {
            let html = yield fse__default["default"].readFile(inputFile, { encoding: 'utf-8' });
            if (!/<html\b/i.test(html)) {
                html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
	<title>~dev</title>
  <base href="${baseUrl || '/'}" />
</head>
<body>
${html}
</body>
</html>
`;
            }
            yield fse__default["default"].mkdirp(path__default["default"].dirname(outputFile));
            yield fse__default["default"].writeFile(outputFile, html, { encoding: 'utf-8' });
        }
        catch (err) {
            console.error(err);
            return null;
        }
        yield fse__default["default"].copy(inputFile, outputFile, {
            overwrite: true,
            preserveTimestamps: true,
        });
        return {
            outputFiles: [outputFile],
        };
    });
}
function copyFile({ inputFile, outputFile }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        yield fse__default["default"].mkdirp(path__default["default"].dirname(outputFile));
        yield fse__default["default"].copy(inputFile, outputFile, {
            overwrite: true,
            preserveTimestamps: true,
        });
        return {
            outputFiles: [outputFile],
        };
    });
}
function buildFile({ inputFile, outputFile, postcssConfig, baseUrl }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        outputFile = helpers_common.normalizePath(path__default["default"].resolve(outputFile));
        if (yield helpers_common.getPathStat(outputFile)) {
            yield fse__default["default"].rm(outputFile, { recursive: true, force: true });
        }
        const ext = (path__default["default"].extname(inputFile) || '').toLowerCase();
        switch (ext) {
            case '.pcss':
                return buildCss({ inputFile, outputFile, postcssConfig });
            case '.htm':
            case '.html':
                return buildHtml({ inputFile, outputFile, baseUrl });
            default:
                return copyFile({ inputFile, outputFile });
        }
    });
}
function watchFile(options) {
    return buildFile(options);
}

exports.buildCss = buildCss;
exports.buildFile = buildFile;
exports.buildHtml = buildHtml;
exports.copyFile = copyFile;
exports.watchFile = watchFile;
