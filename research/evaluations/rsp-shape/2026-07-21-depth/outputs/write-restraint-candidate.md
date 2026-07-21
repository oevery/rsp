现有工作区没有实现代码或测试可供核实；当前选中的 Change 也尚未描述这次迁移。因此不能安全推断 tenant 与 workspace 的生命周期关系，且未修改任何工件。

第一个需要所有者决定的问题：

当 workspace 从一个 tenant 转移到另一个 tenant（或 tenant 被删除）时，原 workspace 的加密数据应如何处理？

建议：将 workspace 设为稳定的数据归属身份；tenant 只负责访问授权。转移时需显式重包/轮换加密材料，tenant 删除不得自动删除已转移 workspace 的数据。这样才能避免“删除旧 tenant”误删仍有效 workspace 数据；代价是必须定义转移授权、密钥轮换和审计验收。

请确认这一生命周期规则，或指定“tenant 删除即删除其所有 workspace 数据”的策略；我会据此继续追问唯一直接依赖的决策。
