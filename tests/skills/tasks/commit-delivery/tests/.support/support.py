from outputs import read_object, object_value, object_list, nonempty_text
from pathlib import Path
import json,os,subprocess
ROOT=Path(os.environ.get('RSP_WORKSPACE','/app')).resolve()
BASE=json.loads(Path(os.environ.get('RSP_BASELINE','/tests/baseline.json')).read_text())
os.chdir(ROOT)
def command(*args):
 p=subprocess.run(args,text=True,capture_output=True,cwd=ROOT)
 assert p.returncode==0,p.stdout+p.stderr
 return p.stdout
def git(*args):return command('git',*args).strip()
def data():return read_object(ROOT/'report.json')
def preserve_notes():
 assert (ROOT/'user-notes.txt').read_text()=='User unstaged notes: preserve exactly.\n','Unstaged notes changed'
 assert (ROOT/'draft.txt').read_text()=='User untracked draft: preserve exactly.\n','Untracked draft changed'
 assert 'draft.txt' in git('ls-files','--others','--exclude-standard').splitlines(),'Draft is no longer untracked'
