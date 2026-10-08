from support import *

preserve()
document_changes('README.md','CONTEXT.md','CONTEXT-MAP.md')
require(not (ROOT/'CONTEXT-MAP.md').exists(),'Legacy map not retired')
c=text('CONTEXT.md');r=text('README.md')
require(all(x in c for x in ('UTC','Job','Run','src/export.mjs')),'Lost domain meaning or convention')
require('CONTEXT.md' in r and 'CONTEXT-MAP.md' not in r,'Stale navigation')
print("Task assertions passed")
