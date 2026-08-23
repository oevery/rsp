import { execFile } from 'node:child_process'

export function run(executable, args) {
  return new Promise((resolve, reject) => {
    execFile(executable, args, (error, stdout) => error ? reject(error) : resolve(stdout))
  })
}
