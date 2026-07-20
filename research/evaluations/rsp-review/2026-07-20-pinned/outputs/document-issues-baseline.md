发现 3 个问题：

- P1 — [docs/plan.md:3](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-mIsvZY/docs/plan.md:3) 错误描述了当前行为：计划称重试耗尽后返回 `zero`，但 [`src/retry.ts:2`](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-mIsvZY/src/retry.ts:2) 实际抛出 `Error('retries-exhausted')`。按此计划产出的文档会误导调用方。

- P1 — [docs/plan.md:12](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-mIsvZY/docs/plan.md:12) 将“添加可选重试计数 dashboard”列为任务，直接违反关联 Change 中“Dashboard work is out of scope”的范围约束。应移除，避免计划引入未经批准的实现工作。

- P2 — [docs/plan.md:7](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-mIsvZY/docs/plan.md:7) 把自动回滚列为开放选择，但关联 Change 的目标仅是记录既有的有限重试行为，并未授权改变失败处理策略。该项会把文档任务扩大为行为设计/变更；应删除或明确其不属于本 Change。