发现 1 个问题：

- `docs/usage.md:3` — 文档写成“Returns zero on failure.”，但实现和变更规格均要求失败返回 `{ ok: false, error }`。这会让使用者按错误的返回类型处理失败结果。建议改为明确描述该对象结构。

已检查当前相对 `HEAD` 的工作区 diff；`src/run.ts` 的失败返回值符合 focused Change。未发现可运行的测试或项目验证脚本。