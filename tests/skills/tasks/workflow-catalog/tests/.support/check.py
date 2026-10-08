from support import *
from verifier import node_contract

preserve()
allowed_changes(ROOT, ('site/catalog.json', '.rsp/changes/catalog-refresh.md'))
node_contract(Path(__file__).resolve().parent.parent/'contracts.mjs')
s=text('.rsp/changes/catalog-refresh.md')
before=git('show','HEAD:.rsp/changes/catalog-refresh.md')
require(s.strip()!=before.strip(),'Requested completion evidence not updated')
require(s.split('## Tasks')[0]==before.split('## Tasks')[0],'Changed accepted scope')
require(s.split('## Blockers')[1].rstrip()==before.split('## Blockers')[1].rstrip(),'Changed blockers')
print('Functional outcome, user work and approved scope verified')
