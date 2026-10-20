from support import *

preserve()
readonly_product()
r=data();evidence_report(r,{'scope':'staged','code':'fail','document':'fail'})
f=object_list(r.get('findings',[]),'findings');require(bool(f),'Staged finding missing')
for finding in f:
 require(finding.get('path')=='src/discount.mjs' and finding.get('line') in (1,2),'Invalid staged citation')
 require(nonempty_text(finding.get('reason')),'Concrete defect explanation required')
print("Task assertions passed")
