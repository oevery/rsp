发现 1 个确定问题：

- `src/name.ts:2` — `value` 的公开类型允许 `null`，但 `value!.trim()` 在运行时仍会对 `null` 调用方法并抛出 `TypeError`。`!` 只抑制 TypeScript 检查，不提供运行时保护；相较 `HEAD`，原先对 `null` 返回空字符串的行为已回归。

未发现其他改动；`git diff --check HEAD` 通过。