from support import *
from verifier import node_contract
from workspace import allowed_changes

preserve()
allowed_changes(ROOT, ('src/csv.mjs', 'src/window.mjs'))
node_contract(Path(__file__).resolve().parent.parent / 'contracts.mjs')
print('Task assertions passed')
