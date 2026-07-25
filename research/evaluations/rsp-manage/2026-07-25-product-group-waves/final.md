完成：

- `delivery/header`：实现 header trim/lowercase 与空值拒绝。
- `delivery/retry`：仅接受 `0..5` 的整数，补齐边界与小数测试。

验证：`npm test` 通过（7/7）；`git diff --check` 通过；`package-lock.json` 未修改。

待处理：

- `delivery/header`、`delivery/retry`：实现已完成，但仍待生命周期 owner 审查/关闭。
- `delivery/summary`：仍等待 `delivery/header` 被接受并归档。
- `delivery/blocked`：仍等待外部 schema owner。

边界：当前授权禁止归档、提交或处理依赖/外部阻塞子项。

下一步：由生命周期 owner 审查并归档 `delivery/header`，再重新推导 `delivery` 的后续波次。
