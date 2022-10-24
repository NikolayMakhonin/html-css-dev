import type {RollupWatcher, RollupWatchOptions, InputOption} from 'rollup'
import {CustomPromise} from '@flemist/async-utils'
import {watch} from 'rollup'

export type RollupWatcherAwaiter = {
  wait(): Promise<void>
}

// export function createRollupWatchAwaiter(config: RollupWatchOptions | RollupWatchOptions[]) {
//   const watcher = watch(config)
function createRollupWatchAwaiter(watcher: RollupWatcher): RollupWatcherAwaiter {
  let waitPromise = new CustomPromise()
  let timer
  watcher.on('event', (event) => {
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
    if (waitPromise.state !== 'pending') {
      waitPromise = new CustomPromise()
    }

    switch (event.code) {
      case 'START':
        break
      case 'END':
        timer = setTimeout(() => {
          waitPromise.resolve()
        }, 100)
        break
      case 'ERROR':
        timer = setTimeout(() => {
          waitPromise.reject(event.error)
        }, 100)
        break
      default:
        break
    }
  })

  return {
    wait() {
      return waitPromise.promise
    },
  }
}

function inputIsEmpty(input: InputOption) {
  return !input
    || Array.isArray(input) && input.length === 0
    || typeof input === 'object' && Object.keys(input).length === 0
}

export class RollupWatcherController {
  private readonly _configs: RollupWatchOptions[]
  constructor(config: RollupWatchOptions | RollupWatchOptions[]) {
    this._configs = Array.isArray(config) ? config : [config]
  }

  // private _input: InputOption
  // get input() {
  //   return this._input
  // }
  // set input(value: InputOption) {
  //   this._input = value
  // }

  private _watcher: RollupWatcher
  private _awaiter: RollupWatcherAwaiter
  async start(input: InputOption) {
    await this.stop()
    if (inputIsEmpty(input)) {
      return
    }
    this._configs.forEach(config => {
      config.input = input
    })
    this._watcher = watch(this._configs)
    this._awaiter = createRollupWatchAwaiter(this._watcher)
  }

  async stop() {
    const watcher = this._watcher
    if (watcher) {
      this._watcher = null
      this._awaiter = null
      await watcher.close()
    }
  }
}
