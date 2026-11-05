# jobs-catalog 模块设计文档（第 2 轮展示强化）

> 全局契约引用 docs/design.md §4（契约 19）、§5；本节为第 2 轮展示优化执行单元（第 1 轮的职能筛选与报名窗口已交付）。

# 1. 模块职责与边界

- 职责：①「报名已截止」灰色标识（契约 19）；②详情页条件信息分区优化（原公告条件、技能/方向标签、报名窗口、原页核验锚点、本站说明、申请方式、来源与核验，分组清晰、空区块不渲染）；③列表卡「条件见来源」提示规则收敛（仅无任何条件字段的记录显示统一提示）。
- 数据所有权：本轮对 `src/lib/data.ts`（过期判定辅助）、`src/app/jobs/**`、`src/components/jobs/job-card.tsx` 的修改。
- 不负责：批次数据（data-refresh / data-acquisition）、脚本（source-tools）、首页（site-design 既有成果保持）。

# 2. 内部结构

```text
src/lib/data.ts                   # 过期标识判定（deadlineBadgeLabel 扩展）；条件字段存在性判定（hasConditionInfo）
src/components/jobs/job-card.tsx  # 「报名已截止」灰色徽标；「条件见来源」规则收敛
src/app/jobs/[id]/page.tsx        # 条件信息分区优化；灰色标识
src/app/jobs/page.tsx             # 列表卡空字段提示（经 JobCard 组件承接，无独立逻辑）
```

# 3. 内部数据流

过期判定：`deadlineDaysLeft(job) < 0` 且 status「招聘中」→ `deadlineBadgeLabel` 返回「报名已截止」，卡片与详情页以中性灰徽标渲染（区别于红色「即将截止」与既有灰色「已截止」状态徽标）；剩余 0–7 天维持红色「x 天后截止／今天截止」语义不变；status「已截止」返回 null，维持既有灰色「已截止」状态徽标不重复展示。

条件提示收敛：`hasConditionInfo(job)` 判定原公告资格条件、学历、薪资、职责、报名方式五个条件字段是否任一非空；全空时卡片与详情页各显示一次统一提示条「条件信息请见来源公告」（卡片位于信息区一处、详情页位于正文顶部），任一存在则按字段渲染且不显示兜底文案。

条件信息分区：详情页正文按「原公告资格条件 → 技能与方向标签 → 报名窗口 → 原页核验锚点 → 本站说明 → 来源与核验」顺序渲染，字段缺失的区块不渲染；原清单中的「申请方式」即报名窗口区块内的「报名方式」行（application_info，docs/interaction.md §7 并入规则），不设独立区块。

# 4. 内部数据结构

无新增数据结构。

# 5. 内部状态机

不适用。
