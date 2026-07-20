## Review Scope

- Comparison: `HEAD` → current working tree
- Intent: `.rsp/changes/parse.md` — invalid numeric input returns `null`
- Code: issues_found
- Document: skipped
- Excluded: untracked `.agents/` skill files; not part of the reviewed change

## Findings

### [P1] 无效输入仍不会返回 `null`

- Artifact kind: code
- Axis: Change and Spec fidelity
- Location: `src/parse.ts:2`
- Authority: Change `parse`
- Evidence: `Number.parseInt("abc", 10)` 返回 `NaN`，而非 `null`；`Number.parseInt("12x", 10)` 还会返回 `12`，接受非完整数字输入。
- Impact: 调用方无法依赖约定的失败值，且格式错误的数据可能被静默解析为有效整数。
- Suggested action: 先验证整个字符串是否为有效数字；无效时显式返回 `null`，并覆盖无效及尾随字符输入的测试。
- Confidence: high

## Coverage

- 检查了 `HEAD` 相比工作树的完整已跟踪 diff、RSP Change 与实现。
- `git diff --check` 通过。
- 未发现测试文件或可执行测试配置，因此未运行测试。

## Verdict

findings。最小下一步：修正 `parse` 的无效输入处理并添加针对失败契约的测试。