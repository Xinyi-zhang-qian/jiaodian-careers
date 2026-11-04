# jobs-ui 模块设计文档

> 全局契约引用 docs/design.md §4（契约 11、12）、§5；本模块对应 design.md 的 jobs-catalog 开发执行单元。

# 1. 模块职责与边界

- 职责：查询层同源化与扩展（职能筛选、即将截止计算）；列表页职能筛选控件与「即将截止」徽标；详情页「报名窗口」区块（合并原「申请方式与材料」「截止日期」两个独立区块）；列表与详情页视觉层级优化。
- 数据所有权：`src/lib/data.ts`、`src/lib/use-favorites.ts`、`src/app/jobs/**`、`src/components/jobs/job-card.tsx`。
- 不负责：`src/lib/types.ts`/`src/lib/utils.ts`（data-foundation 所有；本模块只追加桩成员使编译通过，合并时以 data-foundation 版本为准，冲突按并集解决）、规范数据源实体文件（`src/data/jobs/` 批次文件归 jobs-dataset；本 worktree 内只创建最小聚合桩 `src/data/jobs/index.ts`，合并时被 data-foundation 的真实版本整体替换）、首页（site-design）、globals.css（site-design）。

# 2. 内部结构

```text
src/lib/types.ts                   # 桩：Job 接口追加 application_opens_at?、job_functions?（与 data-foundation 定义一致）
src/lib/utils.ts                   # 桩：追加 JOB_FUNCTIONS 职能枚举常量（契约 12）
src/lib/data.ts                    # filterJobs（纯筛选排序）、getJobs（分页包装）与既有查询；
                                   # deadlineDaysLeft / deadlineBadgeLabel / applicationWindow 纯判定函数
src/data/jobs/index.ts             # 桩：聚合既有三个数据文件导出 jobsCatalog（合并时整体替换）
src/app/jobs/page.tsx              # 新增「岗位职能」下拉（位于岗位类型与学历之间）；URL 参数 function
src/app/jobs/[id]/page.tsx         # 新增「报名窗口」区块与标题旁「即将截止」徽标
src/components/jobs/job-card.tsx   # 「即将截止」红色徽标；标题与徽标排布调整
```

# 3. 内部数据流

筛选链：URL `function` 参数 → 页面状态 `job_function` → getJobs({ job_function }) → filterJobs 中先校验该值 ∈ JOB_FUNCTIONS（空值与非枚举值视为未选择，不过滤），再按 `job.job_functions?.includes(值)` 匹配（字段缺省视为空数组，不命中任何职能）→ 追加在 primary_discipline 之后，与既有过滤链 AND 串联，顺序不变；排序、分页行为不变。

即将截止：`deadlineDaysLeft(job, today?)` = deadline 与当前日期的日历差（按本地时区取日期部分；today 仅供测试注入，缺省取系统今天）；`deadlineBadgeLabel(job, today?)` 在 0 ≤ 天数 ≤ 7 且 status==='招聘中' 时返回徽标文案（0 天为「今天截止」，其余为「{N} 天后截止」）。列表页为客户端组件，每次渲染重算；详情页为静态导出，徽标按构建时日期计算，随每次推送重建刷新。

报名窗口：`applicationWindow(job, listingKind)` 返回 `{ visible, publicRecruitNotice }`。visible = 有 application_opens_at、deadline、application_info 之一，或条目为公告/项目级（getListingKind 非「具体岗位」）；publicRecruitNotice = visible 且公告/项目级且 org_type==='事业单位'。区块内行按字段存在性渲染；公告/项目级条目无任何字段时仅显示「报名安排详见来源公告」提示行，不渲染字段行、不编造。

# 4. 内部数据结构

- getJobs/filterJobs 过滤器：既有字段外新增 `job_function?: string`（枚举值；空串/缺省/非枚举值 = 不过滤）。
- `deadlineDaysLeft(job: Job, today?: Date): number | null`——无 deadline、status 为「已截止」或日期非法（非 YYYY-MM-DD 或不存在的日历日期）返回 null；否则返回剩余天数整数（今天=0，过去为负）。
- `deadlineBadgeLabel(job: Job, today?: Date): string | null`——status 非「招聘中」、剩余天数越界（<0 或 >7）或无有效 deadline 返回 null；否则返回徽标文案。
- `applicationWindow(job: Job, listingKind): { visible: boolean; publicRecruitNotice: boolean }`——报名窗口区块渲染判定；事业单位的公告/项目级条目 publicRecruitNotice 为 true。
- 报名窗口区块内容行：报名开始（application_opens_at）、报名截止（deadline）、报名方式（application_info），字段缺失的行不渲染。

# 5. 内部状态机

不适用。
