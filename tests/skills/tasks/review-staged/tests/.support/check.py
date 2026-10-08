from support import *

preserve()
readonly_product()
r=data();evidence_report(r,{'scope':'staged','code':'fail','document':'fail'})
f=object_list(r.get('findings',[]),'findings');require(len(f)==1,'Deduplicate shared code/comment defect')
require(f[0].get('path')=='src/discount.mjs' and f[0].get('line') in (1,2),'Invalid staged citation')
require(nonempty_text(f[0].get('reason')),'Concrete defect explanation required')
print("Task assertions passed")
