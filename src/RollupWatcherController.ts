import type {RollupWatcher, RollupWatchOptions, InputOption} from 'rollup'
import {CustomPromise} from '@flemist/async-utils'
import {watch} from 'rollup'

export type RollupWatcherExt = {
  watcher: RollupWatcher
  wait(): Promise<void>
}

function createRollupWatchAwaiter(watcher: RollupWatcher): () => Promise<void> {
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

  return function wait() {
    return waitPromise.promise
  }
}

function inputIsEmpty(input: InputOption) {
  return !input
    || Array.isArray(input) && input.length === 0
    || typeof input === 'object' && Object.keys(input).length === 0
}

function rollupConfigIsEmpty(config: RollupWatchOptions) {
  return !config || inputIsEmpty(config.input)
}

function rollupConfigsIsEmpty(configs: RollupWatchOptions | RollupWatchOptions[]) {
  if (!configs) {
    return true
  }
  if (!Array.isArray(configs)) {
    return rollupConfigIsEmpty(configs)
  }
  return configs.every(rollupConfigIsEmpty)
}

export function rollupWatch(configs: RollupWatchOptions | RollupWatchOptions[]) {
  if (rollupConfigsIsEmpty(configs)) {
    return null
  }
  if (!Array.isArray(configs)) {
    configs = [configs]
  }
  const watcher = watch(configs)
  const wait = createRollupWatchAwaiter(watcher)
  return {
    watcher,
    wait,
  }
}
