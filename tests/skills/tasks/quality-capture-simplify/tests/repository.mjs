import { execFileSync } from 'node:child_process'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

export async function repository() {
  const directory = await mkdtemp(join(tmpdir(), 'capture-repository-'))
  const git = args => execFileSync('git', ['-C', directory, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', ...args]).toString().trim()
  git(['init', '-q'])
  git(['config', 'core.quotePath', 'true'])
  await writeFile(join(directory, 'notes.txt'), 'before\n')
  git(['add', '.'])
  git(['commit', '-qm', 'before'])
  const before = git(['rev-parse', 'HEAD'])
  await writeFile(join(directory, 'notes.txt'), 'after\n')
  await writeFile(join(directory, 'other.txt'), 'other\n')
  await writeFile(join(directory, '说明.txt'), 'unicode\n')
  await writeFile(join(directory, ' spaced name.txt '), 'spaces\n')
  await writeFile(join(directory, 'line\nbreak.txt'), 'newline\n')
  git(['add', '.'])
  git(['commit', '-qm', 'after'])
  return { directory, before, after: git(['rev-parse', 'HEAD']) }
}
