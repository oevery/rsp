import assert from 'node:assert/strict'
import {parseIssueRelationships, createIssueRelationship} from '../src/core/issue-relationship.ts'
import {isPathContained} from '../src/core/path-identity.ts'
const issue = (url, relation='relates') => ({url,relation})
assert.deepEqual(parseIssueRelationships(null), [])
assert.deepEqual(parseIssueRelationships({issues:[issue('HTTPS://EXAMPLE.COM:443/issues/1'),issue('https://example.com/issues/2','closes')]}), [issue('https://example.com/issues/1'),issue('https://example.com/issues/2','closes')])
for (const urls of [['https://example.com/issues/1','https://example.com/issues/1'],['HTTPS://EXAMPLE.COM:443/issues/1','https://example.com/issues/1']])
  assert.throws(()=>parseIssueRelationships({issues:urls.map(url=>issue(url))}), e=>e.code==='duplicate_issue_url')
for (const url of ['https://user:pass@example.com/issues/1','https://example.com/issues/1#fragment'])
  assert.throws(()=>createIssueRelationship(url), e=>e.code==='unsafe_issue_url')
assert.throws(()=>createIssueRelationship('file:///tmp/issue'), e=>e.code==='invalid_issue_url')
assert.throws(()=>createIssueRelationship('https://example.com/1','owns'), e=>e.code==='unsupported_issue_relation')
for (const [root,candidate,expected] of [['/work/project','/work',false],['/work/project','/work/project',true],['/work/project','/work/project/src',true],['/work/project','/work/project-sibling',false],['/work/project','/other/path',false],['/work/project','/work/project/../outside',false]])
  assert.equal(isPathContained(root,candidate),expected,root+' -> '+candidate)
console.log('Actual source issue and containment contracts passed.')
