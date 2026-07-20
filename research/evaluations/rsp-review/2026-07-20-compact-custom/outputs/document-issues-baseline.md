发现 3 个问题：

- 高：[`docs/plan.md:3`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-MRYMaO/docs/plan.md:3) 声称“所有重试失败后返回零”，但当前权威实现 [`src/retry.ts:2`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-MRYMaO/src/retry.ts:2) 会抛出 `retries-exhausted`。按此计划实施会把错误行为写入文档；应改为记录实际抛错语义，或先通过 Change 明确改变实现。

- 高：[`docs/plan.md:12`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-MRYMaO/docs/plan.md:12) 新增 retry-count dashboard，但关联 Change 明确规定 dashboard 不在范围内。这会把已聚焦的文档变更扩大为未授权功能工作，应移出该计划。

- 中：[`docs/plan.md:5`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-MRYMaO/docs/plan.md:5)–[`docs/plan.md:7`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-MRYMaO/docs/plan.md:7) 引入自动 rollback 的开放决策，但 Change 只要求记录既有 bounded retry 行为，当前代码也没有 rollback 机制。这会制造未被 Change 支持的设计分支；应删除，或先扩展 Change 的目标与验收条件。

建议：阻塞提交。验证项“Verify that it works”也应具体化为核对文档准确描述 `retries-exhausted` 行为的检查。

