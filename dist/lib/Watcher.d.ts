import { BuildFilesOptions, PrepareBuildFilesOptionsArgs } from "./prepareBuildFilesOptions";
export declare type WatchResult = {
    outputFiles: string[];
    dependencies?: string[];
    count?: number;
};
export declare class Watcher {
    readonly options: Readonly<BuildFilesOptions>;
    private readonly _allDependencies;
    private readonly _dependants;
    private readonly _watchers;
    private readonly _dirs;
    private readonly _patterns;
    constructor(options: BuildFilesOptions);
    private _initPromise;
    private init;
    private fileWatch;
    private fileUnwatch;
    private onFileAdded;
    private updateDependants;
    private onPathChanged;
    private readonly _events;
    private enqueueEvent;
    private processEventsRunning;
    private processEvents;
    watchFiles({ filesPatterns, }: {
        filesPatterns: string[];
    }): Promise<void>;
}
export declare function createWatcher(args: PrepareBuildFilesOptionsArgs): Promise<Watcher>;
