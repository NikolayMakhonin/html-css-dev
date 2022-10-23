import { StartServerArgs } from "./server";
import { BuildArgs } from "./build";
export declare type Config = {
    build?: BuildArgs;
    server?: StartServerArgs;
};
export declare function createConfig(baseConfig: Config, rewriteConfig: Config, configDefault?: Config): Config;
