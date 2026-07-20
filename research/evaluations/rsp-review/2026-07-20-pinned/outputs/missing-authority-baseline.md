发现 1 个问题：

- P1：`displayName(null)` 现在会因 `value!.trim()` 抛出运行时异常。函数签名仍声明可接收 `null`，且 `HEAD` 中对此返回空字符串；非空断言只绕过 TypeScript 检查，并不处理实际的 `null` 值。 [src/name.ts](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/missing-authority-baseline-lZOh5S/src/name.ts:2)

已检查：以 `HEAD` 为基线的工作树 diff，且 `git diff --check` 无格式错误。未运行测试：仓库未包含测试或项目脚本。