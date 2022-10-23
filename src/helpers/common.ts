import path from 'path'
import fse from 'fs-extra'

export function normalizePath(filepath: string) {
  return filepath.replace(/\\/g, '/')
}

export function prepareGlobPatterns(inputDir: string, filesPatterns: string[]) {
  return filesPatterns.map(pattern => {
    return normalizePath(pattern.startsWith('!')
      ? '!' + path.resolve(inputDir, pattern.substring(1))
      : path.resolve(inputDir, pattern))
  })
}

export function forEachParentDirs(dir: string, func: (parentDir: string) => void) {
  let prevDir = normalizePath(dir)
  func(prevDir)
  let _dir = normalizePath(path.dirname(prevDir))
  while (_dir !== prevDir) {
    func(_dir)
    prevDir = _dir
    _dir = normalizePath(path.dirname(prevDir))
  }
}

export async function getPathStat(filePath: string) {
  try {
    const stat = await fse.lstat(filePath)
    return stat
  }
  catch {
    return null
  }
}

export async function dirIsEmpty(dir: string) {
  const dirIter = await fse.opendir(dir)
  const {done} = await dirIter[Symbol.asyncIterator]().next()
  if (!done) {
    await dirIter.close()
    return false
  }
  return true
}

export async function removeEmptyDirs(dir: string) {
  const pathStat = await getPathStat(dir)
  if (pathStat.isDirectory() && await dirIsEmpty(dir)) {
    try {
      await fse.rmdir(dir, {
        recursive: false,
      })
    }
    catch (err) {
      if (fse.existsSync(dir)) {
        throw err
      }
    }
    await removeEmptyDirs(path.dirname(dir))
  }
}

export async function removePath(_path: string) {
  if (fse.existsSync(_path)) {
    await fse.rm(_path, { recursive: true, force: true })
    await removeEmptyDirs(path.dirname(_path))
    // await tryRun(5, 500, () => removeEmptyDirs(path.dirname(file)))
  }
}

export async function getDirPaths(dir: string) {
  async function _getDirPaths(dir: string, dirs: string[], files: string[]) {
    const paths = await fse.readdir(dir)
    await Promise.all(paths.map(async o => {
      const subPath = normalizePath(path.join(dir, o))
      const stat = await getPathStat(subPath)
      if (stat.isFile()) {
        files.push(subPath)
      }
      else if (stat.isDirectory()) {
        dirs.push(subPath)
        await _getDirPaths(subPath, dirs, files)
      }
    }))
    return files
  }

  const dirs: string[] = []
  const files: string[] = []
  await _getDirPaths(dir, dirs, files)

  return {
    dirs,
    files,
  }
}

export function filePathWithoutExtension(filePath: string) {
  return filePath.match(/^(.+?)(\.\w+)?$/)[1]
}

export function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
