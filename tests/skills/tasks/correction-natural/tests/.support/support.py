from workspace import preserve_notes
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
def require(condition,message):
 if not condition:raise AssertionError(message)

def preserve():
 preserve_notes(ROOT, json.loads(BASE.read_text()))
