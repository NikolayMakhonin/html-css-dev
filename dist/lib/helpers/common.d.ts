/// <reference types="node" />
import fse from 'fs-extra';
export declare function normalizePath(filepath: string): string;
export declare function prepareGlobPatterns(inputDir: string, filesPatterns: string[]): string[];
export declare function forEachParentDirs(dir: string, func: (parentDir: string) => void): void;
export declare function getPathStat(filePath: string): Promise<fse.Stats>;
export declare function dirIsEmpty(dir: string): Promise<boolean>;
export declare function removeEmptyDirs(dir: string): Promise<void>;
export declare function removePath(_path: string): Promise<void>;
export declare function getDirPaths(dir: string): Promise<{
    dirs: string[];
    files: string[];
}>;
export declare function filePathWithoutExtension(filePath: string): string;
export declare function escapeRegExp(text: string): string;
