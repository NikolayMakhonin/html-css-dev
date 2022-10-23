import path from 'path'
import {normalizePath} from 'src/helpers/helpers'
import {PostcssConfig} from 'src/contracts'

export type PrepareBuildFileOptionsArgs = {
  inputDir: string,
  outputDir: string,
  postcssConfig: PostcssConfig,
}

export type BuildFileOptions = {
  inputFile: string,
  outputFile: string,
  postcssConfig: PostcssConfig,
}

export function prepareBuildFileOptions(inputFile: string, {
  inputDir,
  outputDir,
  postcssConfig,
}: PrepareBuildFileOptionsArgs): BuildFileOptions {
  const outputFile = normalizePath(
    path.join(
      outputDir,
      path.relative(inputDir, inputFile),
    ),
  )

  return {
    inputFile,
    outputFile,
    postcssConfig,
  }
}
