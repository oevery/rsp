已完成：

- `normalizeDeviceId` 现在仅接受完整 ASCII 十进制字符串，并原样返回（保留前导零）。
- 增加替代数值语法、空白、全角数字及非字符串输入的拒绝测试。
- 更新 Change：实现与 `npm test` 已勾选。

新鲜验证：`npm test` 通过，2/2；`git diff --check` 通过。

剩余边界：物理 receiver-device 人工验收尚未执行，未声称通过。下一步是在真实接收设备上验证该输入约束。未暂存、提交、归档或发布。
