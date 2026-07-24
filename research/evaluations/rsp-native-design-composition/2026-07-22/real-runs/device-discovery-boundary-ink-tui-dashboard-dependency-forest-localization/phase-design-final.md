## 设计结论

- 工作引用（WorkRef）：`device-discovery-boundary`
- 已在同一 Change 的 [`## Design`](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-ZHamI6/.rsp/changes/device-discovery-boundary.md:15) 回写结论。
- Owner：desktop adapter 负责物理发现与连接生命周期；`client/packages/device-discovery` 负责纯事件投影。
- 依赖方向：desktop adapter → runtime-neutral package；Web 只消费投影结果，不能依赖 desktop 或发现硬件。
- Seam：`projectDeviceEvent` 进行 `id` trim、空值拒绝与不可变 `{ id, connected }` 输出，不承载发现、状态、重试或传输错误处理。
- 验证：`git diff --check` 通过；`npx --no-install rsp check --focused` 通过。
- 未执行硬件验收；其仍为不可用、人工负责的验证项。