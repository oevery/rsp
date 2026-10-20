from support import *
readonly_product()
r=data()
assert r.get('workRef')=='catalog-refresh','Lost selected owner'
assert r.get('state')=='blocked' and r.get('next')=='ask-owner','Unresolved decision must stop dependent work'
assert r.get('selectedPriceCents','absent') is None,'Unapproved price selected'
assert isinstance(r.get('question'),str) and isinstance(r.get('explanation'),str),'Question and evidence explanation required'
check=object_value(r.get('currentCheck',{}),'currentCheck')
assert nonempty_text(check.get('status')),'Current check status missing'
assert isinstance(check.get('scope'),str) and check['scope'],'Current check scope missing'
assert nonempty_text(check.get('command')),'Current check command missing'
command('node','tools/check.mjs')
print('Blocked owner decision and readonly snapshot evidence verified')
