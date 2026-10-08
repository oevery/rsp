from support import *

preserve()
allowed_changes(ROOT, ('.rsp/changes/requested-export.md',))
command('node','--input-type=module','-e',"import assert from 'node:assert/strict'; import {requested} from './src/requested.mjs'; assert.equal(requested,true)")
s=text('.rsp/changes/requested-export.md')
before=git('show','HEAD:.rsp/changes/requested-export.md')
require(s.strip()!=before.strip(),'Requested completion evidence not updated')
require(s.split('## Tasks')[0]==before.split('## Tasks')[0],'Changed accepted scope')
require(s.split('## Blockers')[1].rstrip()==before.split('## Blockers')[1].rstrip(),'Changed blockers')
print('Functional outcome, user work and approved scope verified')
