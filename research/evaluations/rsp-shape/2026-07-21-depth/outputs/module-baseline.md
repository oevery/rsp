已路由至普通 Change `device-events`，不需要 Change Group：只有一个边界决策和一个目标文档 `docs/architecture/device-boundary.md`。

返回给 `device-events` 的设计任务：

- 使用 `codebase-design` 决定 Electron 是否拥有设备事件流，Web 仅接收类型化投影。
- 以 `desktop/device.ts` 与 `web/use-device.ts` 为唯一权威输入。
- 若 Electron 为 owner，文档需明确事件源、投影契约、生命周期/断连语义，以及 Web 不得直接访问设备流的边界。
- 实现前以该文档作为验收产物；不涉及代码修改。

当前未满足 Shape Ready：提供的工作区仅有 `rsp-shape` skill 文件，找不到两个权威输入、现有 RSP Change 或项目指令文件，因此不能诚实地决定所有权，也不能验证设计结论。未修改文件，未运行验证。
