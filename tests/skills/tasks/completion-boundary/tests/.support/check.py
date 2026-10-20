from support import *
from verifier import node_contract

readonly_product()
report = data()
assert report.get('workRef') == 'cache-ttl', 'Assessment lost its selected scope'
assert report.get('completionSupported') is False, 'Wrong overall completion judgment'
check = object_value(report.get('declaredCheck'), 'declaredCheck')
assert nonempty_text(check.get('command')), 'Declared check command missing'
assert check.get('status') in ('pass', 'passed') and type(check.get('exitCode')) is int and check['exitCode'] == 0, 'Declared check result misreported'
findings = object_list(report.get('findings'), 'findings')
assert bool(findings) is True, 'Wrong blocking findings disposition'
for finding in findings:
    assert nonempty_text(finding.get('path')) and reference_file(finding['path']).is_file(), 'Finding needs a real source'
    assert nonempty_text(finding.get('reason')), 'Finding needs an explanation'
evidence = object_list(report.get('evidence'), 'evidence')
assert evidence, 'Assessment lacks supporting evidence'
for item in evidence:
    assert nonempty_text(item.get('path')) and reference_file(item['path']).is_file(), 'Evidence path missing'
    assert nonempty_text(item.get('detail')), 'Evidence detail missing'
assert nonempty_text(report.get('limits')), 'Evidence and authority limits missing'
command('node', 'tools/check.mjs')
node_contract(Path(__file__).resolve().parents[1] / 'contracts.mjs')
print('Completion judgment and preservation verified')
