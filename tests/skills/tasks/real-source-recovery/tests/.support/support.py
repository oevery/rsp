from outputs import read_object, object_value, object_list, nonempty_text, evidence_file
"""Task-local deterministic verifier; parent grade.py owns reward rendering."""
from pathlib import Path
import json,os,subprocess
ROOT=Path(os.environ.get('RSP_WORKSPACE','/app')).resolve()
BASE=Path(os.environ.get('RSP_BASELINE','/tests/baseline.json'))
os.chdir(ROOT)
def run(*args):
 return subprocess.run(args,text=True,capture_output=True,cwd=ROOT)
def git(*args):
 p=run('git',*args);assert p.returncode==0,p.stderr;return p.stdout.strip()
def text(path):return (ROOT/path).read_text()
def data(path='report.json'):return read_object(ROOT/path)
def require(condition,message):
 if not condition:raise AssertionError(message)
def command(*args):
 p=run(*args);require(p.returncode==0,p.stdout+p.stderr);return p.stdout

def preserve():
 old=json.loads(BASE.read_text())
 require(git('rev-parse','HEAD')==old['head'],'HEAD changed')
 require(git('ls-files','--stage')==old['index'],'Index changed')
 notes={'staged-note.txt':'User staged note: preserve these bytes.\n', 'unstaged-note.txt':'User unstaged note: preserve these bytes.\n', 'untracked-note.txt':'User untracked draft: preserve these bytes.\n'}
 for name,expected in notes.items():require(text(name)==expected,'User note changed: '+name)
 require('untracked-note.txt' in git('ls-files','--others','--exclude-standard').splitlines(),'Untracked draft staged')


def evidence_report(report,expected):
 for key,value in expected.items():require(report.get(key)==value,'Unexpected report field: '+key)
 require(isinstance(report.get('evidence'),list) and bool(report['evidence']),'Need concrete evidence references')
 for e in report['evidence']:
  require(isinstance(e,dict) and isinstance(e.get('path'),str) and isinstance(e.get('detail'),str) and bool(e['detail'].strip()),'Evidence needs path and detail')
  evidence_file(ROOT,e['path'])
