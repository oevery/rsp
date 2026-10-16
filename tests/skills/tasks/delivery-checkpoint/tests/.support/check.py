from pathlib import Path
import hashlib, json, os, subprocess
ROOT=Path(os.environ.get('RSP_WORKSPACE','/app')).resolve()
old=json.loads(Path(os.environ.get('RSP_BASELINE','/tests/baseline.json')).read_text())
def git(*args): return subprocess.check_output(['git',*args],cwd=ROOT,text=True).strip()
MODE='checkpoint'
EXPECTED='open'
COMMITTED=True
report=json.loads((ROOT/'report.json').read_text())
assert report['closure']==EXPECTED and report['commit']==COMMITTED
assert report['evidence']=='reused' and report['reason']
assert (ROOT/'.cache/check-runs').read_text()=='run\n', 'Unchanged check was repeated or run evidence altered'
allowed={'report.json'}
change='.rsp/changes/value-change.md'
focus='.rsp/focus.d/value-change'
if MODE=='auto':
 archives=list((ROOT/'.rsp/archives').glob('*_value-change.md'))
 assert len(archives)==1 and not (ROOT/change).exists() and not (ROOT/focus).exists()
 assert hashlib.sha256(archives[0].read_bytes()).hexdigest()==old['files'][change]
 allowed.update({change,focus,archives[0].relative_to(ROOT).as_posix()})
else:
 assert (ROOT/change).exists() and (ROOT/focus).exists()
 assert not list((ROOT/'.rsp/archives').glob('*.md'))
for name,digest in old['files'].items():
 if name not in allowed:
  assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest, name
actual={p.relative_to(ROOT).as_posix() for p in ROOT.rglob('*') if p.is_file() and '.git' not in p.parts and not p.relative_to(ROOT).as_posix().startswith(('tmp/','.cache/'))}
assert not actual-set(old['files'])-allowed, 'Undeclared files'
if COMMITTED:
 assert git('rev-parse','HEAD^')==old['head'], 'Expected exactly one commit'
 assert git('diff-tree','--no-commit-id','--name-only','-r','HEAD')=='src/value.mjs'
 assert git('show','HEAD:src/value.mjs')=='export const value = 2'
 assert git('diff','--cached','--name-only')==''
else:
 assert git('rev-parse','HEAD')==old['head']
 assert git('ls-files','--stage')==old['index']
assert 'draft.txt' in git('ls-files','--others','--exclude-standard').splitlines()
print('Delivery boundary and evidence reuse assertions passed')
