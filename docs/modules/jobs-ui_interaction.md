# jobs-ui 模块交互文档

> 用户交互规格见 docs/interaction.md §6、§7（列表页与详情页控件表），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md）：岗位职能下拉、「即将截止」徽标、报名窗口区块、分页/排序（既有）。
- 内部关键接口：`getJobs`（扩展）、`deadlineDaysLeft`。

# 2. getJobs 扩展规格

- 签名：`getJobs(filters: { …既有…, job_function?: string })`（调用方：/jobs 页、首页）。
- 预期输入：`job_function` 为 JOB_FUNCTIONS 枚举值或空/缺省。
- 预期输出：过滤结果（与既有字段组合为 AND）；排序分页行为不变。
- 边界检查：`job_function` 非枚举值 → 视为不过滤（与其他枚举过滤器行为一致）；记录无 `job_functions` 字段 → 不命中任何职能筛选。
- 错误处理：无（纯内存过滤）。

# 3. deadlineDaysLeft 规格

- 签名：`deadlineDaysLeft(job: Job): number | null`。
- 预期输入：Job 记录。
- 预期输出：deadline 缺省或 status 为「已截止」→ null；否则剩余天数整数（deadline 当天=0）。
- 边界检查：deadline 早于今天 → 返回负数（UI 据此显示「已过期」不显示倒计时徽标，状态展示仍按 status 字段）；deadline 非 YYYY-MM-DD → null（audit 已拦截格式，此处防御）。
- 错误处理：日期解析失败返回 null，不抛异常。

# 4. 界面断言（与 docs/interaction.md §13 对应）

1. 职能下拉选择后列表只含该职能记录；URL 出现 `function=` 参数；清除后恢复。
2. deadline 距今 3 天且「招聘中」的记录：卡片与详情页出现红色「3 天后截止」；status「已截止」或无 deadline 不出现。
3. 详情页对事业单位公告（org_type 事业单位且公告级条目）展示报名窗口区块；字段缺失行不渲染、不编造。
4. 既有 9 类筛选、排序、分页、收藏行为全部不回归。
