# jobs-catalog 模块交互文档（第 2 轮展示强化）

> 用户交互规格见 docs/interaction.md §6、§7（第 2 轮已更新「报名已截止」标识与空字段规则），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md）：「报名已截止」灰色标识（卡片 + 详情页）、「条件见来源」收敛规则、详情页分区。
- 内部关键接口：`deadlineBadgeLabel`（扩展）、`deadlineDaysLeft`、`applicationWindow`（既有）。

# 2. 过期标识规格

- 签名：`deadlineBadgeLabel(job, today)` 扩展或新增并列函数（实现取舍归 dev，测试按行为断言）。
- 预期输出：deadline 早于当日且 status「招聘中」→「报名已截止」；status「已截止」→ null（卡片已有独立「已截止」徽标，不重复）；无 deadline → null；0–7 天维持红色「x 天后截止/今天截止」。
- 边界检查：与「即将截止」互斥（正天数红色、0 今天截止红色、负天数灰色）。
- 错误处理：日期解析失败返回 null。

# 3. 「条件见来源」收敛规格

- 触发条件：记录无 original_major_requirements、education、salary、responsibilities、application_info 任一条件字段时，卡片与详情页显示统一提示「条件信息请见来源公告」；任一存在则不显示，按字段渲染。

# 4. 界面断言

1. deadline 早于当日且「招聘中」：卡片与详情页出现灰色「报名已截止」；「已截止」状态与正天数情形不出现。
2. 有条件字段的记录不出现「条件信息请见来源公告」；全空记录出现且仅出现一次。
3. 详情页分区顺序与 docs/interaction.md §7 一致，空区块不渲染。
4. 既有筛选/排序/分页/收藏行为不回归。
