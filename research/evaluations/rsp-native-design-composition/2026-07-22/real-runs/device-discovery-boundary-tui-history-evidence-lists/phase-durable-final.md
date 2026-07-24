已创建持久化架构事实文档：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-j5nwYf/docs/architecture/device-discovery-boundary.md)。

## 持久化决策

- 当前事实：Create a new durable spec
- 当前事实目标：`docs/architecture/device-discovery-boundary.md`
- 决策记录（Decision Record）：No Decision Record needed
- 可归档：no（接收器硬件验收仍不可用且由人工负责）

文档明确记录了桌面运行时、runtime-neutral 包与 Web 的边界，以及自动化测试不等同于硬件验收。

验证：`git diff --check -- docs/architecture/device-discovery-boundary.md` 通过。未重新运行测试；沿用请求中提供的 2/2 通过证据。未修改 Change、代码或测试，未执行任何 Git 生命周期操作。