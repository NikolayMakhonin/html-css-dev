import { __awaiter } from 'tslib';
import express from 'express';
import path from 'path';
import fse from 'fs-extra';
import multimatch from 'multimatch';
import _liveReload from '@flemist/easy-livereload';
import { createConfig } from './loadConfig.mjs';
import { getPathStat, filePathWithoutExtension } from './helpers/common.mjs';
import { createWatcher } from './Watcher.mjs';
import { rollupWatch } from './RollupWatcherController.mjs';
import loadAndParseConfigFile from 'rollup/dist/loadConfigFile';
import './prepareBuildFilesOptions.mjs';
import 'postcss-load-config';
import 'globby';
import './prepareBuildFileOptions.mjs';
import './helpers/build.mjs';
import 'postcss';
import '@flemist/postcss-remove-global';
import 'node-watch';
import '@flemist/async-utils';
import 'rollup';

function requireNoCache(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}
function _startServer({ port, liveReload, liveReloadPort, sourceMap, srcDir, rollupConfigPath, publicDir, rootDir, svelteRootUrl, svelteClientUrl, svelteServerDir, watchPatterns, }) {
    return __awaiter(this, void 0, void 0, function* () {
        const unhandledErrorsCode = yield fse.readFile(
        // eslint-disable-next-line node/no-missing-require
        require.resolve('@flemist/web-logger/unhandled-errors.min'), { encoding: 'utf-8' });
        svelteRootUrl = svelteRootUrl === null || svelteRootUrl === void 0 ? void 0 : svelteRootUrl.replace(/\/+$/, '');
        rootDir = path.resolve(rootDir);
        publicDir = publicDir && path.resolve(publicDir);
        if (publicDir && !(yield getPathStat(publicDir))) {
            yield fse.mkdirp(publicDir);
        }
        svelteServerDir = svelteServerDir && path.resolve(svelteServerDir);
        const watcher = yield createWatcher({
            inputDir: srcDir,
            outputDir: path.join(publicDir, path.relative('.', srcDir)),
            sourceMap,
            clear: false,
            watchDirs: [],
        });
        let rollupConfigs;
        let rollupWatcher;
        let rollupInput;
        if (rollupConfigPath) {
            const result = yield loadAndParseConfigFile(path.resolve(rollupConfigPath));
            rollupConfigs = result.options;
        }
        console.debug('port=', port);
        console.debug('publicDir=', publicDir);
        console.debug('rootDir=', rootDir);
        const server = express();
        server.disable('x-powered-by');
        if (liveReload) {
            const liveReloadInstance = _liveReload({
                watchDirs: [publicDir, rootDir].filter(o => o),
                checkFunc: (file) => {
                    if (multimatch([file], watchPatterns).length === 0) {
                        return;
                    }
                    console.log('[LiveReload] ' + file);
                    return true;
                },
                port: liveReloadPort,
            });
            server.use(liveReloadInstance);
        }
        function fileExists(filePath) {
            return __awaiter(this, void 0, void 0, function* () {
                if (!(yield getPathStat(filePath))) {
                    return false;
                }
                const stat = yield fse.lstat(filePath);
                return stat.isFile();
            });
        }
        const indexFiles = ['index.html', 'index.htm'];
        server
            .use('/', function htmlDevMiddleware(req, res, next) {
            return __awaiter(this, void 0, void 0, function* () {
                // liveReloadInstance(req, res, next);
                if (!publicDir) {
                    next();
                    return;
                }
                const filePaths = [];
                function resolveFilePath(filePath) {
                    return __awaiter(this, void 0, void 0, function* () {
                        let newFilePath = filePath;
                        let i = 0;
                        while (true) {
                            filePaths.push(filePath);
                            if (yield fileExists(newFilePath)) {
                                filePath = newFilePath;
                                return filePath;
                            }
                            if (i >= indexFiles.length) {
                                return null;
                            }
                            newFilePath = path.join(filePath, indexFiles[i]);
                            i++;
                        }
                    });
                }
                const sourceFilePath = yield resolveFilePath(path.resolve('.' + req.path));
                if (sourceFilePath) {
                    if (svelteServerDir && /\.(svelte)$/.test(req.path)) {
                        if (rollupInput !== sourceFilePath) {
                            rollupInput = sourceFilePath;
                            if (rollupWatcher) {
                                yield rollupWatcher.watcher.close();
                            }
                            rollupWatcher = rollupWatch(rollupConfigs.map(config => (Object.assign(Object.assign({}, config), { input: rollupInput }))));
                        }
                        yield (rollupWatcher === null || rollupWatcher === void 0 ? void 0 : rollupWatcher.wait());
                    }
                    else {
                        yield watcher.watchFiles({
                            filesPatterns: [
                                /\.p?css(\.map)?$/.test(req.path)
                                    ? filePathWithoutExtension(sourceFilePath) + '.{pcss,css,css.map}'
                                    : sourceFilePath,
                            ],
                        });
                    }
                }
                // region Search svelte file
                if (svelteServerDir && /\.(svelte)$/.test(req.path)) {
                    const _path = svelteRootUrl && (req.path.startsWith(svelteRootUrl + '/') || req.path === svelteRootUrl)
                        ? req.path.substring(svelteRootUrl.length)
                        : req.path;
                    const urlPath = _path.replace(/\.svelte$/, '');
                    const filePath = path.resolve(svelteServerDir + urlPath + '.js');
                    filePaths.push(filePath);
                    if (yield getPathStat(filePath)) {
                        const Component = requireNoCache(filePath).default;
                        const { head, html } = Component.render();
                        const clientJsHref = svelteClientUrl + urlPath + '.js';
                        const clientCssHref = svelteClientUrl + urlPath + '.css';
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
`;
                        res.set('Cache-Control', 'no-store');
                        res.send(responseHtml);
                        return;
                    }
                }
                // endregion
                const buildFilePath = yield resolveFilePath(path.resolve(publicDir + req.path));
                if (buildFilePath) {
                    res.set('Cache-Control', 'no-store');
                    res.sendFile(buildFilePath);
                    return;
                }
                res.status(404).send('Not Found:\r\n' + filePaths.join('\r\n'));
            });
        });
        server
            .listen(port, () => {
            console.log(`Server started: http://localhost:${port}/`);
        });
    });
}
function startServer(args) {
    const options = createConfig(args.baseConfig, { server: args });
    return _startServer(options.server);
}

export { startServer };
