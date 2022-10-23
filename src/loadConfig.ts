import path from 'path'
import {PrepareBuildFilesOptionsArgs} from 'src/prepareBuildFilesOptions'
import {StartServerArgs} from 'src/server'

process.env.WEB_DEV = 'true'

export type Config = {
  build?: PrepareBuildFilesOptionsArgs,
  server?: StartServerArgs,
}

const _configDefault: Config = {
  build: {
    inputDir : void 0,
    outputDir: void 0,
  },
  server: {
    srcDir         : void 0,
    publicDir      : void 0,
    svelteRootUrl  : void 0,
    svelteServerDir: void 0,
    svelteClientUrl: void 0,
    port           : 3522,
    liveReload     : true,
    liveReloadPort : 34426,
    rootDir        : '.',
    watchPatterns  : ['**'],
  },
}

export function createConfig(
  baseConfig: Config,
  rewriteConfig: Config,
  configDefault?: Config,
): Config {
  baseConfig = typeof baseConfig === 'string'
    ? require(path.resolve(baseConfig))
    : baseConfig || {}

  return {
    build: {
      ..._configDefault?.build || {},
      ...configDefault?.build || {},
      ...baseConfig?.build || {},
      ...rewriteConfig?.build || {},
    } as any,
    server: {
      ..._configDefault?.server || {},
      ...configDefault?.server || {},
      ...baseConfig?.server || {},
      ...rewriteConfig?.server || {},
    } as any,
  }
}
