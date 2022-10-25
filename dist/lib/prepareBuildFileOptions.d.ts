import { PostcssConfig } from "./contracts";
export declare type PrepareBuildFileOptionsArgs = {
    inputDir: string;
    outputDir: string;
    postcssConfig: PostcssConfig;
    baseUrl: string;
};
export declare type BuildFileOptions = {
    inputFile: string;
    outputFile: string;
    postcssConfig: PostcssConfig;
    baseUrl: string;
};
export declare function prepareBuildFileOptions(inputFile: string, { inputDir, outputDir, postcssConfig, baseUrl, }: PrepareBuildFileOptionsArgs): BuildFileOptions;
