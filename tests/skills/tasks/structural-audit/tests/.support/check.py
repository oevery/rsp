from support import *
import math
readonly_product()
findings=object_list(data().get('findings',[]),'findings')
identified=[]
for index,finding in enumerate(findings):
 paths={}
 for field in ('owner','bypass','entrypoint'):
  value=finding.get(field)
  label=f'findings[{index}].{field}'
  assert isinstance(value,str),f'Invalid report path {label}: expected one repository-relative file-path string'
  path=Path(value)
  assert value.strip() and not path.is_absolute(),f'Invalid report path {label}: expected a nonempty repository-relative file path'
  try:
   target=(ROOT/path).resolve()
  except ValueError as error:
   raise AssertionError(f'Invalid report path {label}: invalid file path') from error
  assert target.is_relative_to(ROOT) and target.is_file(),f'Invalid report path {label}: must name an existing file inside the repository'
  paths[field]=target.relative_to(ROOT).as_posix()
 identified.append((finding,paths))
matching=[f for f,paths in identified if paths['owner']=='src/pricing.mjs' and paths['bypass']=='src/export.mjs' and paths['entrypoint']=='src/main.mjs']
assert matching,'Reachable pricing-owner bypass missing'
f=matching[0]
example=object_value(f.get('example',{}),'example')
value=example.get('input')
assert type(value) in (int,float) and math.isfinite(value),'Example needs a finite numeric input'
actual=json.loads(command('node','--input-type=module','-e',
 "import {preview,invoice} from './src/main.mjs'; const x=JSON.parse(process.argv[1]); console.log(JSON.stringify({expectedCents:preview(x).totalCents,actualCents:invoice(x).totalCents}))",json.dumps(value)))
assert actual['expectedCents']!=actual['actualCents'],'Example does not expose the production bypass'
assert all(example.get(key)==value for key,value in actual.items()),'Incorrect observable example'
for field in ('consequence','coverage'):
 assert isinstance(f.get(field),(str,dict,list)) and f[field],field
for e in object_list(f.get('evidence',[]),'evidence'):
 assert isinstance(e.get('path'),str) and isinstance(e.get('line'),int),'Evidence needs a path and line'
 path=ROOT/e['path'];line=e['line']
 assert path.is_file() and isinstance(line,int) and 1<=line<=len(path.read_text().splitlines()),'Invalid source citation'
print('Reachable bypass, report contract and readonly boundary verified')
