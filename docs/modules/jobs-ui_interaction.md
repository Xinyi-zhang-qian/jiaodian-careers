# jobs-ui 模块交互文档

> 用户交互规格见 docs/interaction.md §6、§7（列表页与详情页控件表），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md）：岗位职能下拉、「即将截止」徽标、报名窗口区块、分页/排序（既有）。
- 内部关键接口：`getJobs`/`filterJobs`（扩展）、`deadlineDaysLeft`、`deadlineBadgeLabel`、`applicationWindow`。

# 2. getJobs / filterJobs 扩展规格

| 项目 | 内容 |
| --- | --- |
| 签名 | `filterJobs(jobs: Job[], filters: JobFilters): Job[]`（纯函数，不含分页，供 getJobs 与测试复用）；`getJobs(filters: JobFilters & { page?: number; limit?: number })`（调用方：/jobs 页、首页）。 |
| 预期输入 | `job_function` 为 JOB_FUNCTIONS 枚举值或空/缺省；其余过滤器同既有。 |
| 预期输出 | 过滤结果（与既有字段组合为 AND）；排序分页行为不变。 |
| 边界检查 | `job_function` 非枚举值 → 视为不过滤（返回全量，与 docs/interaction.md §6「非枚举值按无筛选处理」一致）；记录无 `job_functions` 字段 → 不命中任何职能筛选。 |
| 错误处理 | 无（纯内存过滤）。 |

# 3. deadlineDaysLeft 规格

| 项目 | 内容 |
| --- | --- |
| 签名 | `deadlineDaysLeft(job: Job, today?: Date): number | null`（today 仅供测试注入当前日期，缺省取系统今天）。 |
| 预期输入 | Job 记录；deadline 为 `YYYY-MM-DD` 字符串或空。 |
| 预期输出 | deadline 缺省或 status 为「已截止」→ null；否则剩余天数整数（deadline 当天=0，过去为负）。 |
| 边界检查 | deadline 非 `YYYY-MM-DD` 或为不存在的日历日期（如 02-30）→ null；status 为「状态待核实」时仍按 deadline 计算（是否展示由 deadlineBadgeLabel 决定）。 |
| 错误处理 | 日期解析失败返回 null，不抛异常。 |

# 4. deadlineBadgeLabel 规格

| 项目 | 内容 |
| --- | --- |
| 签名 | `deadlineBadgeLabel(job: Job, today?: Date): string | null`（调用方：JobCard、详情页）。 |
| 预期输入 | Job 记录。 |
| 预期输出 | 剩余天数 0 ≤ N ≤ 7 且 status 为「招聘中」→ 徽标文案（0 天为「今天截止」，其余为「{N} 天后截止」）；其余情形 → null。 |
| 边界检查 | status 非「招聘中」（含「已截止」「状态待核实」）→ null；剩余天数为负（已过期）或大于 7 → null；无有效 deadline → null。 |
| 错误处理 | 无（内部复用 deadlineDaysLeft，解析失败按 null 处理）。 |

# 5. applicationWindow 规格

| 项目 | 内容 |
| --- | --- |
| 签名 | `applicationWindow(job: Job, listingKind: ListingKind): { visible: boolean; publicRecruitNotice: boolean }`（调用方：详情页）。 |
| 预期输入 | Job 记录与 `getListingKind(job.title)` 的结果。 |
| 预期输出 | visible：有 application_opens_at、deadline、application_info 之一，或条目为公告/项目级（非「具体岗位」）→ true；publicRecruitNotice：visible 且公告/项目级且 org_type 为「事业单位」→ true。 |
| 边界检查 | 公告/项目级但无任何报名窗口字段 → visible 为 true，详情页仅渲染「报名安排详见来源公告」提示行；具体岗位且三个字段全空 → visible 为 false。 |
| 错误处理 | 无（纯判定）。 |

# 6. 界面断言（与 docs/interaction.md §13 对应）

1. 职能下拉选择后列表只含该职能记录；URL 出现 `function=` 参数；清除后恢复；非枚举值与空值视为不过滤。
2. deadline 距今 3 天且「招聘中」的记录：卡片与详情页出现红色「3 天后截止」；status「已截止」或无 deadline 不出现；8 天与已过期不出现；当天显示「今天截止」。
3. 详情页对事业单位公告（org_type 事业单位且公告级条目）展示报名窗口区块并标注「事业单位公开招聘」；字段缺失行不渲染、不编造。
4. 既有 9 类筛选、排序、分页、收藏行为全部不回归；报名窗口区块合并原「申请方式与材料」「截止日期」区块后，application_info 与 deadline 的展示不丢失。
