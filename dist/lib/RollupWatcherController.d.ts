import type { RollupWatcher, RollupWatchOptions } from 'rollup';
export declare type RollupWatcherExt = {
    watcher: RollupWatcher;
    wait(): Promise<void>;
};
export declare function rollupWatch(configs: RollupWatchOptions | RollupWatchOptions[]): {
    watcher: RollupWatcher;
    wait: () => Promise<void>;
};
