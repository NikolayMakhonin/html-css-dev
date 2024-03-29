import { __awaiter } from 'tslib';
import { prepareBuildFilesOptions } from './prepareBuildFilesOptions.mjs';
import { forEachParentDirs, getPathStat, removePath, normalizePath, getDirPaths, prepareGlobPatterns } from './helpers/common.mjs';
import globby from 'globby';
import path from 'path';
import multimatch from 'multimatch';
import { prepareBuildFileOptions } from './prepareBuildFileOptions.mjs';
import { watchFile } from './helpers/build.mjs';
import nodeWatch from 'node-watch';
import 'fs-extra';
import 'postcss-load-config';
import 'postcss';
import '@flemist/postcss-remove-global';

class Watcher {
    constructor(options) {
        this._allDependencies = new Map();
        this._dependants = new Map();
        this._watchers = new Map();
        this._dirs = new Set();
        this._patterns = new Set();
        this._events = [];
        this.options = options;
    }
    init() {
        if (!this._initPromise) {
            // eslint-disable-next-line @typescript-eslint/require-await
            this._initPromise = (() => __awaiter(this, void 0, void 0, function* () {
                this.options.watchDirs.forEach(watchDir => {
                    nodeWatch(watchDir, {
                        recursive: true,
                        delay: 50,
                    }, (evt, _path) => {
                        this.enqueueEvent(evt, _path);
                    });
                });
            }))();
        }
        return this._initPromise;
    }
    fileWatch(file) {
        let watcher = this._watchers[file];
        if (watcher) {
            watcher.count++;
            return;
        }
        const { inputDir, outputDir, postcssConfig, baseUrl, } = this.options;
        watcher = (() => __awaiter(this, void 0, void 0, function* () {
            const watcher = yield watchFile(prepareBuildFileOptions(file, {
                inputDir,
                outputDir,
                postcssConfig,
                baseUrl,
            }));
            if (!watcher) {
                return;
            }
            if (!watcher.dependencies) {
                watcher.dependencies = [];
            }
            if (!watcher.count) {
                watcher.count = 1;
            }
            const newDependencies = watcher.dependencies && watcher.dependencies
                .reduce((a, file) => {
                a.add(file);
                forEachParentDirs(path.dirname(file), dir => {
                    a.add(dir);
                });
                return a;
            }, new Set());
            // delete dependencies
            const oldDependencies = this._dependants.get(file);
            if (oldDependencies) {
                oldDependencies.forEach(o => {
                    const _dependants = this._allDependencies.get(o);
                    if (_dependants) {
                        _dependants.delete(file);
                        if (_dependants.size === 0) {
                            this._allDependencies.delete(o);
                        }
                    }
                });
            }
            this._dependants.set(file, newDependencies);
            // add dependencies
            yield Promise.all(Array.from(newDependencies.values()).map((o) => __awaiter(this, void 0, void 0, function* () {
                if (!(yield getPathStat(o))) {
                    console.warn('Path not exist: ' + o);
                }
                let _dependants = this._allDependencies.get(o);
                if (!_dependants) {
                    _dependants = new Set();
                    this._allDependencies.set(o, _dependants);
                }
                _dependants.add(file);
            })));
            return watcher;
        }))();
        this._watchers[file] = watcher;
        return watcher;
    }
    fileUnwatch(file, remove) {
        return __awaiter(this, void 0, void 0, function* () {
            const watcher = this._watchers[file];
            watcher.count--;
            if (watcher.count > 0) {
                return;
            }
            this._watchers[file] = null;
            // const watcher = await watcherPromise
            if (remove && watcher && watcher.outputFiles) {
                yield Promise.all(watcher.outputFiles.map(removePath));
                console.log('[Deleted]', file);
            }
        });
    }
    onFileAdded(file) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                if (this._watchers[file]) {
                    return;
                }
                if (yield this.fileWatch(file)) {
                    console.log('[Added]', file);
                }
                else {
                    console.log('[Error]', file);
                }
            }
            catch (err) {
                console.error(err);
            }
        });
    }
    updateDependants(_path) {
        return __awaiter(this, void 0, void 0, function* () {
            // await Promise.all(
            // 	Array.from(this._watchers.values())
            // )
            const _dependants = this._allDependencies.get(_path);
            yield Promise.all([
                ..._dependants && Array.from(_dependants.values()) || [],
                _path,
            ].map((file) => __awaiter(this, void 0, void 0, function* () {
                if (multimatch([file], Array.from(this._patterns.values())).length === 0) {
                    return;
                }
                yield this.fileUnwatch(file, true);
                console.log('[Deleted]', file);
                const stat = yield getPathStat(file);
                if (stat && stat.isFile()) {
                    yield this.onFileAdded(file);
                }
            })));
        });
    }
    onPathChanged(evt, _path) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('onPathChanged', evt, _path);
            _path = normalizePath(_path);
            const pathAsDir = _path + '/';
            if (evt === 'remove') {
                const deletedDirs = [];
                this._dirs.forEach(dir => {
                    if (dir === _path || dir.startsWith(pathAsDir)) {
                        deletedDirs.push(dir);
                    }
                });
                deletedDirs.forEach(dir => {
                    this._dirs.delete(dir);
                });
                yield Promise.all(Array.from(this._watchers.keys()).map((file) => __awaiter(this, void 0, void 0, function* () {
                    if (file === _path || file.startsWith(pathAsDir)) {
                        yield this.fileUnwatch(file, true);
                    }
                })));
                yield this.updateDependants(_path);
                return;
            }
            const pathStat = yield getPathStat(_path);
            if (pathStat) {
                if (pathStat.isFile()) {
                    yield this.updateDependants(_path);
                    if (multimatch([_path], Array.from(this._patterns.values())).length > 0) {
                        yield this.onFileAdded(_path);
                    }
                }
                else if (!this._dirs.has(_path)) {
                    // if (!dirs.has(_path)) {
                    yield this.updateDependants(_path);
                    // }
                    const paths = yield getDirPaths(_path);
                    // paths.dirs.forEach(o => {
                    // 	dirs.add(o)
                    // })
                    const files = paths.files
                        .filter(o => multimatch([o], Array.from(this._patterns.values())).length > 0);
                    files.forEach(file => {
                        forEachParentDirs(path.dirname(file), dir => {
                            this._dirs.add(dir);
                        });
                    });
                    yield Promise.all(files.map(file => this.onFileAdded(file)));
                }
            }
        });
    }
    enqueueEvent(evt, path) {
        this._events.push({ evt, path });
        void this.processEvents();
    }
    processEvents() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.processEventsRunning) {
                return;
            }
            this.processEventsRunning = true;
            while (this._events.length > 0) {
                const { evt, path } = this._events.shift();
                try {
                    yield this.onPathChanged(evt, path);
                }
                catch (err) {
                    console.error(err);
                }
            }
            this.processEventsRunning = false;
        });
    }
    watchFiles({ filesPatterns, }) {
        return __awaiter(this, void 0, void 0, function* () {
            const timeStart = Date.now();
            const { inputDir, } = this.options;
            const patterns = prepareGlobPatterns(inputDir, filesPatterns);
            patterns.forEach(pattern => {
                this._patterns.add(pattern);
            });
            yield this.init();
            const inputFiles = yield globby(patterns);
            inputFiles.forEach(file => {
                forEachParentDirs(path.dirname(file), dir => {
                    this._dirs.add(dir);
                });
            });
            let buildCount = 0;
            let timePrev = 0;
            function progress() {
                buildCount++;
                const now = Date.now();
                if (now - timePrev > 1000 || buildCount === inputFiles.length) {
                    timePrev = now;
                    console.log(`${Math.floor(buildCount / inputFiles.length * 100)}%`);
                }
            }
            yield Promise.all(inputFiles.map((file) => __awaiter(this, void 0, void 0, function* () {
                yield this.fileWatch(normalizePath(file));
                progress();
            })));
            console.log(`watch started... ${Math.round((Date.now() - timeStart) / 1000)}s`);
            // return async () => {
            //   await Promise.all(Array.from(this._watchers.keys()).map(file => {
            //     return this.fileUnwatch(file)
            //   }))
            // }
        });
    }
}
function createWatcher(args) {
    return __awaiter(this, void 0, void 0, function* () {
        const options = yield prepareBuildFilesOptions(args);
        return new Watcher(options);
    });
}

export { Watcher, createWatcher };
