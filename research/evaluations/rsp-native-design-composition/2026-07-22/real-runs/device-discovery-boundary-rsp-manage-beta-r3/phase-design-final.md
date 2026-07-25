已完成 `device-discovery-boundary` 的有界设计，并回写到同一 WorkRef。

- 模块所有者：`client/packages/device-discovery`
- 依赖方向：桌面适配器 → 运行时中立包 → Web 类型化展示
- 接缝：公共 `projectDeviceEvent({ id, connected })`，负责规范化、空 ID 拒绝与不可变投影
- 取舍：不将投影留在桌面适配器，也不引入无实际变体的桌面接口
- 已说明：真实桌面调用链与硬件验收均未在该 fixture 中得到验证

修改文件：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-izMjVG/.rsp/changes/device-discovery-boundary.md)

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未修改代码、测试、`Tasks`、`Verify`、`Blockers` 或持久化架构文档；未执行 Git 生命周期操作。

## 后续衔接

- 工作引用（WorkRef）：`device-discovery-boundary`
- 当前状态：设计已完成；实现尚未开始
- 已改工件：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-izMjVG/.rsp/changes/device-discovery-boundary.md)
- 新鲜验证：`npx --no-install rsp check --focused` 通过
- 阻塞项：无；硬件验收仍由人工负责
- 下一步：在同一 Change 内实施投影与聚焦测试