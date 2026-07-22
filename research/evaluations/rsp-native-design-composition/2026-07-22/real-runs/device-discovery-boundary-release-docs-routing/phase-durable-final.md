已将稳定架构事实写入 [设备发现边界文档](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-CmEJNu/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Update existing spec or scoped instruction
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 待写入事实：
  - 桌面运行时拥有物理发现与连接生命周期；运行时中立包只做事件投影。
  - `projectDeviceEvent` 修剪并校验 ID，返回冻结的类型化记录。
  - Web 仅消费投影，不直接发现硬件。
  - 硬件验收保持 `unavailable; human owned`。
- 决策记录：No Decision Record needed
- 决策记录目标：N/A
- 待写入理由：
  - 无
- 可归档：no

验证通过：`git diff --check`、`npx --no-install rsp check --focused`。  
未重跑测试；采用本请求提供的最新审查证据（`2 passed`）。硬件验收仍不可用。