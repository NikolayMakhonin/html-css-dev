import 'express-async-errors';
import { Config } from './loadConfig';
import { SourceMapType } from "./prepareBuildFilesOptions";
export declare type StartServerArgs = {
    port: number;
    liveReload?: boolean;
    liveReloadPort?: number;
    sourceMap?: SourceMapType;
    srcDir: string;
    rollupConfigPath: string;
    publicDir: string;
    rootDir: string;
    svelteRootUrl: string;
    svelteClientUrl: string;
    svelteServerDir: string;
    watchPatterns?: string[];
    baseUrl?: string;
};
export declare function startServer(args: StartServerArgs & {
    baseConfig: Config;
}): Promise<void>;
