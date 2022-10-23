import { PostcssConfig } from "./contracts";
export declare type PrepareBuildFileOptionsArgs = {
    inputDir: string;
    outputDir: string;
    postcssConfig: PostcssConfig;
};
export declare type BuildFileOptions = {
    inputFile: string;
    outputFile: string;
    postcssConfig: PostcssConfig;
};
export declare function prepareBuildFileOptions(inputFile: string, { inputDir, outputDir, postcssConfig, }: PrepareBuildFileOptionsArgs): BuildFileOptions;
