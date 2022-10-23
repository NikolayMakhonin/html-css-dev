import { PostcssConfig } from "../contracts";
export declare type BuildCssArgs = {
    inputFile: string;
    outputFile: string;
    postcssConfig: PostcssConfig;
};
export declare function buildCss({ inputFile, outputFile, postcssConfig, }: BuildCssArgs): Promise<{
    dependencies: string[];
    outputFiles: any[];
}>;
export declare function copyFile({ inputFile, outputFile }: {
    inputFile: any;
    outputFile: any;
}): Promise<{
    outputFiles: any[];
}>;
export declare function buildFile({ inputFile, outputFile, postcssConfig }: {
    inputFile: any;
    outputFile: any;
    postcssConfig: any;
}): Promise<{
    outputFiles: any[];
}>;
export declare function watchFile(options: any): Promise<{
    outputFiles: any[];
}>;
