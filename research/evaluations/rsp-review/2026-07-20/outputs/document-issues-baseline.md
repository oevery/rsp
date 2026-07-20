发现 3 个问题：

- **P1** [docs/plan.md:3]：计划声称重试耗尽后“返回 zero”，但当前实现实际抛出 `retries-exhausted`。这会让后续文档工作记录错误的既有行为，应以代码为准修正。

- **P1** [docs/plan.md:12]：计划包含 retry-count dashboard，但链接的 Change 明确规定 dashboard 不在范围内。应删除该任务，避免实施超出批准范围。

- **P2** [docs/plan.md:16]：验证标准“Verify that it works”不可执行，也没有验证需记录的 bounded retry 行为或耗尽时的异常结果。应指定可观察的验证条件（例如重试有上限、耗尽时抛出 `retries-exhausted`，以及文档与此一致）。
