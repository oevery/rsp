from support import *
readonly_product()
r=data()
assert r.get('workRef')=='catalog-refresh','Lost selected owner'
assert r.get('state')=='blocked' and r.get('next')=='ask-owner','Unresolved decision must stop dependent work'
assert r.get('selectedPriceCents','absent') is None,'Unapproved price selected'
assert isinstance(r.get('question'),str) and isinstance(r.get('explanation'),str),'Question and evidence explanation required'
check=object_value(r.get('currentCheck',{}),'currentCheck')
assert check.get('status')=='passed','Current check did not pass'
assert isinstance(check.get('scope'),str) and check['scope'],'Current check scope missing'
assert check.get('command') in ('node tools/check.mjs','node ./tools/check.mjs'),'Wrong current check'
command('node','tools/check.mjs')
print('Blocked owner decision and readonly snapshot evidence verified')
