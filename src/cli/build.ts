import {build as _build} from '../build'

export function buildCli(options) {
  _build(options)
    .catch(err => {
      console.error(err)
      // eslint-disable-next-line node/no-process-exit
      process.exit(1)
    })
}

export default buildCli
