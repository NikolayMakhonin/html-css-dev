import {BuildFilesOptions} from 'src/prepareBuildFilesOptions'
import {
  forEachParentDirs,
  getDirPaths,
  getPathStat,
  normalizePath,
  pathStat,
  prepareGlobPatterns,
  removePath,
} from 'src/helpers'
import globby from 'globby'
import path from 'path'
import multimatch from 'multimatch'
import {prepareBuildFileOptions} from 'src/prepareBuildFileOptions'
import {watchFile} from 'src/build'
import nodeWatch from 'node-watch'

type NodeWatchEventType = 'update' | 'remove'
type NodeWatchEvent = {
	evt: NodeWatchEventType,
	path: string,
	patterns: string[],
}

export type WatchResult = {
  outputFiles: string[],
  dependencies?: string[],
}

export class Watcher {
  readonly options: Readonly<BuildFilesOptions>
  private readonly _allDependencies = new Map<string, Set<string>>()
  private readonly _dependants = new Map<string, Set<string>>()
  private readonly _watchers = new Map<string, WatchResult>()
  private readonly _dirs = new Set<string>()

  constructor(options: BuildFilesOptions) {
    this.options = options
  }

  private fileWatch(file: string) {
    const {
      inputDir,
      outputDir,
      postcssConfig,
    } = this.options

    const watcher = (async () => {
      const watcher: WatchResult = await watchFile(prepareBuildFileOptions(file, {
        inputDir,
        outputDir,
        postcssConfig,
      }))

      if (!watcher) {
        return
      }

      if (!watcher.dependencies) {
        watcher.dependencies = []
      }

      const newDependencies = watcher.dependencies && watcher.dependencies
        .reduce((a, file) => {
          a.add(file)
          forEachParentDirs(path.dirname(file), dir => {
            a.add(dir)
          })
          return a
        }, new Set<string>())


      // delete dependencies
      const oldDependencies = this._dependants.get(file)
      if (oldDependencies) {
        oldDependencies.forEach(o => {
          const _dependants = this._allDependencies.get(o)
          if (_dependants) {
            _dependants.delete(file)
            if (_dependants.size === 0) {
              this._allDependencies.delete(o)
            }
          }
        })
      }
      this._dependants.set(file, newDependencies)

      // add dependencies
      await Promise.all(Array.from(newDependencies.values()).map(async o => {
        if (!await pathStat(o)) {
          console.warn('Path not exist: ' + o)
        }
        let _dependants = this._allDependencies.get(o)
        if (!_dependants) {
          _dependants = new Set()
          this._allDependencies.set(o, _dependants)
        }
        _dependants.add(file)
      }))

      return watcher
    })()

    this._watchers[file] = watcher
    return watcher
  }

  private async fileUnwatch(file: string, remove?: boolean) {
    const watcher = this._watchers[file]
    this._watchers[file] = null
    // const watcher = await watcherPromise
    if (remove && watcher && watcher.outputFiles) {
      await Promise.all(watcher.outputFiles.map(removePath))
    }
  }

  private async onFileAdded(file: string) {
    try {
      if (this._watchers[file]) {
        return
      }
      if (await this.fileWatch(file)) {
        console.log('[Added]', file)
      }
      else {
        console.log('[Error]', file)
      }
    }
    catch (err) {
      console.error(err)
    }
  }

  private async updateDependants(_path: string, patterns: string[]) {
    // await Promise.all(
    // 	Array.from(this._watchers.values())
    // )

    const _dependants = this._allDependencies.get(_path)

    await Promise.all([
      ..._dependants && Array.from(_dependants.values()) || [],
      _path,
    ].map(async (file) => {
      if (multimatch([file], patterns).length === 0) {
        return
      }
      await this.fileUnwatch(file, true)
      console.log('[Deleted]', file)
      const stat = await getPathStat(file)
      if (stat && stat.isFile()) {
        await this.onFileAdded(file)
      }
    }))
  }

  private async onPathChanged(evt: NodeWatchEventType, _path: string, patterns: string[]) {
    console.log('onPathChanged', evt, _path)

    _path = normalizePath(_path)
    const pathAsDir = _path + '/'

    if (evt === 'remove') {
      const deletedDirs = []
      this._dirs.forEach(dir => {
        if (dir === _path || dir.startsWith(pathAsDir)) {
          deletedDirs.push(dir)
        }
      })
      deletedDirs.forEach(dir => {
        this._dirs.delete(dir)
      })

      await Promise.all(
        Array.from(this._watchers.keys()).map(async file => {
          if (file === _path || file.startsWith(pathAsDir)) {
            await this.fileUnwatch(file, true)
            console.log('[Deleted]', file)
          }
        }),
      )
      await this.updateDependants(_path, patterns)
      return
    }

    const pathStat = await getPathStat(_path)
    if (pathStat) {
      if (pathStat.isFile()) {
        await this.updateDependants(_path, patterns)
        if (multimatch([_path], patterns).length > 0) {
          await this.onFileAdded(_path)
        }
      }
      else if (!this._dirs.has(_path)) {
        // if (!dirs.has(_path)) {
        await this.updateDependants(_path, patterns)
        // }
        const paths = await getDirPaths(_path)
        // paths.dirs.forEach(o => {
        // 	dirs.add(o)
        // })
        const files = paths.files
          .filter(o => multimatch([o], patterns).length > 0)
        files.forEach(file => {
          forEachParentDirs(path.dirname(file), dir => {
            this._dirs.add(dir)
          })
        })
        await Promise.all(files.map(file => this.onFileAdded(file)))
      }
    }
  }

  private readonly _events: NodeWatchEvent[] = []
  private enqueueEvent(evt: NodeWatchEventType, path: string, patterns: string[]) {
    this._events.push({evt, path, patterns})
    void this.processEvents()
  }

  private processEventsRunning: boolean
  private async processEvents() {
    if (this.processEventsRunning) {
      return
    }
    this.processEventsRunning = true
    while (this._events.length > 0) {
      const {evt, path, patterns} = this._events.shift()
      try {
        await this.onPathChanged(evt, path, patterns)
      }
      catch (err) {
        console.error(err)
      }
    }
    this.processEventsRunning = false
  }

  async watchFiles({
    filesPatterns,
  }: {
    filesPatterns: string[],
  }) {
    const timeStart = Date.now()

    const {
      inputDir,
      watchDirs,
    } = this.options

    const patterns = prepareGlobPatterns(inputDir, filesPatterns)

    const inputFiles = await globby(patterns)

    inputFiles.forEach(file => {
      forEachParentDirs(path.dirname(file), dir => {
        this._dirs.add(dir)
      })
    })

    watchDirs.forEach(watchDir => {
      nodeWatch(watchDir, {
        recursive: true,
        delay    : 50,
      }, (evt, _path) => {
        this.enqueueEvent(evt, _path, patterns)
      })
    })

    let buildCount = 0
    let timePrev = 0
    function progress() {
      buildCount++
      const now = Date.now()
      if (now - timePrev > 1000 || buildCount === inputFiles.length) {
        timePrev = now
        console.log(`${Math.floor(buildCount / inputFiles.length * 100)}%`)
      }
    }

    await Promise.all(inputFiles.map(async file => {
      await this.fileWatch(normalizePath(file))
      progress()
    }))

    console.log(`watch started... ${Math.round((Date.now() - timeStart) / 1000)}s`)

    return async () => {
      await Promise.all(Array.from(this._watchers.keys()).map(file => {
        return this.fileUnwatch(file)
      }))
    }
  }
}

