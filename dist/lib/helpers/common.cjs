'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var path = require('path');
var fse = require('fs-extra');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);

function normalizePath(filepath) {
    return filepath.replace(/\\/g, '/');
}
function prepareGlobPatterns(inputDir, filesPatterns) {
    return filesPatterns.map(pattern => {
        return normalizePath(pattern.startsWith('!')
            ? '!' + path__default["default"].resolve(inputDir, pattern.substring(1))
            : path__default["default"].resolve(inputDir, pattern));
    });
}
function forEachParentDirs(dir, func) {
    let prevDir = normalizePath(dir);
    func(prevDir);
    let _dir = normalizePath(path__default["default"].dirname(prevDir));
    while (_dir !== prevDir) {
        func(_dir);
        prevDir = _dir;
        _dir = normalizePath(path__default["default"].dirname(prevDir));
    }
}
function getPathStat(filePath) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield fse__default["default"].lstat(filePath);
            return stat;
        }
        catch (_a) {
            return null;
        }
    });
}
function dirIsEmpty(dir) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const dirIter = yield fse__default["default"].opendir(dir);
        const { done } = yield dirIter[Symbol.asyncIterator]().next();
        if (!done) {
            yield dirIter.close();
            return false;
        }
        return true;
    });
}
function removeEmptyDirs(dir) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const pathStat = yield getPathStat(dir);
        if (pathStat.isDirectory() && (yield dirIsEmpty(dir))) {
            try {
                yield fse__default["default"].rmdir(dir, {
                    recursive: false,
                });
            }
            catch (err) {
                if (yield getPathStat(dir)) {
                    throw err;
                }
            }
            yield removeEmptyDirs(path__default["default"].dirname(dir));
        }
    });
}
function removePath(_path) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        if (yield getPathStat(_path)) {
            yield fse__default["default"].rm(_path, { recursive: true, force: true });
            yield removeEmptyDirs(path__default["default"].dirname(_path));
            // await tryRun(5, 500, () => removeEmptyDirs(path.dirname(file)))
        }
    });
}
function getDirPaths(dir) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        function _getDirPaths(dir, dirs, files) {
            return tslib.__awaiter(this, void 0, void 0, function* () {
                const paths = yield fse__default["default"].readdir(dir);
                yield Promise.all(paths.map((o) => tslib.__awaiter(this, void 0, void 0, function* () {
                    const subPath = normalizePath(path__default["default"].join(dir, o));
                    const stat = yield getPathStat(subPath);
                    if (stat.isFile()) {
                        files.push(subPath);
                    }
                    else if (stat.isDirectory()) {
                        dirs.push(subPath);
                        yield _getDirPaths(subPath, dirs, files);
                    }
                })));
                return files;
            });
        }
        const dirs = [];
        const files = [];
        yield _getDirPaths(dir, dirs, files);
        return {
            dirs,
            files,
        };
    });
}
function filePathWithoutExtension(filePath) {
    return filePath.match(/^(.+?)(\.\w+)?$/)[1];
}
function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.dirIsEmpty = dirIsEmpty;
exports.escapeRegExp = escapeRegExp;
exports.filePathWithoutExtension = filePathWithoutExtension;
exports.forEachParentDirs = forEachParentDirs;
exports.getDirPaths = getDirPaths;
exports.getPathStat = getPathStat;
exports.normalizePath = normalizePath;
exports.prepareGlobPatterns = prepareGlobPatterns;
exports.removeEmptyDirs = removeEmptyDirs;
exports.removePath = removePath;
