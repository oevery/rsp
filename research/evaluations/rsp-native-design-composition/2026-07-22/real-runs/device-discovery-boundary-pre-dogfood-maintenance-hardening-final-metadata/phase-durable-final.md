已写入稳定架构事实：[设备发现边界](docs/architecture/device-discovery-boundary-6i61T2/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：更新获授权的范围文档
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 写入事实：桌面运行时发现硬件；运行时无关包仅投影事件；Web 不直接发现硬件；接收器硬件验收不可用且由人工负责；自动化测试不等同硬件验收
- 决策记录（Decision Record）：无需
- 可归档（Archive ready）：no

已验证 `npx --no-install rsp check --focused` 通过，且文档差异通过 `git diff --check`。未运行硬件验收；未修改 Change、代码或测试，未执行任何 Git 生命周期操作。