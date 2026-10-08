from support import *

preserve()
readonly_product("plan.md")
require(bool(text('plan.md').strip()), 'Plan artifact missing')
print('Plan artifact and read-only product verified')
