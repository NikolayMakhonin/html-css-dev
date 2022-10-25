import path from 'path'
import {normalizePath} from 'src/helpers/common'
import {PostcssConfig} from 'src/contracts'

export type PrepareBuildFileOptionsArgs = {
  inputDir: string,
  outputDir: string,
  postcssConfig: PostcssConfig,
  baseUrl: string,
}

export type BuildFileOptions = {
  inputFile: string,
  outputFile: string,
  postcssConfig: PostcssConfig,
  baseUrl: string,
}

export function prepareBuildFileOptions(inputFile: string, {
  inputDir,
  outputDir,
  postcssConfig,
  baseUrl,
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
    baseUrl,
  }
}
