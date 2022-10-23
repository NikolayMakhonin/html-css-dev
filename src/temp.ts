import {PrepareBuildFilesOptionsArgs, prepareBuildFilesOptions} from 'src/prepareBuildFilesOptions'
import {Watcher} from 'src/Watcher'

export async function createWatcher(args: PrepareBuildFilesOptionsArgs): Promise<Watcher> {
  const options = await prepareBuildFilesOptions(args)
  return new Watcher(options)
}
