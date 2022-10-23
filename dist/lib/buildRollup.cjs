'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var asyncUtils = require('@flemist/async-utils');

// export function createRollupWatchAwaiter(config: RollupWatchOptions | RollupWatchOptions[]) {
//   const watcher = watch(config)
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
    return {
        wait() {
            return waitPromise.promise;
        },
    };
}

exports.createRollupWatchAwaiter = createRollupWatchAwaiter;
