无法进行代码审查：当前存在两个同等权威的 RSP focus：

- `.rsp/focus.d/first` → “Return the first value.”
- `.rsp/focus.d/second` → “Return the second value.”

工作区仅将 `src/value.ts` 从 `'old'` 改为 `'new'`。该改动无法在上述互斥意图间唯一归属，因此按要求未推测其正确性或报告代码问题。

已检查：以 `HEAD` 为比较点的工作树 diff，且 `git diff --check` 通过。未修改任何文件。  

