# 交点 Careers（jiaodian-careers）

## 软件总体设计说明书

> 项目路径：/Users/qianzhang/Desktop/AI agent项目/招聘网址开发/jiaodian-careers
> 生成时间：2026-11-04 16:16（::work -explore 生成，重复执行时整体覆盖）
> 说明：本文档以代码现状为基准校准，含二次开发复用分析。

目标系统：面向人文、社会科学与理工科交叉人才的招聘信息静态网站。

# 1. 文档范围与分工

本文档描述项目整体设计：架构分层、核心架构决策与契约、模块清单、各模块的职责与边界、模块间如何协作与数据如何流动。本文档不写模块内部接口（函数签名、类成员、内部数据结构、子组件细节——归 docs/modules/{模块}_design.md 与 {模块}_interaction.md），不逐条定义交互行为（归 docs/interaction.md）。

| 文档 | 管辖范围 |
| --- | --- |
| docs/requirements.md | 需求：系统要做什么、架构选择（用户决策层）与性能约束、验收口径 |
| docs/design.md（本文档） | 整体设计：架构、契约、模块边界、模块间行为 |
| docs/interaction.md | 交互定义：全部用户交互（逐页面/逐控件）与脚本命令交互 |
| docs/modules/{模块}_design.md | 模块内部设计：内部结构、内部数据流、内部数据结构、内部状态机 |
| docs/modules/{模块}_interaction.md | 模块逐接口交互规格（签名 + 输入/输出/边界检查/错误处理） |
| docs/test.md | 全局测试注册表：全部测试条目（分节）与最近一轮结果 |

# 2. 系统目标与核心抽象

系统目标：把经来源核验的交叉学科招聘信息组织成可筛选、可追溯、可离线部署的静态站点，让求职者看到的每条信息都能回溯到原始公告。

核心业务能力：岗位目录筛选、岗位详情溯源展示、交叉方向归类、本地收藏、实习与分析内容展示、数据核验门禁、市场样本统计。

核心抽象（跨模块概念）：

- **Job**：招聘记录（字段定义唯一定义于 `src/lib/types.ts:1`）。
- **verification_level**：核验层级，四枚举「逐字段核验/来源核验/关键字段核验/待核实」，决定详情页提示条文案、卡片徽标与展示字段范围。
- **source_evidence**：原页核验锚点，字符串数组；校验脚本据此回源命中。
- **ListingKind**：条目形态（具体岗位/招聘公告/招聘项目），由标题正则推导（`src/lib/utils.ts:27`），只影响展示提示，不影响数据。
- **Discipline**：平台维护的交叉方向标签，与公告原文严格分离。
- **RoboticsMarketJob / Dataset**：市场样本及其数据集信封（generated JSON 的 schema，`src/lib/robotics-market.ts:60-90`）。

需求—设计关联表（现状行为 ↔ 本文模块）：

| 需求章节 | 模块 | 用户入口 | 验收条目 |
| --- | --- | --- | --- |
| 需求 §7 岗位目录与筛选 | jobs-catalog | 页面 /jobs | AC-3 |
| 需求 §8 岗位详情 | jobs-catalog | 页面 /jobs/[id] | AC-2、AC-4 |
| 需求 §9 首页 | site-shell | 页面 / | AC-3 |
| 需求 §10 交叉方向与收藏 | site-shell、jobs-catalog | 页面 /directions、/favorites | AC-5 |
| 需求 §11 实习岗位 | content-datasets | 页面 /internships | AC-4 |
| 需求 §12 方向分析与市场 | content-datasets、robotics-market | 页面 /analysis、/market、/market/robotics | AC-6 |
| 需求 §13 核验管线 | verification-pipeline | 脚本 audit:jobs | AC-1、AC-4 |
| 需求 §14 市场采集 | robotics-market | 脚本 collect:robotics | AC-6 |
| 需求 §15 静态导出部署 | site-shell | render.yaml | AC-7 |

# 3. 总体架构

架构形态：单仓库静态站点。**构建期**（本地 Node.js）把数据文件聚合并预渲染为 HTML；**运行期**（浏览器）只做已生成页面的水合与纯客户端筛选/搜索/收藏，无任何后端请求（来源链接跳转除外）。

```text
┌─ 构建期（Node.js）────────────────────────────────────────┐
│  src/data/*.ts（数据文件）                                  │
│      │  白名单聚合（src/lib/data.ts:8）                     │
│      ▼                                                     │
│  scripts/audit-verified-jobs.ts ──失败则 exit 1──✕          │
│      │ 通过（prebuild 跑 offline 模式）                     │
│      ▼                                                     │
│  next build（output: export）                               │
│      │  SSG：/、/jobs、/jobs/[id]×N、/internships、…        │
│      ▼                                                     │
│  out/ 静态文件 ──► Render 静态托管                          │
└────────────────────────────────────────────────────────────┘
┌─ 运行期（浏览器）──────────────────────────────────────────┐
│  静态 HTML + hydrate                                        │
│  筛选/搜索：useSearchParams + getJobs() 内存过滤            │
│  收藏：localStorage('jiaodian-favorites')                   │
└────────────────────────────────────────────────────────────┘
```

架构分层：

- **数据层** `src/data/`：岗位、实习、分析、市场数据的数据文件与脚本产物。
- **逻辑层** `src/lib/`：类型、查询聚合、枚举常量、收藏 hook、市场分析算法。
- **展示层** `src/app/`（路由页面）+ `src/components/`（复用组件）。
- **工具层** `scripts/`：核验脚本与市场采集脚本（命令行运行，不参与站点运行期）。

无控制平面/数据平面划分（无实时通道）。

# 4. 核心架构决策与契约

1. **前台数据白名单契约**：前台岗位目录只允许聚合三份数据文件——`verified-jobs` + `restored-jobs` + `additional-verified-jobs`（唯一定义于 `src/lib/data.ts:8`，核验脚本 `scripts/audit-verified-jobs.ts:26` 同步使用同一白名单）；其中 `verified-jobs.ts:263` 内部展开 `expanded-source-leads`（63 条批量校招线索，来源核验级），故线索数据同样受白名单与核验脚本约束。任何新数据文件进入前台必须同时修改这两处。
2. **核验层级契约**：每条前台岗位必须带 `verification_level`；「待核实」记录不得携带 `source_evidence`、专业、学历、经验、薪资、职责、截止日期中的任何一项（校验规则 `scripts/audit-verified-jobs.ts:33`）；「逐字段核验」的 `source_url` 必须 HTTPS（`scripts/audit-verified-jobs.ts:36`）；前台数据禁止 `is_demo: true`。
3. **证据可复核契约**：`source_evidence` 片段与 `source_title` 在在线核验模式下必须能在来源页 HTML 规范化（去标签、去空白、统一破折号）后逐字命中（`scripts/audit-verified-jobs.ts:46-61`）；规范在 `docs/interaction.md` §脚本交互重申。
4. **数据隔离契约**：`src/data/real-jobs.ts`（3938 行历史候选）与 `src/data/platform-sources.ts` 的平台快照标注 QUARANTINED，不供前台读取；`restored-jobs.ts` 是从 `real-jobs.ts` 按「有直链来源页」过滤并降级为关键字段/来源核验的派生视图（`src/data/restored-jobs.ts:35`）。
5. **分析标签与原文分离契约**：`platform_disciplines`、`required_skills` 为平台标签，可由维护者归纳；`original_major_requirements`、`source_title`、`source_evidence` 为公告原文引用，只能来自来源页。详情页与卡片以「原公告」前缀和「本站说明（非公告原文）」区块区分（`src/app/jobs/[id]/page.tsx:78-96、150-155`）。
6. **ID 契约**：`Job.id` 为数字，全前台白名单内唯一（校验 `scripts/audit-verified-jobs.ts:28`）；详情页路由即 ID。
7. **状态枚举契约**：`status` 三枚举「招聘中/已截止/状态待核实」；「状态待核实」在 UI 呈现为「状态以原文为准」。
8. **静态导出契约**：`output: "export"`、`trailingSlash: true`；构建前强制 `audit:jobs:offline`（`package.json` prebuild）；无服务端运行时，页面数据在构建期固化。
9. **模块协作机制**：全部为进程内直接调用——页面经 `src/lib/data.ts` 的查询函数访问数据，组件经 props 接收数据；无事件总线、无跨进程协议。
10. **全局约定**：日期一律 `YYYY-MM-DD` 字符串；展示层用 `toLocaleDateString('zh-CN')` 转中文；缺失字段用空串/空数组/null 区分（`salary: null` 表示未公开），UI 按字段是否存在决定渲染区块。

# 5. 模块划分与职责边界

模块 ↔ 用户入口映射：

| 模块 | 用户入口 |
| --- | --- |
| jobs-catalog（岗位目录） | 页面 /jobs、/jobs/[id]、/ 部分区块、/favorites |
| site-shell（站点框架） | 全局 Header/Footer、页面 /、/directions |
| content-datasets（内容数据集） | 页面 /internships、/analysis、/market |
| robotics-market（机器人市场） | 页面 /market/robotics、脚本 collect:robotics、public/data 下载 |
| verification-pipeline（核验管线） | 脚本 audit:jobs、构建门禁 |

各模块整体定义：

- **jobs-catalog**（`src/lib/data.ts`、`src/lib/types.ts`、`src/app/jobs/**`、`src/components/jobs/job-card.tsx`、`src/lib/use-favorites.ts`）
  - 职责：聚合白名单数据并提供筛选/排序/分页查询；岗位详情静态生成；收藏的存取。
  - 数据所有权：查询逻辑与筛选语义；不拥有数据文件本身。
  - 边界：不含数据可信规则（归 verification-pipeline）；不含方向归类算法（归 robotics-market）；实习与市场内容不经此模块。
- **site-shell**（`src/app/layout.tsx`、`src/app/page.tsx`、`src/app/directions/page.tsx`、`src/app/globals.css`、`src/components/layout/*`）
  - 职责：全局布局、主题变量（Tailwind 4 `@theme`，`src/app/globals.css:3`）、首页导览、方向定义常量（`src/lib/utils.ts:6-23` 的枚举体系属其数据所有权）。
  - 边界：不含岗位查询与核验逻辑。
- **content-datasets**（`src/data/internship-listings.ts`、`verified-internship-additions.ts`、`robotics-ai-analysis.ts`、`platform-sources.ts`、`src/app/internships/`、`src/app/analysis/`、`src/app/market/page.tsx`）
  - 职责：实习线索、方向分析文案、市场报告与平台快照数据的静态展示。
  - 边界：不参与岗位白名单聚合；平台快照 QUARANTINED 部分不渲染。
- **robotics-market**（`src/lib/robotics-market.ts`、`scripts/collect-robotics-market.ts`、`src/data/generated/robotics-market.json`、`src/app/market/robotics/page.tsx`、`src/components/market/*`）
  - 职责：市场样本的方向分类、薪资标准化、统计分析与数据集生成。
  - 边界：只处理机器人市场样本，不读写 Job 白名单。
- **verification-pipeline**（`scripts/audit-verified-jobs.ts`）
  - 职责：前台数据可信门禁（结构规则 + 在线回源核验）。
  - 边界：只检查不修复；不参与站点运行期；修改核验规则属架构契约变更。

源码布局：

```text
jiaodian-careers/
├── src/
│   ├── app/                    # 路由页面（8 个路由 + 404）
│   │   ├── page.tsx            # 首页
│   │   ├── jobs/page.tsx       # 岗位列表
│   │   ├── jobs/[id]/page.tsx  # 岗位详情（SSG）
│   │   ├── directions/ favorites/ internships/
│   │   ├── analysis/ market/ market/robotics/
│   │   ├── layout.tsx  globals.css  favicon.ico
│   ├── components/
│   │   ├── layout/（header、footer）
│   │   ├── jobs/（job-card）
│   │   └── market/（robotics-job-table、market-pie-chart）
│   ├── data/                   # 数据层
│   │   ├── verified-jobs.ts  restored-jobs.ts  additional-verified-jobs.ts
│   │   ├── real-jobs.ts（隔离） platform-sources.ts（含隔离段）
│   │   ├── internship-listings.ts  verified-internship-additions.ts
│   │   ├── robotics-ai-analysis.ts  expanded-source-leads.ts
│   │   └── generated/robotics-market.json（脚本产物）
│   └── lib/                    # 逻辑层
│       ├── types.ts  data.ts  utils.ts  use-favorites.ts
│       └── robotics-market.ts
├── scripts/
│   ├── audit-verified-jobs.ts  # 核验管线
│   └── collect-robotics-market.ts  # 市场采集
├── public/data/                # 可下载数据（JSON/CSV）
├── next.config.ts  render.yaml  update.sh  package.json
└── 招聘文件/                    # 用户提供的招聘原始表格（.xlsx/.xls，不入库）
```

# 6. 模块间行为与数据流

依赖方向：`app/* → lib/* → data/*`；`scripts → lib + data`；`components → lib`。展示层不直接 import `src/data`（例外：`internships/page.tsx`、`analysis/page.tsx`、`market/robotics/page.tsx` 直接读内容数据集文件——属内容展示特例，见未决项）。

主要数据链：

1. **岗位目录链**：`src/data` 白名单三文件 → `data.ts` 聚合 `allJobs` → `getJobs()` 内存过滤/排序/分页 → 列表页与首页卡片。构建期与运行期各执行一遍（同一段代码在 SSG 与浏览器水合后分别运行，结果一致）。
2. **岗位详情链**：`getJobIds()` → `generateStaticParams` 构建期展开 → 每页 `getJob(id)` 渲染 → 静态 HTML。
3. **核验链**：数据文件变更 → `npm run audit:jobs`（在线回源逐条核对）→ 提交；`npm run build` → prebuild `audit:jobs:offline` 结构门禁 → 通过才继续构建。
4. **市场链**：`collect:robotics` 种子数据 → 分类/标准化/去重/来源可访问性检查 → `generated/robotics-market.json` + `public/data`（JSON/CSV）→ 市场页 `analyzeRoboticsMarket()` 统计渲染。
5. **收藏链**：列表/详情卡片按钮 → `use-favorites` hook → localStorage 读写 → 收藏页按 ID 反查 `getJob()`。

跨模块 DTO 清单：`Job`（jobs-catalog ↔ site-shell 卡片展示）、`InternshipListing`（content-datasets 内部）、`RoboticsMarketDataset`（robotics-market → market 页面）、`Discipline`（site-shell → jobs-catalog 筛选参数）。字段级定义归拥有方模块文档。

# 7. 生命周期与状态机

- **Job.status**：`招聘中 → 已截止`（维护者手动更新；脚本不自动判定）；`状态待核实` 为不确定态（restored-jobs 派生数据默认值）。状态仅影响徽标与排序兜底（截止日期排序把 null 当 9999-12-31）。
- **verification_level 提升路径**：`待核实 → 关键字段核验 → 来源核验 → 逐字段核验`，逐级要求更多原文证据；降级发生在发现来源失效时（withdrawnSourceIds/invalidSourceIds 机制，`src/data/restored-jobs.ts:16-19`）。
- 状态可观察性：列表与详情页直接展示层级与状态；`audit:jobs` 输出各层级计数。

# 8. 并发模型与时间模型

不适用：单进程静态站点，无并发与多时间域问题。（构建期脚本串行 fetch 来源页。）

# 9. 开发轮次规划

不适用：本文档为代码现状梳理（::work -explore 产物）。本轮之后的开发轮次规划由 `::design` 在需求分析阶段重写本节。

# 10. 承接被中断的上轮开发

不适用：无中断归档。

# 11. 复用分析（二次开发）

- **可直接复用**：`Job` 类型体系与字段语义；`audit-verified-jobs.ts` 核验管线（规则集中、可扩展）；`data.ts` 查询聚合模式；页面框架、主题与 `JobCard` 等组件；`use-favorites` 收藏机制；`robotics-market` 分类/标准化/统计算法；`render.yaml` 部署配置。
- **需改造**：
  1. 数据组织：当前 9 份数据文件手工维护、ID 手工分配、`restored-jobs` 从隔离数据派生、`verified-jobs.ts` 内嵌展开 63 条「多地」模糊城市的批量线索——按新需求（数据库规范化管理、便于增补更新）应改造为「单一规范数据源 + 生成/校验管线」的数据组织。
  2. 筛选与展示：需支持事业单位公告与报名截止时间的突出展示、项目管理/产品经理/AI 伦理等跨学科岗位的归类维度（`job_type`/`platform_disciplines` 枚举需扩充）。
  3. 页面设计：首页、列表、详情的信息层级与移动端体验需按新需求优化。
  4. `update.sh` 直接 `git push`，与命令系统「推送统一经 ::push」冲突，需废弃或改造。
- **应废弃/待处理**：`real-jobs.ts` 3938 行未核验历史数据与 `platform-sources.ts` 中 QUARANTINED 平台快照——按新需求「删除虚假信息」逐条回源复核后删除或恢复；`expanded-source-leads.ts` 的批量线索需逐条升级核验、限定到具体城市或移除。

# 12. 测试架构概览

测试分层（现状）：仅「数据核验」一层——`audit:jobs` 兼具结构校验与集成核验（在线回源）职责；无单元测试框架、无 E2E 工具。模块测试责任：核验规则归 verification-pipeline，市场算法无独立测试（仅靠站点渲染观察）。全部测试依据交互文档设计并注册于 `docs/test.md`（待建立，注册格式见 `system/commands/dev.md`「测试文档规范」）。本章只定义预期行为与验证方法；实际测试结果只写入 `docs/test.md`。

# 13. 架构验收标准

- AC-1：`npm run audit:jobs` 退出码 0，输出包含各核验层级计数。
- AC-2：`npm run build` 成功；`out/jobs/` 下每条白名单岗位存在独立 `index.html`。
- AC-3：/jobs 页 9 类筛选、3 种排序、分页行为与 `docs/interaction.md` 对应控件规格一致；URL 参数可复现筛选状态。
- AC-4：前台任何岗位记录带 `verification_level` 与来源链接；「待核实」记录不渲染任何条件字段区块。
- AC-5：收藏操作写入 localStorage 键 `jiaodian-favorites`；收藏页与列表页状态一致。
- AC-6：/market/robotics 统计值可由 `public/data/robotics-market.json` 经 `analyzeRoboticsMarket` 复算。
- AC-7：`render.yaml` 配置与实际构建流程一致（静态站点、发布目录 out、自动部署）。
