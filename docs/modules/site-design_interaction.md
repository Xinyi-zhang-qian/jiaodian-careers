# site-design 模块交互文档

> 用户交互规格见 docs/interaction.md §4、§5（全局框架与首页），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md）：首页职能快捷入口卡（新增）、核验摘要卡（强化）、Header/Footer（经核对与 docs/interaction.md §4 一致，无变化）。
- 内部关键接口：`getJobFunctionEntries(jobs)`（本模块 src/lib/job-function-stats.ts，供首页调用）；首页对 `getJobs` 的只读调用（jobs-ui 所有）。

# 2. 首页职能入口规格

| 项目 | 内容 |
| --- | --- |
| 签名 | `getJobFunctionEntries(jobs: readonly Job[]): { name: string; count: number }[]`；调用方为 src/app/page.tsx 首页 |
| 预期输入 | `jobs`：岗位记录全量数组（首页经 `getJobs({ limit: 1000 }).jobs` 取得）；职能枚举取 `JOB_FUNCTIONS`（data-foundation 在 utils.ts 定义）。统计方式：对每个枚举职能按 `job.job_functions?.includes(职能名)` 本地计数（与 getJobs 的职能过滤同语义） |
| 预期输出 | 仅返回计数 >0 的职能，按计数降序排列（同数按枚举声明顺序）；首页据此渲染职能卡（职能名 + 「N 个岗位」），点击跳转 `/jobs?function={encodeURIComponent(枚举值)}` |
| 边界检查 | 记录无 `job_functions` 字段或为空数组时不计入任何职能；全部职能计数为 0 时不渲染任何职能卡（区块整体不展示）；不修改传入数组 |
| 错误处理 | 纯函数无服务端依赖，不抛异常；枚举缺失属编译期错误，非运行时分支 |

# 3. README 断言

1. README 含「数据增补指引」节：写明 add:jobs 命令用法（`npm run add:jobs -- <json路径> --batch <批次名>`）、JSON 记录必填字段（title、organization、province、city、org_type、job_type、source_url、source_name、source_type、published_at、status、verification_level、source_title、source_evidence）、核验层级与证据要求（逐字段核验 ≥3 段原文证据、核对不到的字段留空禁止补写、报名起止时间只取原文）、audit:jobs 门禁说明。
2. README 不再出现 update.sh 与「Vercel」过时表述（现部署为 Render）。
3. README 的运行命令与 package.json scripts 一致：README 中每个 `npm run X` 必须能在 package.json scripts 中找到登记（含 add:jobs、recheck:legacy、test）。

# 4. 界面断言

1. 首页出现职能快捷入口且有岗位的职能计数正确（与 /jobs?function= 筛选结果一致）。
2. 全站核验徽标颜色符合 docs/interaction.md §3 色彩协议（逐字段绿/来源蓝/关键字段琥珀/待核实黄/即将截止红）。
3. 首页核验摘要数字与 jobsCatalog 实际层级分布一致。
