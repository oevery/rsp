from pathlib import Path
import hashlib,json,os,stat,subprocess
root=Path(os.environ.get('RSP_WORKSPACE','/app')).resolve()
old=json.loads(Path(os.environ.get('RSP_BASELINE','/tests/baseline.json')).read_text())
report=json.loads((root/'report.json').read_text())
expected={'parameter': 'direct', 'dependencies': 'direct', 'diagram': 'direct', 'coupled': 'change', 'existing': 'existing', 'overlap': 'direct', 'advice': 'advice', 'staged': 'change'}
rows={r['id']:r for r in report['cases']}
assert len(report['cases'])==len(expected) and set(rows)==set(expected)
for key,route in expected.items():
 assert rows[key]['route']==route and rows[key]['reason'].strip(),key
 assert rows[key]['owner']==('assessment/session' if key=='existing' else None),key
for name,digest in old['files'].items():
 path=root/name
 assert path.is_file() and not path.is_symlink(), 'Preserved input missing or replaced: '+name
 assert hashlib.sha256(path.read_bytes()).hexdigest()==digest,name
 assert stat.S_IMODE(path.stat().st_mode)==old['modes'][name], 'Input mode changed: '+name
actual={p.relative_to(root).as_posix() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts}
assert not actual-set(old['files'])-{'report.json'}
def git(*args): return subprocess.check_output(['git',*args],cwd=root,text=True).strip()
assert git('rev-parse','HEAD')==old['head']
assert git('ls-files','--stage')==old['index']
print('Routing outputs and read-only boundary passed')
