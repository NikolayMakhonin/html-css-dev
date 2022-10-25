import { PostcssConfig } from "./contracts";
export declare type SourceMapType = boolean | 'inline';
export declare type PrepareBuildFilesOptionsArgs = {
    inputDir: string;
    outputDir: string;
    watchDirs?: string[];
    sourceMap?: SourceMapType;
    clear?: boolean;
    baseUrl?: string;
};
export declare type BuildFilesOptions = {
    inputDir: string;
    outputDir: string;
    watchDirs: string[];
    postcssConfig: PostcssConfig;
    baseUrl: any;
};
export declare function prepareBuildFilesOptions({ inputDir, outputDir, watchDirs, sourceMap, clear, baseUrl, }: PrepareBuildFilesOptionsArgs): Promise<BuildFilesOptions>;
