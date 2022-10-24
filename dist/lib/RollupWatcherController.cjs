'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var asyncUtils = require('@flemist/async-utils');
var rollup = require('rollup');

function createRollupWatchAwaiter(watcher) {
    let waitPromise = new asyncUtils.CustomPromise();
    let timer;
    watcher.on('event', (event) => {
        if (timer) {
            clearTimeout(timer);
            timer = null;
        }
        if (waitPromise.state !== 'pending') {
            waitPromise = new asyncUtils.CustomPromise();
        }
        switch (event.code) {
            case 'START':
                break;
            case 'END':
                timer = setTimeout(() => {
                    waitPromise.resolve();
                }, 100);
                break;
            case 'ERROR':
                timer = setTimeout(() => {
                    waitPromise.reject(event.error);
                }, 100);
                break;
        }
    });
    return function wait() {
        return waitPromise.promise;
    };
}
function inputIsEmpty(input) {
    return !input
        || Array.isArray(input) && input.length === 0
        || typeof input === 'object' && Object.keys(input).length === 0;
}
function rollupConfigIsEmpty(config) {
    return !config || inputIsEmpty(config.input);
}
function rollupConfigsIsEmpty(configs) {
    if (!configs) {
        return true;
    }
    if (!Array.isArray(configs)) {
        return rollupConfigIsEmpty(configs);
    }
    return configs.every(rollupConfigIsEmpty);
}
function rollupWatch(configs) {
    if (rollupConfigsIsEmpty(configs)) {
        return null;
    }
    if (!Array.isArray(configs)) {
        configs = [configs];
    }
    const watcher = rollup.watch(configs);
    const wait = createRollupWatchAwaiter(this._watcher);
    return {
        watcher,
        wait,
    };
}

exports.rollupWatch = rollupWatch;
