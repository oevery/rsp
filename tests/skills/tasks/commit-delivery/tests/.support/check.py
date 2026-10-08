from support import *
preserve_notes()
assert git('rev-parse','HEAD')!=BASE['head'],'No delivery commit'
assert git('show','-s','--format=%P','HEAD').split()==[BASE['head']],'Delivery must be one child of original HEAD'
assert set(git('diff-tree','--no-commit-id','--name-only','-r','HEAD').splitlines())=={'src/price.mjs','site/price.json'},'Wrong committed boundary'
expected={'src/price.mjs':'export const priceCents = 1500\n','site/price.json':'{"currency":"USD","price":"15.00"}\n'}
for path,value in expected.items():
 assert command('git','show','HEAD:'+path)==value,'Wrong committed content: '+path
 assert (ROOT/path).read_text()==value,'Different remaining working content: '+path
assert git('show','-s','--format=%B','HEAD')=='fix(price): synchronize approved price','Unexpected message'
assert git('diff','--cached','--name-only')=='','Unexpected remaining staging'
assert git('diff','--name-only')=='user-notes.txt','Remaining tracked changes must be user notes'
assert command('git','show','HEAD:user-notes.txt')=='Original user notes.\n','User notes included in commit'
print('Exact one-commit delivery and remaining user work verified')
