import { BuildFilesOptions, PrepareBuildFilesOptionsArgs } from "./prepareBuildFilesOptions";
import { Config } from './loadConfig';
export declare function buildFiles({ inputDir, outputDir, postcssConfig, baseUrl, filesPatterns, }: BuildFilesOptions & {
    filesPatterns: string[];
}): Promise<void>;
export declare type BuildArgs = PrepareBuildFilesOptionsArgs & {
    baseConfig?: Config;
    filesPatterns: string[];
    watch?: boolean;
};
export declare function build(args: BuildArgs): Promise<void>;
