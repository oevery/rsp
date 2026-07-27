已完成同一 WorkRef 的设计回写：`device-discovery-boundary`。

- 模块归属：`client/packages/device-discovery`
- 依赖方向：desktop adapter → `device-discovery` → typed presentation consumer
- 边界（seam）：`projectDeviceEvent(input)` 作为纯投影边界，负责 trim、空 ID 拒绝、新对象返回；不承担硬件访问或生命周期策略。
- 已记录替代方案及取舍。

仅修改了 [device-discovery-boundary.md](<workspace>/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`。

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。未执行硬件验收、未修改代码或测试，也未进行任何 Git 生命周期操作。