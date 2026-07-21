WorkRef: `.rsp/changes/long-running-delivery.md` — partial / human-acceptance-blocked。

已完成：

- 严格要求非空 ASCII 十进制字符串，保留前导零。
- 补充空值与非字符串拒绝测试，并修复测试为 `node:test`。
- 已更新同一 Change 的 Tasks、自动化验证证据与 Blocker。

验证通过：

```text
mise exec -- pnpm test -- long-running-delivery
2 tests passed
```

停止于真实边界：Human receiver acceptance 不可用且由用户负责。未执行 Git、archive、publish 或其他生命周期操作。