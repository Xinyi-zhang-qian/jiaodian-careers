# site-design 模块设计文档

> 全局契约引用 docs/design.md §4（契约 16）、§5；本模块对应 design.md 的 site-shell 视觉部分与 site-design 治理工作。

# 1. 模块职责与边界

- 职责：首页视觉与信息层级优化 + 职能快捷入口；全局徽标色彩体系统一；README 规范化重写（含数据增补指引）；文档同步检查。
- 数据所有权：`src/app/page.tsx`、`src/app/globals.css`、`src/components/layout/header.tsx`、`src/components/layout/footer.tsx`、`README.md`；删除 `update.sh`。
- 不负责：/jobs 与 /jobs/[id] 页面（jobs-ui）、数据层、`src/lib/utils.ts` 枚举（data-foundation 定义，首页职能入口只读取枚举）。

# 2. 内部结构

```text
src/app/page.tsx                 # 首页：职能快捷入口卡、核验摘要强化、布局层次
src/lib/job-function-stats.ts    # 职能入口计数纯函数（本模块新增，只依赖 utils 枚举与 Job 类型）
src/app/globals.css              # 主题变量微调（徽标色彩统一所需的语义色，不改动既有变量取值）
src/components/layout/*          # 导航与页脚（经核对与 docs/interaction.md §4 一致，本轮不改）
README.md                        # 面向使用者：简介、运行、数据增补指引、目录结构、部署
```

# 3. 内部数据流

首页职能入口：读取 JOB_FUNCTIONS 枚举（data-foundation 在 utils.ts 定义）→ `getJobs({ limit: 1000 }).jobs` 取全量记录 → `getJobFunctionEntries(jobs)` 纯函数本地统计：对每个枚举职能按 `job.job_functions?.includes(职能名)` 计数（与 getJobs 的职能过滤同语义）→ 过滤计数 >0 的职能、按计数降序（同数按枚举顺序）→ 渲染职能卡（职能名 + N 个岗位），链接 `/jobs?function={encodeURIComponent(枚举值)}`。全部职能计数为 0 或枚举不可用时区块整体不渲染，不抛异常。

核验摘要卡：三级核验计数逻辑保持（逐字段/来源/关键字段），补充一句「数据来源与核验方式」简短说明，不改变数据语义。

README 结构：项目简介 → 在线访问 → 功能清单 → 本地运行（npm ci / dev / build / test）→ **数据增补指引**（add:jobs 用法、JSON 必填字段、核验层级与证据要求、audit:jobs 门禁）→ 目录结构（含 src/data/jobs/ 规范数据源）→ 部署（Render 静态站点；推送经命令系统 ::push）。

# 4. 内部数据结构

无新增数据结构。

# 5. 内部状态机

不适用。
