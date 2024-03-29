import path from 'path'
import {PostcssConfig} from 'src/contracts'
import {escapeRegExp, filePathWithoutExtension, getPathStat, normalizePath} from 'src/helpers/common'
import fse from 'fs-extra'
import postcss from 'postcss'
import postcssRemoveGlobal from '@flemist/postcss-remove-global'

export type BuildCssArgs = {
  inputFile: string,
  outputFile: string,
  postcssConfig: PostcssConfig,
}

export async function buildCss({
  inputFile,
  outputFile,
  postcssConfig,
}: BuildCssArgs) {
  outputFile = filePathWithoutExtension(outputFile) + '.css'

  const outputFiles = []
  async function writeFile(file, content) {
    try {
      await fse.writeFile(file, content, { encoding: 'utf-8' })
    }
    catch (err) {
      console.error(err)
    }
    outputFiles.push(file)
  }

  try {
    const source = await fse.readFile(inputFile, { encoding: 'utf-8' })
    const map = postcssConfig && postcssConfig.options && postcssConfig.options.map

    const result = await postcss([
      ...postcssConfig && postcssConfig.plugins,
      postcssRemoveGlobal(),
    ])
      .process(source, {
        ...postcssConfig && postcssConfig.options,
        map : map || {inline: false},
        from: inputFile,
        to  : outputFile,
      })

    result.css = result.css.replace(
      new RegExp(`\\burl\\((${
        escapeRegExp(path.resolve('.'))
          .replace(/[/\\]/, '[/\\\\]')
      }[/\\\\][^)]+)\\)`, 'g'),
      (_, assetPath) => {
        const relativeAssetPath = path.relative(
          path.resolve(path.dirname(outputFile)),
          path.resolve(assetPath),
        ).replace(/\\/g, '/')
        return `url(${relativeAssetPath})`
      },
    )

    const resultMap = result.map && result.map.toJSON()
    const dependencies = resultMap.sources
      && resultMap.sources
        .filter(o => !o.includes('<')) // exclude "<no source>" lines
        .map(o => normalizePath(path.resolve(path.dirname(outputFile), o)))
        .filter(o => o !== inputFile)

    await fse.mkdirp(path.dirname(outputFile))

    await Promise.all([
      writeFile(outputFile, result.css),
      map && result.map && writeFile(outputFile + '.map', result.map.toString()),
    ])

    return {
      dependencies,
      outputFiles,
    }
  }
  catch (err) {
    console.error(err)
    return null
  }
}

export async function buildHtml({inputFile, outputFile, baseUrl}) {
  await fse.mkdirp(path.dirname(outputFile))

  try {
    let html = await fse.readFile(inputFile, {encoding: 'utf-8'})
    if (!/<html\b/i.test(html)) {
      html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
	<title>~dev</title>
  <base href="${baseUrl || '/'}" />
</head>
<body>
${html}
</body>
</html>
`
    }

    await fse.mkdirp(path.dirname(outputFile))

    await fse.writeFile(outputFile, html, { encoding: 'utf-8' })
  }
  catch (err) {
    console.error(err)
    return null
  }

  await fse.copy(inputFile, outputFile, {
    overwrite         : true,
    preserveTimestamps: true,
  })

  return {
    outputFiles: [outputFile],
  }
}

export async function copyFile({inputFile, outputFile}) {
  await fse.mkdirp(path.dirname(outputFile))

  await fse.copy(inputFile, outputFile, {
    overwrite         : true,
    preserveTimestamps: true,
  })

  return {
    outputFiles: [outputFile],
  }
}

export async function buildFile({inputFile, outputFile, postcssConfig, baseUrl}) {
  outputFile = normalizePath(path.resolve(outputFile))
  if (await getPathStat(outputFile)) {
    await fse.rm(outputFile, { recursive: true, force: true })
  }
  const ext = (path.extname(inputFile) || '').toLowerCase()
  switch (ext) {
    case '.pcss':
      return buildCss({inputFile, outputFile, postcssConfig})
    case '.htm':
    case '.html':
      return buildHtml({inputFile, outputFile, baseUrl})
    default:
      return copyFile({inputFile, outputFile})
  }
}

export function watchFile(options) {
  return buildFile(options)
}

