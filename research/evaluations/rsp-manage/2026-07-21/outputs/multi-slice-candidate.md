## Management Receipt

- WorkRef: `normalize-endpoint`; Depth: managed。
- 已完成：解析校验与格式化两个切片；host 小写化，端口限制为 1–65535 整数，并补充异常输入测试。
- 验证：新鲜运行 `npm test`，4/4 通过；`git diff --check` 通过。
- 范围：仅修改了授权的三个文件，未暂存、提交或执行外部操作。
- 剩余边界：Change 已完成；归档/提交属于未授权生命周期操作。
- 下一步：如需交付，可由你授权进行审查或提交。
