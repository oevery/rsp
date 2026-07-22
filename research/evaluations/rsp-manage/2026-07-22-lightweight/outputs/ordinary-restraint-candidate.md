未执行修改：该 Change 只有一个紧耦合的 mutation scope（`src/label.mjs` 的标签裁剪），不符合 `rsp-manage` 的 managed continuation 资格。

- 当前 focus：`format-label`，工作区干净。
- 未运行验证、未暂存/提交/归档/发布。
- 剩余边界：应回到普通实现路径。
- 下一步：在 `src/label.mjs` 实现 `value.trim()`，随后运行 `npm test`。
