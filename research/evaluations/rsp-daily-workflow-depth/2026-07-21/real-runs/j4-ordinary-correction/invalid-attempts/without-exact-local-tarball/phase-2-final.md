## 审查范围

- Comparison: `HEAD` vs 当前 selected-change diff
- Intent: `.rsp/changes/cache-isolation.md`
- Code: blocked
- Document: clean
- Excluded: 除 `src/cache.ts`、`test/cache.test.ts` 与 Change 外的所有文件（用户限定范围）

## 发现

### [P1] 缓存键仍忽略 classId，目标行为尚未实现

- Artifact kind: code
- Axis: 安全性与正确性、Change fidelity
- Location: `src/cache.ts:4`, `src/cache.ts:8`
- Authority: Change 的“Cache identity is the pair `{ classId, type }`”
- Evidence: 写入和读取均仅使用 `type`；依次写入 `class-a/reading/a`、`class-b/reading/b` 后，读取 `class-a/reading` 会得到 `b`。
- Impact: 同一缓存类型的不同班级继续发生数据串用。
- Suggested action: 在读写两处使用同一确定性的 `{ classId, type }` 复合键，并完成 focused test 的 RED-GREEN 验证。
- Confidence: high

## 覆盖

- 已核查：`HEAD` 差异、Change、`src/cache.ts`、`test/cache.test.ts`。
- `git diff --check HEAD -- ...` 通过。
- 已执行 `mise exec -- pnpm test -- cache-isolation`：失败于 `test/cache.test.ts:6` 的 Vitest `it` 导入运行环境，未执行缓存隔离断言；与 Change 中记录的 blocker 一致。
- Change 的未决选择：测试运行器基线应修复，还是应授权绕过/调整该基线；当前由 Change 明确标记为 blocker，未构成文档矛盾。
- authenticated multi-class acceptance 仍不可用，未声称完成。

## 结论

blocked：先解决或授权测试运行器基线，再以最小复合键修复 `src/cache.ts` 并重新执行指定验证。