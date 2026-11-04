# site-design 模块设计文档

> 全局契约引用 docs/design.md §4（契约 16）、§5；本模块对应 design.md 的 site-shell 视觉部分与 site-design 治理工作。

# 1. 模块职责与边界

- 职责：首页视觉与信息层级优化 + 职能快捷入口；全局徽标色彩体系统一；README 规范化重写（含数据增补指引）；移除 update.sh；文档同步检查。
- 数据所有权：`src/app/page.tsx`、`src/app/globals.css`、`src/components/layout/header.tsx`、`src/components/layout/footer.tsx`、`README.md`；删除 `update.sh`。
- 不负责：/jobs 与 /jobs/[id] 页面（jobs-ui）、数据层、`src/lib/utils.ts` 枚举（data-foundation；首页职能入口只读取枚举，worktree 内以最小桩编译，合并以 data-foundation 为准）。

# 2. 内部结构

```text
src/app/page.tsx             # 首页：职能快捷入口卡、核验摘要强化、布局层次
src/app/globals.css          # 主题变量微调（徽标色彩统一所需的语义色）
src/components/layout/*      # 导航与页脚（如有视觉调整）
README.md                    # 面向使用者：简介、运行、数据增补指引、目录结构
```

# 3. 内部数据流

首页职能入口：读取 JOB_FUNCTIONS 枚举 → `getJobCountByFunction`（jobs-ui 在 data.ts 提供？否——data.ts 归 jobs-ui 所有。为避免跨模块接口依赖，首页职能入口直接复用 getJobs({ job_function }) 统计计数）→ 渲染有岗位的职能卡片，链接 `/jobs?function={枚举值}`。

README 结构：项目简介 → 在线访问 → 功能 → 本地运行与数据核验 → **数据增补指引**（add:jobs 流程、证据要求、核验层级规则摘要）→ 目录结构 → 部署（Render；推送经命令系统 ::push）。

# 4. 内部数据结构

无新增数据结构。

# 5. 内部状态机

不适用。
