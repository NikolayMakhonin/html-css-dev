import {startServer} from '../server'
import {build} from '../build'
import {createConfig} from '../loadConfig'

async function start(options) {
  await Promise.all([
    build(options.build),
    startServer(options.server),
  ])
}

function startCli(options) {
  options = createConfig(options.baseConfig, options, { build: { watch: true } })
  start(options)
    .catch(err => {
      console.error(err)
      process.exit(1)
    })
}

export default startCli
