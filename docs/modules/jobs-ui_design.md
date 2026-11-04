# jobs-ui 模块设计文档

> 全局契约引用 docs/design.md §4（契约 11、12）、§5；本模块对应 design.md 的 jobs-catalog 开发执行单元。

# 1. 模块职责与边界

- 职责：查询层同源化与扩展（职能筛选、即将截止计算）；列表页职能筛选控件与「即将截止」徽标；详情页「报名窗口」区块；列表与详情页视觉层级优化。
- 数据所有权：`src/lib/data.ts`、`src/lib/use-favorites.ts`、`src/app/jobs/**`、`src/components/jobs/job-card.tsx`。
- 不负责：`src/lib/types.ts`/`src/lib/utils.ts`（data-foundation 所有；本模块只读取，worktree 内以最小桩使编译通过，合并时以 data-foundation 版本为准）、首页（site-design）。

# 2. 内部结构

```text
src/lib/data.ts             # getJobs 扩展 function 筛选；getUpcomingDeadlineDays 辅助
src/app/jobs/page.tsx       # 新增「岗位职能」下拉；URL 参数 function
src/app/jobs/[id]/page.tsx  # 新增「报名窗口」区块与「即将截止」徽标
src/components/jobs/job-card.tsx  # 「即将截止」徽标；视觉层级调整
```

# 3. 内部数据流

筛选链：URL `function` 参数 → getJobs({ job_function }) → `job.job_functions?.includes(值)` 匹配（字段缺省视为空数组，不匹配任何职能）→ 与既有过滤链串联（顺序不变，追加在 primary_discipline 之后）。即将截止：`deadlineDaysLeft(job)` = deadline 与当前日期差（客户端构建时区按浏览器本地时区的日期差计算，仅用日期部分）；≤7 且 status==='招聘中' → 徽标。列表页每次筛选变化重算（纯函数，无状态）。

# 4. 内部数据结构

- getJobs 新增过滤器：`job_function?: string`（枚举值，空串/缺省=不过滤）。
- `deadlineDaysLeft(job): number | null`——无 deadline 或已截止返回 null；否则返回剩余天数（今天=0）。
- 报名窗口区块渲染条件：`application_opens_at || deadline || listingKind !== '具体岗位'`。

# 5. 内部状态机

不适用。
