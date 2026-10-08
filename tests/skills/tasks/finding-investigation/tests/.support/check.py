from support import *

preserve()
readonly_product()
r=data();evidence_report(r,{'repaired':False})
f=object_list(r.get('dispositions',[]),'dispositions')
require(all(isinstance(x.get('id'),str) for x in f),'Disposition IDs must be text')
require({x.get('id'):x.get('status') for x in f}=={'F1':'accepted','F2':'rejected'},'Investigate each fixed finding')
require(all(nonempty_text(x.get('reason')) for x in f),'Concrete evidence reasoning required')
print("Task assertions passed")
