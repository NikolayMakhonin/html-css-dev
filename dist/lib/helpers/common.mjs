import { __awaiter } from 'tslib';
import path from 'path';
import fse from 'fs-extra';

function normalizePath(filepath) {
    return filepath.replace(/\\/g, '/');
}
function prepareGlobPatterns(inputDir, filesPatterns) {
    return filesPatterns.map(pattern => {
        return normalizePath(pattern.startsWith('!')
            ? '!' + path.resolve(inputDir, pattern.substring(1))
            : path.resolve(inputDir, pattern));
    });
}
function forEachParentDirs(dir, func) {
    let prevDir = normalizePath(dir);
    func(prevDir);
    let _dir = normalizePath(path.dirname(prevDir));
    while (_dir !== prevDir) {
        func(_dir);
        prevDir = _dir;
        _dir = normalizePath(path.dirname(prevDir));
    }
}
function getPathStat(filePath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const stat = yield fse.lstat(filePath);
            return stat;
        }
        catch (_a) {
            return null;
        }
    });
}
function dirIsEmpty(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const dirIter = yield fse.opendir(dir);
        const { done } = yield dirIter[Symbol.asyncIterator]().next();
        if (!done) {
            yield dirIter.close();
            return false;
        }
        return true;
    });
}
function removeEmptyDirs(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        const pathStat = yield getPathStat(dir);
        if (pathStat.isDirectory() && (yield dirIsEmpty(dir))) {
            try {
                yield fse.rmdir(dir, {
                    recursive: false,
                });
            }
            catch (err) {
                if (yield getPathStat(dir)) {
                    throw err;
                }
            }
            yield removeEmptyDirs(path.dirname(dir));
        }
    });
}
function removePath(_path) {
    return __awaiter(this, void 0, void 0, function* () {
        if (yield getPathStat(_path)) {
            yield fse.rm(_path, { recursive: true, force: true });
            yield removeEmptyDirs(path.dirname(_path));
            // await tryRun(5, 500, () => removeEmptyDirs(path.dirname(file)))
        }
    });
}
function getDirPaths(dir) {
    return __awaiter(this, void 0, void 0, function* () {
        function _getDirPaths(dir, dirs, files) {
            return __awaiter(this, void 0, void 0, function* () {
                const paths = yield fse.readdir(dir);
                yield Promise.all(paths.map((o) => __awaiter(this, void 0, void 0, function* () {
                    const subPath = normalizePath(path.join(dir, o));
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

export { dirIsEmpty, escapeRegExp, filePathWithoutExtension, forEachParentDirs, getDirPaths, getPathStat, normalizePath, prepareGlobPatterns, removeEmptyDirs, removePath };
