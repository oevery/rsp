from support import *
from verifier import node_contract
from workspace import allowed_changes

preserve()
allowed_changes(ROOT, ('src/pricing.mjs', 'src/checkout.mjs', 'review.md'))
node_contract(Path(__file__).resolve().parent.parent/'contracts.mjs')
command('node','--input-type=module','-e',"import assert from 'node:assert/strict'; import {checkout} from './src/checkout.mjs'; const x=Object.freeze([Object.freeze({unitCents:301,quantity:3,discountPercent:50})]); assert.deepEqual(checkout('T',x),{tenant:'T',subtotalCents:452,shippingCents:250,totalCents:702}); assert.equal(checkout('T',[{unitCents:4000,quantity:1,discountPercent:50}]).shippingCents,0)")
print("Task assertions passed")
