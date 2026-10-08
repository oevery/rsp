from support import *

preserve()
readonly_product()
r=data();evidence_report(r,{'candidateMatched':True,'behavioralAcceptance':'not-run','releaseApproved':False})
require(nonempty_text(r.get('next')),'Need code/offline/historical evidence and next action')
a=data('candidate.json')['identity'];b=data('evidence/older-model.json')['identity'];require(a['skillCommit']!=b['skillCommit'],'Stale composition control missing')
print("Task assertions passed")
