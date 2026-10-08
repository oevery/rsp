"""Build a synthetic Git fixture; never operates on the calling repository."""
from pathlib import Path
import json,os,subprocess,sys
root=Path(sys.argv[1]).resolve(); baseline=Path(sys.argv[2]).resolve()
os.chdir(root)
os.environ.update(GIT_CONFIG_NOSYSTEM='1', GIT_CONFIG_GLOBAL='/dev/null', GIT_AUTHOR_DATE='2026-10-08T00:00:00+00:00', GIT_COMMITTER_DATE='2026-10-08T00:00:00+00:00')
for item in root.rglob('*'):
 if item.is_file(): item.chmod(0o644)
def git(*args, input=None):
 return subprocess.check_output(['git',*args],input=input,text=True).strip()
def put(path,text):
 p=root/path;p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
def replace(path,before,after):
 p=root/path;s=p.read_text();assert s.count(before)==1,(path,before);p.write_text(s.replace(before,after))
assert not (root/'.git').exists(), 'Setup only accepts a fresh fixture workspace'
git('init','-q','--initial-branch=main','--object-format=sha1')
put('.git/config','[core]\n\trepositoryformatversion = 0\n\tfilemode = true\n\tbare = false\n\tlogallrefupdates = true\n[user]\n\tname = Fixture\n\temail = fixture@example.invalid\n')
put('staged-note.txt','Original staged note.\n');put('unstaged-note.txt','Original unstaged note.\n')
git('add','--all')
tree=git('write-tree');commit=git('commit-tree',tree,input='Synthetic fixture baseline\n');git('update-ref','HEAD',commit)
put('staged-note.txt','User staged note: preserve these bytes.\n');git('add','--','staged-note.txt')
put('unstaged-note.txt','User unstaged note: preserve these bytes.\n');put('untracked-note.txt','User untracked draft: preserve these bytes.\n')
put('src/price.mjs', 'export const priceCents = 1500\n')
put('site/price.json', '{"currency":"USD","price":"15.00"}\n')
git('add','--','src/price.mjs')
baseline.write_text(json.dumps({'head':git('rev-parse','HEAD'),'index':git('ls-files','--stage'),'diff':git('diff','--binary','HEAD')},indent=2)+'\n')
