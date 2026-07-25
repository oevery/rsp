## 结果

工作引用（WorkRef）：`device-discovery-boundary`（保持不变）

已确认：该变更只有一个可界定的设计问题，且设计结论已仅写回同一 Change 的 `## Design`。

结论：桌面运行时拥有硬件发现与连接生命周期；`device-discovery` 仅拥有纯事件规范化。依赖方向为 desktop adapter → runtime-neutral package → Web，边界位于桌面适配器发布事件之前。

## 修改

仅更新了 `.rsp/changes/device-discovery-boundary.md` 的 `## Design`。

## 验证

`npx --no-install rsp check --focused` 通过。  
`git diff --check` 通过。

未修改代码、测试、架构文档、Tasks、Verify 或 Blockers；未执行硬件验收。