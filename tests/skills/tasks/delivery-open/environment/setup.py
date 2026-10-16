"""Prepare synthetic delivery state and execute real setup-owned check evidence."""
from pathlib import Path
import hashlib, json, os, subprocess, sys
root=Path(sys.argv[1]).resolve(); baseline=Path(sys.argv[2]).resolve()
os.chdir(root)
assert not (root/'.git').exists()
os.environ.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_AUTHOR_DATE='2026-10-15T00:00:00+00:00', GIT_COMMITTER_DATE='2026-10-15T00:00:00+00:00')
def git(*args): return subprocess.check_output(['git',*args],text=True).strip()
for p in root.rglob('*'):
 if p.is_file(): p.chmod(0o644)
git('init','-q','--initial-branch=main','--object-format=sha1')
git('config','user.name','Fixture');git('config','user.email','fixture@example.invalid')
(root/'src/value.mjs').write_text('export const value = 1\n')
git('add','--all');git('-c','commit.gpgsign=false','commit','-qm','Synthetic delivery baseline')
(root/'src/value.mjs').write_text('export const value = 2\n')
check=subprocess.run(['node','tools/check.mjs'],text=True,capture_output=True,check=True)
inputs={name:hashlib.sha256((root/name).read_bytes()).hexdigest() for name in ['src/value.mjs','tools/check.mjs','CONTEXT.md']}
(root/'evidence.json').write_text(json.dumps({'origin':'fixture setup execution, not model execution','command':'node tools/check.mjs','exitCode':check.returncode,'stdout':check.stdout,'inputs':inputs},indent=2)+'\n')
(root/'user-notes.txt').write_text('User working note: preserve.\n')
(root/'draft.txt').write_text('User draft: preserve.\n')
files={p.relative_to(root).as_posix():hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts}
baseline.write_text(json.dumps({'head':git('rev-parse','HEAD'),'index':git('ls-files','--stage'),'files':files},indent=2,sort_keys=True)+'\n')
