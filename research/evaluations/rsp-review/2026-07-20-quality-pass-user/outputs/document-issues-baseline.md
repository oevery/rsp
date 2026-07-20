发现 3 个问题：

1. **P1：计划陈述的现状与代码不符。** [docs/plan.md:3](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-HKu8S1/docs/plan.md:3) 称重试耗尽后返回 `0`，但当前实现会抛出 `Error('retries-exhausted')`，[src/retry.ts:2](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-HKu8S1/src/retry.ts:2)。这会让后续文档固化错误的调用方语义，应先以实际行为为准描述，或明确这是待变更的行为并关联相应 Change。

2. **P1：引入了 Change 明确排除的 dashboard 工作。** [docs/plan.md:12](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-HKu8S1/docs/plan.md:12) 要求增加 retry-count dashboard，但链接的 Change 明确说 “Dashboard work is out of scope”。该任务会扩大实现范围，不能作为本计划的一部分。

3. **P2：计划未覆盖 Change 的核心约束，且验证不可执行。** Change 的目标是记录“现有的有界重试行为”，但 [docs/plan.md:11](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-HKu8S1/docs/plan.md:11) 仅写泛泛的“Document retries”，[docs/plan.md:15](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/document-issues-baseline-HKu8S1/docs/plan.md:15) 的 “Verify that it works” 未说明核验对象、边界、失败语义或验证方式。计划无法据此证明文档忠实反映当前实现。

建议：**hold**。未运行测试；本次仅审查文档变更及其关联 Change/当前代码。