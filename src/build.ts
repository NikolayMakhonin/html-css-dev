import {BuildFilesOptions, prepareBuildFilesOptions, PrepareBuildFilesOptionsArgs} from 'src/prepareBuildFilesOptions'
import globby from 'globby'
import {prepareBuildFileOptions} from 'src/prepareBuildFileOptions'
import {buildFile} from 'src/helpers/build'
import {Watcher} from 'src/Watcher'
import {createConfig} from './loadConfig'
import {prepareGlobPatterns} from 'src/helpers/common'

export async function buildFiles({
  inputDir,
  outputDir,
  filesPatterns,
  postcssConfig,
}: BuildFilesOptions & { filesPatterns: string[] }) {
  const patterns = prepareGlobPatterns(inputDir, filesPatterns)

  const inputFiles = await globby(patterns)

  const buildOptions = inputFiles.map(pageFile => prepareBuildFileOptions(pageFile, {
    inputDir,
    outputDir,
    postcssConfig,
  }))

  await Promise.all([
    ...buildOptions.map(buildFile),
  ])
}

type BuildArgs = PrepareBuildFilesOptionsArgs & {
  baseConfig: any,
  filesPatterns: string[],
  watch: boolean,
}

async function _build(args: BuildArgs) {
  const options = await prepareBuildFilesOptions(args)
  if (args.watch) {
    const watcher = new Watcher(options)
    return watcher.watchFiles({filesPatterns: args.filesPatterns})
  }
  return buildFiles({...options, filesPatterns: args.filesPatterns})
}

export async function build(args: BuildArgs) {
  const config = createConfig(args.baseConfig, { build: args })
  return _build(config.build)
}
