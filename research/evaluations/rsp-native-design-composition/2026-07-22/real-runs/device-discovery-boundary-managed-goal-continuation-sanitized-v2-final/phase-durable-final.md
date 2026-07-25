## 完成情况

已新增 [设备发现边界文档](<workspace>/docs/architecture/device-discovery-boundary.md)。

文档明确记录四项当前边界事实，以及自动化测试不构成硬件验收。

## 持久化决策

- 当前事实：更新已授权的架构文档
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：不需要
- 可归档（Archive ready）：no

原因是审查仍有 P1：生产桌面适配器尚未调用 `projectDeviceEvent`，且接收器硬件验收不可用、由人工负责。

## 验证情况

- `npx --no-install rsp check --focused` 通过。
- `git diff --check -- docs/architecture/device-discovery-boundary.md` 通过。
- 未修改 Change、代码或现有工作树改动；未执行暂存、提交或其他 Git 生命周期操作。