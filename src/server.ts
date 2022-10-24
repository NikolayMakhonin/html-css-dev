/* eslint-disable @typescript-eslint/no-var-requires */
import express from 'express'
import path from 'path'
import fse from 'fs-extra'
import multimatch from 'multimatch'
import _liveReload from '@flemist/easy-livereload'
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
  rollupConfigPath: string,
  publicDir: string,
  rootDir: string,
  svelteRootUrl: string,
  svelteClientUrl: string,
  svelteServerDir: string,
  watchPatterns?: string[],
}

async function _startServer({
  port,
  liveReload,
  liveReloadPort,
  sourceMap,
  srcDir,
  rollupConfigPath,
  publicDir,
  rootDir,
  svelteRootUrl,
  svelteClientUrl,
  svelteServerDir,
  watchPatterns,
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
  })

  let rollupConfigs: RollupWatchOptions[]
  let rollupWatcher: RollupWatcherExt
  let rollupInput: string

  if (rollupConfigPath) {
    const result = await loadAndParseConfigFile(path.resolve(rollupConfigPath))
    rollupConfigs = result.options
  }

  console.debug('port=', port)
  console.debug('publicDir=', publicDir)
  console.debug('rootDir=', rootDir)

  const server = express()
  server.disable('x-powered-by')

  if (liveReload) {
    const liveReloadInstance = _liveReload({
      watchDirs: [publicDir, rootDir].filter(o => o),
      checkFunc: (file) => {
        if (multimatch([file], watchPatterns).length === 0) {
          return
        }
        console.log('[LiveReload] ' + file)
        return true
      },
      port: liveReloadPort,
    })
    server.use(liveReloadInstance)
  }

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

        const sourceFilePath = await resolveFilePath(path.resolve('.' + req.path))
        if (sourceFilePath) {
          if (svelteServerDir && /\.(svelte)$/.test(req.path)) {
            if (rollupInput !== sourceFilePath) {
              rollupInput = sourceFilePath
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
            await watcher.watchFiles({
              filesPatterns: [
                /\.p?css(\.map)?$/.test(req.path)
                  ? filePathWithoutExtension(sourceFilePath) + '.{pcss,css,css.map}'
                  : sourceFilePath,
              ],
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
            const Component = requireNoCache(filePath).default
            const { head, html } = Component.render()
            const clientJsHref = svelteClientUrl + urlPath + '.js'
            const clientCssHref = svelteClientUrl + urlPath + '.css'

            // noinspection NpmUsedModulesInstalled
            const responseHtml = `
<!DOCTYPE html>
<html lang="ru">
<head>
	<meta charset="UTF-8" />
	<title>HTML Dev</title>
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

	new Component({
	  target: document.body,
	  hydrate: true,
	});

	console.log('hydrated')
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

  server
    .listen(port, () => {
      console.log(`Server started: http://localhost:${port}/`)
    })
}

export function startServer(args: StartServerArgs & { baseConfig: Config }) {
  const options = createConfig(args.baseConfig, { server: args })
  return _startServer(options.server)
}
