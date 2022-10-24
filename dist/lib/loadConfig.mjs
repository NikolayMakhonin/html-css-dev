import path from 'path';

process.env.WEB_DEV = 'true';
const _configDefault = {
    build: {
        inputDir: void 0,
        outputDir: void 0,
        filesPatterns: [],
    },
    server: {
        srcDir: void 0,
        publicDir: void 0,
        svelteRootUrl: void 0,
        svelteServerDir: void 0,
        svelteClientUrl: void 0,
        rollupConfigPath: void 0,
        port: 3522,
        liveReload: false,
        liveReloadPort: 34426,
        rootDir: '.',
        watchPatterns: ['**'],
    },
};
function createConfig(baseConfig, rewriteConfig, configDefault) {
    baseConfig = typeof baseConfig === 'string'
        ? require(path.resolve(baseConfig))
        : baseConfig || {};
    return {
        build: Object.assign(Object.assign(Object.assign(Object.assign({}, (_configDefault === null || _configDefault === void 0 ? void 0 : _configDefault.build) || {}), (configDefault === null || configDefault === void 0 ? void 0 : configDefault.build) || {}), (baseConfig === null || baseConfig === void 0 ? void 0 : baseConfig.build) || {}), (rewriteConfig === null || rewriteConfig === void 0 ? void 0 : rewriteConfig.build) || {}),
        server: Object.assign(Object.assign(Object.assign(Object.assign({}, (_configDefault === null || _configDefault === void 0 ? void 0 : _configDefault.server) || {}), (configDefault === null || configDefault === void 0 ? void 0 : configDefault.server) || {}), (baseConfig === null || baseConfig === void 0 ? void 0 : baseConfig.server) || {}), (rewriteConfig === null || rewriteConfig === void 0 ? void 0 : rewriteConfig.server) || {}),
    };
}

export { createConfig };
