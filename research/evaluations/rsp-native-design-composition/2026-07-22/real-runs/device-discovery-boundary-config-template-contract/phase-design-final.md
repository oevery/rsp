## 设计结论

- 工作引用（WorkRef）: `device-discovery-boundary`
- 单一设计问题已确认，并已回写至同一 Change 的 `## Design`。
- 模块归属：`client/packages/device-discovery` 拥有纯 `projectDeviceEvent` 规范化；desktop runtime 保留物理发现与生命周期。
- 依赖方向：desktop adapter → `client/packages/device-discovery` → typed Web consumer。
- 边界（seam）：desktop 传入原始 `{ id, connected }`，包返回冻结后的规范化投影；不打开设备、不持有生命周期状态。
- 修改内容：[device-discovery-boundary.md](<home>/Developer/lab/rsp/.cache/rsp-native-design-composition/device-discovery-boundary-bVZlVl/.rsp/changes/device-discovery-boundary.md:15) 的 `## Design`，未改动其他段落或代码。
- 验证：`npx --no-install rsp check --focused` 通过；`git diff --check` 通过。
- 未验证：接收器硬件验收仍不可用，归人工作为。