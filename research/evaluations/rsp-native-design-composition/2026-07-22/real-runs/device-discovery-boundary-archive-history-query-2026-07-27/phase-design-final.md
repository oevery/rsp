已完成设计并回写同一 WorkRef：`device-discovery-boundary`。

- 模块归属：`client/packages/device-discovery` 负责纯事件投影；desktop 保留物理发现与连接生命周期。
- 依赖方向：desktop adapter → `device-discovery` → 展示层；runtime-neutral 包不得依赖 desktop/Web 或产生硬件副作用。
- 接缝：`projectDeviceEvent` 规范了修剪 ID、拒绝空 ID、保留连接状态与返回不可变投影。
- 已记录替代方案、验证边界及夹具缺少具体调用方的证据缺口。

仅修改了 `.rsp/changes/device-discovery-boundary.md` 的 `## Design`。`git diff --check` 通过；未运行测试（本阶段未修改代码或测试），未进行任何 Git 生命周期操作。