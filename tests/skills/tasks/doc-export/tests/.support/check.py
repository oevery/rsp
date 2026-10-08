from support import *

preserve()
document_changes('README.md','CONTEXT.md','spec.md')
for path in ('README.md','CONTEXT.md','spec.md'):
 require(bool(text(path).strip()), 'Missing document: '+path)
 require(text(path).strip()!=git('show','HEAD:'+path).strip(), 'Requested document was not revised: '+path)
print('Document artifacts and user work verified')
