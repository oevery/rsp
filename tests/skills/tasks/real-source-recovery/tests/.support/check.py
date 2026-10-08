from support import *
from verifier import node_contract

preserve()
node_contract(Path(__file__).resolve().parent.parent/'contracts.mjs', '--experimental-transform-types')
command('node','--experimental-transform-types','--input-type=module','-e',"import assert from 'node:assert/strict'; import {parseIssueRelationships} from './src/core/issue-relationship.ts'; assert.throws(()=>parseIssueRelationships({issues:[{url:'http://EXAMPLE.org:80/x',relation:'closes'},{url:'http://example.org/x',relation:'relates'}]}),e=>e.code==='duplicate_issue_url')")
print("Task assertions passed")
