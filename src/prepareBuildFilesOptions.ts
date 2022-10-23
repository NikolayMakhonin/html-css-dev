import path from 'path'
import fse from 'fs-extra'
import postcssLoadConfig from 'postcss-load-config'
import {PostcssConfig} from 'src/contracts'

export type SourceMapType = boolean | 'inline'

export type PrepareBuildFilesOptionsArgs = {
  inputDir: string,
  outputDir: string,
  watchDirs: string[],
  sourceMap: SourceMapType,
  clear: boolean,
}

export type BuildFilesOptions = {
  inputDir: string,
  outputDir: string,
  watchDirs: string[],
  postcssConfig: PostcssConfig,
}

export async function prepareBuildFilesOptions({
  inputDir,
  outputDir,
  watchDirs,
  sourceMap,
  clear,
}: PrepareBuildFilesOptionsArgs): Promise<BuildFilesOptions> {
  inputDir = path.resolve(inputDir)
  outputDir = path.resolve(outputDir)
  const watchDirsSet = new Set(watchDirs && watchDirs.map(o => path.resolve(o)) || [])
  watchDirsSet.add(inputDir)
  let postcssConfig: PostcssConfig

  await Promise.all([
    clear && fse.rmdir(outputDir, {recursive: true})
      .catch(err => {
        console.error(err)
      }),
    (async () => {
      postcssConfig = await postcssLoadConfig({
        map: sourceMap === true ? {inline: false}
          : sourceMap === 'inline' ? {inline: true}
            : null,
      })
    })(),
  ])

  return {
    inputDir,
    outputDir,
    watchDirs: Array.from(watchDirsSet.values()),
    postcssConfig,
  }
}

