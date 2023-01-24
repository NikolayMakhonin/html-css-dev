/* eslint-disable @typescript-eslint/no-var-requires */
import type { Request, Response } from 'express'
import express from 'express'
import 'express-async-errors'
import path from 'path'
import fse from 'fs-extra'
// import multimatch from 'multimatch'
// import _liveReload from '@flemist/easy-livereload'
import {Config, createConfig} from './loadConfig'
import {filePathWithoutExtension, getPathStat} from 'src/helpers/common'
import {createWatcher} from 'src/Watcher'
import {SourceMapType} from 'src/prepareBuildFilesOptions'
import {rollupWatch, RollupWatcherExt} from 'src/RollupWatcherController'
import loadAndParseConfigFile from 'rollup/dist/loadConfigFile'
import type {RollupWatchOptions} from 'rollup'

function requireNoCache(module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}

export type StartServerArgs = {
  port: number,
  liveReload?: boolean,
  liveReloadPort?: number,
  sourceMap?: SourceMapType,
  srcDir: string,
  rollupConfigPaths: string[],
  publicDir: string,
  rootDir: string,
  svelteRootUrl: string,
  svelteClientUrl: string,
  svelteServerDir: string,
  watchPatterns?: string[],
  baseUrl?: string,
}

async function _startServer({
  port,
  liveReload,
  liveReloadPort,
  sourceMap,
  srcDir,
  rollupConfigPaths,
  publicDir,
  rootDir,
  svelteRootUrl,
  svelteClientUrl,
  svelteServerDir,
  watchPatterns,
  baseUrl,
}: StartServerArgs) {
  const unhandledErrorsCode = await fse.readFile(
    // eslint-disable-next-line node/no-missing-require
    require.resolve('@flemist/web-logger/unhandled-errors.min'),
    {encoding: 'utf-8'},
  )

  svelteRootUrl = svelteRootUrl?.replace(/\/+$/, '')
  rootDir = path.resolve(rootDir)
  publicDir = publicDir && path.resolve(publicDir)
  if (publicDir && !await getPathStat(publicDir)) {
    await fse.mkdirp(publicDir)
  }
  svelteServerDir = svelteServerDir && path.resolve(svelteServerDir)

  const watcher = await createWatcher({
    inputDir : srcDir,
    outputDir: path.join(publicDir, path.relative('.', srcDir)),
    sourceMap,
    clear    : false,
    watchDirs: [],
    baseUrl,
  })

  let rollupConfigs: RollupWatchOptions[]
  let rollupWatcher: RollupWatcherExt
  let rollupInput: string

  if (rollupConfigPaths) {
    const results = await Promise.all(rollupConfigPaths.map(rollupConfigPath => {
      return loadAndParseConfigFile(path.resolve(rollupConfigPath))
    }))
    rollupConfigs = results.flatMap(result => {
      return Array.isArray(result.options)
        ? result.options
        : [result.options]
    })
      .filter(o => o)
  }

  console.debug('port=', port)
  console.debug('publicDir=', publicDir)
  console.debug('rootDir=', rootDir)

  const server = express()
  server.disable('x-powered-by')

  // Temporary disabled because of "Denial of Service in ws" in the npm audit
  // if (liveReload) {
  //   const liveReloadInstance = _liveReload({
  //     watchDirs: [publicDir, rootDir].filter(o => o),
  //     checkFunc: (file) => {
  //       if (multimatch([file], watchPatterns).length === 0) {
  //         return
  //       }
  //       console.log('[LiveReload] ' + file)
  //       return true
  //     },
  //     port: liveReloadPort,
  //   })
  //   server.use(liveReloadInstance)
  // }

  async function fileExists(filePath) {
    if (!await getPathStat(filePath)) {
      return false
    }
    const stat = await fse.lstat(filePath)
    return stat.isFile()
  }

  const indexFiles = ['index.html', 'index.htm']

  server
    .use(
      '/',
      async function htmlDevMiddleware(req, res, next) {
        // liveReloadInstance(req, res, next);

        if (!publicDir) {
          next()
          return
        }

        const filePaths = []

        async function resolveFilePath(filePath) {
          let newFilePath = filePath
          let i = 0
          while (true) {
            filePaths.push(filePath)
            if (await fileExists(newFilePath)) {
              filePath = newFilePath
              return filePath
            }
            if (i >= indexFiles.length) {
              return null
            }
            newFilePath = path.join(filePath, indexFiles[i])
            i++
          }
        }

        const sourceFilePath = path.resolve('.' + req.path)
        const sourceFilePathResolved = await resolveFilePath(sourceFilePath)
        if (sourceFilePathResolved && svelteServerDir && /\.(svelte)$/.test(sourceFilePath)) {
          if (rollupInput !== sourceFilePathResolved) {
            rollupInput = sourceFilePathResolved
            if (rollupWatcher) {
              await rollupWatcher.watcher.close()
            }
            rollupWatcher = rollupWatch(rollupConfigs.map(config => ({
              ...config,
              input: rollupInput,
            })))
          }
          await rollupWatcher?.wait()
        }
        else {
          const filePattern = sourceFilePathResolved ? sourceFilePathResolved
            : /\.p?css(\.map)?$/.test(sourceFilePath) ? filePathWithoutExtension(sourceFilePath) + '.{pcss,css,css.map}'
              : null
          if (filePattern) {
            await watcher.watchFiles({
              filesPatterns: [filePattern],
            })
          }
        }

        // region Search svelte file

        if (svelteServerDir && /\.(svelte)$/.test(req.path)) {
          const _path = svelteRootUrl && (req.path.startsWith(svelteRootUrl + '/') || req.path === svelteRootUrl)
            ? req.path.substring(svelteRootUrl.length)
            : req.path

          const urlPath = _path.replace(/\.svelte$/, '')
          const filePath = path.resolve(svelteServerDir + urlPath + '.js')
          filePaths.push(filePath)

          if (await getPathStat(filePath)) {
            const { default: Component, preload } = requireNoCache(filePath)
            const props = typeof preload === 'function'
              ? await preload()
              : preload
            const propsJson = JSON.stringify(props)
            const { head, html } = Component.render(props)
            const clientJsHref = svelteClientUrl + urlPath + '.js'
            const clientCssHref = svelteClientUrl + urlPath + '.css'

            // noinspection NpmUsedModulesInstalled
            const responseHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8" />
	<title>~dev</title>
  <base href="${baseUrl || '/'}" />
	<!-- region preload -->
	<style>
		/* Hide page while loading css */
		body {
			display: none;
		}
	</style>
	<link rel="preload" href="${clientCssHref}" as="style">
	<!-- endregion -->
	
	<!-- region unhandled errors -->
	
	<script>${unhandledErrorsCode}</script>
	<script>
	try {
	  let url = ''
	  if (typeof location != 'undefined' && location.href) {
		url = document.location.href
	  } else if (document.location && document.location.href) {
		url = document.location.href
	  } else if (window.location && window.location.href) {
		url = window.location.href
	  } else if (document.URL) {
		url = document.URL
	  } else if (document.documentURI) {
		url = document.documentURI
	  }
	  window.isDebug = /[?&]debug(=true)?(&|$)/.test(url + '')
	  window.UnhandledErrors.subscribeUnhandledErrors({
		alert: window.isDebug,
		catchConsoleLevels: window.isDebug && ['error', 'warn'],
		customLog: function(log) {
		  if (/Test error/.test(log)) {
			return true
		  }
		},
	  })
	  if (window.isDebug) {
		console.error('Test error')
	  }
	} catch (err) {
	  alert(err)
	}
	</script>
	
	<!-- endregion -->
	
	<!-- region load -->
	<style>
		@import '${clientCssHref}';
		/* Show page after css loaded */
		body {
			display: block;
		}
	</style>
	<!-- endregion -->
	${head}
</head>
<body>
${html}
<script type='module' defer>
	import Component from '${clientJsHref}';
  var props = ${propsJson};
  
  new Component({
	  target: document.body,
    hydrate: true,
    props,
  });
  
  console.log('hydrated');
</script>
</body>
</html>
`
            res.set('Cache-Control', 'no-store')
            res.send(responseHtml)
            return
          }
        }

        // endregion

        const buildFilePath = await resolveFilePath(path.resolve(publicDir + req.path))

        if (buildFilePath) {
          res.set('Cache-Control', 'no-store')
          res.sendFile(buildFilePath)
          return
        }

        res.status(404).send('Not Found:\r\n' + filePaths.join('\r\n'))
      },
    )
    // docs: https://expressjs.com/en/5x/api.html#description
    // Error-handling middleware always takes four arguments.
    // You must provide four arguments to identify it as an error-handling middleware function.
    // Even if you don’t need to use the next object, you must specify it to maintain the signature.
    .use((err: any, req: Request, res: Response, next: any) => {
      console.error(err)
      const errorStr = err instanceof Error ? err.stack || err.toString() : err + ''
      res.status(500).end(`<pre style="white-space: pre-wrap;">${errorStr}</pre>`)
    })

  server
    .listen(port, () => {
      console.log(`Server started: http://localhost:${port}/`)
    })
}

export function startServer(args: StartServerArgs & { baseConfig: Config }) {
  const options = createConfig(args.baseConfig, { server: args })
  return _startServer(options.server)
}
