import type { RollupWatcher } from 'rollup';
export declare type RollupWatcherAwaiter = {
    wait(): Promise<void>;
};
export declare function createRollupWatchAwaiter(watcher: RollupWatcher): RollupWatcherAwaiter;
