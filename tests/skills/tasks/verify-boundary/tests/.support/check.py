from support import *

preserve()
readonly_product()
r=data();evidence_report(r,{'workRef':'checkout-correction','complete':False})
a=run('node','tools/check.mjs');b=run('node','tools/external-check.mjs')
require(a.returncode!=0 and b.returncode==78,'Failure/unavailability controls missing')
checks=object_list(r.get('checks',[]),'checks')
require(all(nonempty_text(x.get('command')) for x in checks),'Check command must be text')
require([(x.get('status'),x.get('exitCode')) for x in checks]==[('failed',a.returncode),('unavailable',78)],'Report separate actual outcomes in declared order')
print("Task assertions passed")
