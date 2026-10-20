from support import *

preserve()
document_changes('README.md','CONTEXT.md','CONTEXT-MAP.md')
require(not (ROOT/'CONTEXT-MAP.md').exists(),'Legacy map not retired')
require(bool(text('CONTEXT.md').strip()), 'Merged context missing')
r=text('README.md')
require('CONTEXT.md' in r and 'CONTEXT-MAP.md' not in r,'Stale navigation')
print("Task assertions passed")
