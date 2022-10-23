'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var tslib = require('tslib');
var express = require('express');
var path = require('path');
var fse = require('fs-extra');
var multimatch = require('multimatch');
var _liveReload = require('@flemist/easy-livereload');
var loadConfig = require('./loadConfig.cjs');
var helpers_common = require('./helpers/common.cjs');
var Watcher = require('./Watcher.cjs');
require('./prepareBuildFilesOptions.cjs');
require('postcss-load-config');
require('globby');
require('./prepareBuildFileOptions.cjs');
require('./helpers/build.cjs');
require('postcss');
require('@flemist/postcss-remove-global');
require('node-watch');

function _interopDefaultLegacy (e) { return e && typeof e === 'object' && 'default' in e ? e : { 'default': e }; }

var express__default = /*#__PURE__*/_interopDefaultLegacy(express);
var path__default = /*#__PURE__*/_interopDefaultLegacy(path);
var fse__default = /*#__PURE__*/_interopDefaultLegacy(fse);
var multimatch__default = /*#__PURE__*/_interopDefaultLegacy(multimatch);
var _liveReload__default = /*#__PURE__*/_interopDefaultLegacy(_liveReload);

function requireNoCache(module) {
    delete require.cache[require.resolve(module)];
    return require(module);
}
function _startServer({ port, liveReload, liveReloadPort, sourceMap, srcDir, publicDir, rootDir, svelteRootUrl, svelteClientUrl, svelteServerDir, watchPatterns, }) {
    return tslib.__awaiter(this, void 0, void 0, function* () {
        const unhandledErrorsCode = yield fse__default["default"].readFile(
        // eslint-disable-next-line node/no-missing-require
        require.resolve('@flemist/web-logger/unhandled-errors.min'), { encoding: 'utf-8' });
        svelteRootUrl = svelteRootUrl === null || svelteRootUrl === void 0 ? void 0 : svelteRootUrl.replace(/\/+$/, '');
        rootDir = path__default["default"].resolve(rootDir);
        publicDir = publicDir && path__default["default"].resolve(publicDir);
        if (publicDir && !(yield helpers_common.getPathStat(publicDir))) {
            yield fse__default["default"].mkdirp(publicDir);
        }
        svelteServerDir = svelteServerDir && path__default["default"].resolve(svelteServerDir);
        const watcher = yield Watcher.createWatcher({
            inputDir: srcDir,
            outputDir: path__default["default"].join(publicDir, path__default["default"].relative('.', srcDir)),
            sourceMap,
            clear: false,
            watchDirs: [],
        });
        console.debug('port=', port);
        console.debug('publicDir=', publicDir);
        console.debug('rootDir=', rootDir);
        const server = express__default["default"]();
        server.disable('x-powered-by');
        if (liveReload) {
            const liveReloadInstance = _liveReload__default["default"]({
                watchDirs: [publicDir, rootDir].filter(o => o),
                checkFunc: (file) => {
                    if (multimatch__default["default"]([file], watchPatterns).length === 0) {
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
            return tslib.__awaiter(this, void 0, void 0, function* () {
                if (!(yield helpers_common.getPathStat(filePath))) {
                    return false;
                }
                const stat = yield fse__default["default"].lstat(filePath);
                return stat.isFile();
            });
        }
        const indexFiles = ['index.html', 'index.htm'];
        server
            .use('/', function htmlDevMiddleware(req, res, next) {
            return tslib.__awaiter(this, void 0, void 0, function* () {
                // liveReloadInstance(req, res, next);
                if (!publicDir) {
                    next();
                    return;
                }
                const filePaths = [];
                // region Search svelte file
                if (svelteServerDir && /\.(svelte)$/.test(req.path)) {
                    const _path = svelteRootUrl && (req.path.startsWith(svelteRootUrl + '/') || req.path === svelteRootUrl)
                        ? req.path.substring(svelteRootUrl.length)
                        : req.path;
                    const urlPath = _path.replace(/\.svelte$/, '');
                    const filePath = path__default["default"].resolve(svelteServerDir + urlPath + '.js');
                    filePaths.push(filePath);
                    if (yield helpers_common.getPathStat(filePath)) {
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
                const sourceFilePath = path__default["default"].resolve('.' + req.path);
                yield watcher.watchFiles({
                    filesPatterns: [
                        /\.p?css(\.map)?$/.test(req.path)
                            ? helpers_common.filePathWithoutExtension(sourceFilePath) + '.{pcss,css,css.map}'
                            : sourceFilePath,
                    ],
                });
                // region Search index files
                let filePath = path__default["default"].resolve(publicDir + req.path);
                let newFilePath = filePath;
                let i = 0;
                while (true) {
                    filePaths.push(filePath);
                    if (yield fileExists(newFilePath)) {
                        filePath = newFilePath;
                        res.set('Cache-Control', 'no-store');
                        res.sendFile(filePath);
                        return;
                    }
                    if (i >= indexFiles.length) {
                        res.status(404).send('Not Found:\r\n' + filePaths.join('\r\n'));
                        return;
                    }
                    newFilePath = path__default["default"].join(filePath, indexFiles[i]);
                    i++;
                }
                // endregion
            });
        });
        server
            .listen(port, () => {
            console.log(`Server started: http://localhost:${port}/`);
        });
    });
}
function startServer(args) {
    const options = loadConfig.createConfig(args.baseConfig, { server: args });
    return _startServer(options.server);
}

exports.startServer = startServer;
