未进行代码评审：RSP 意图存在歧义。

- `.rsp/focus.d/first` 与 `.rsp/focus.d/second` 同时存在，无法唯一选择权威 focus。
- 两个候选意图互相冲突：`first` 要求返回 first value，`second` 要求返回 second value。
- 当前工作树仅修改了 `src/value.ts`：`'old'` → `'new'`。

按要求未猜测意图，未检查该代码改动是否符合任一候选需求，也未运行验证。