import { PostcssConfig } from "./contracts";
export declare type SourceMapType = boolean | 'inline';
export declare type PrepareBuildFilesOptionsArgs = {
    inputDir: string;
    outputDir: string;
    watchDirs?: string[];
    sourceMap?: SourceMapType;
    clear?: boolean;
};
export declare type BuildFilesOptions = {
    inputDir: string;
    outputDir: string;
    watchDirs: string[];
    postcssConfig: PostcssConfig;
};
export declare function prepareBuildFilesOptions({ inputDir, outputDir, watchDirs, sourceMap, clear, }: PrepareBuildFilesOptionsArgs): Promise<BuildFilesOptions>;
