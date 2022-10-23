import {startServer as _startServer} from '../server'

export function startServerCli(options) {
  _startServer(options)
    .catch(err => {
      console.error(err)
      // eslint-disable-next-line node/no-process-exit
      process.exit(1)
    })
}

export default startServerCli
