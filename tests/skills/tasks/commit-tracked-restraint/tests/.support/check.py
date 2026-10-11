from support import *

preserve()
readonly_product()
command('node','tools/check.mjs')
r=data();require(r.get('workRef')=='checkout/price-update', 'Incorrect logical child WorkRef');evidence_report(r,{'eligible':False})
require(bool(r.get('blockers')), 'Missing delivery blockers')
require(nonempty_text(r.get('next')),'Need bounded next action')
require('staged-note.txt' in git('diff','--cached','--name-only'),'Unrelated staging control missing')
print("Task assertions passed")
