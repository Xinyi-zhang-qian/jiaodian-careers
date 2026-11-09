# 交点 Careers（jiaodian-careers）

## 软件总体设计说明书

> 版本：V3.0（第 3 轮需求分析 ::design 更新）
> 依据：docs/requirements.md V4.0（已批准）

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

系统目标：把经来源核验的交叉学科招聘信息组织成可筛选、可追溯、可离线部署的静态站点；数据组织规范化，使岗位的持续增补、复核与下架成为可重复的流水线。

核心业务能力：规范化数据源管理、来源核验门禁、遗留数据复核清理、岗位目录筛选（含职能与截止时间维度）、岗位详情溯源展示、交叉方向归类、本地收藏、内容页展示、市场样本统计。

核心抽象（跨模块概念，唯一定义）：

- **Job**：招聘记录。字段定义在 `src/lib/types.ts` 的 `Job` 接口（本轮扩展 `application_opens_at`、`job_functions`，见 §4 契约 11、12）。
- **verification_level**：核验层级，四枚举「逐字段核验/来源核验/关键字段核验/待核实」，决定展示范围与提示文案。
- **source_evidence**：原页核验锚点，字符串数组，校验脚本据此回源命中。
- **批次（batch）**：规范数据源 `src/data/jobs/` 下的一个数据文件，代表一次采集或一个来源群的记录集合。
- **ListingKind**：条目形态（具体岗位/招聘公告/招聘项目），由标题正则推导，只影响展示提示。
- **Discipline / JobFunction**：两类平台标签——学科交叉方向（11 个）与岗位职能（项目管理、产品经理、AI 伦理等），均与公告原文严格分离。
- **报名窗口**：`application_opens_at`（报名开始）+ `deadline`（报名/申请截止）+ `application_info`（报名方式）的组合概念。
- **RoboticsMarketJob / Dataset**：市场样本及其数据集信封。

需求—设计关联表：

| 需求章节 | 模块 | 用户入口 | 验收条目 |
| --- | --- | --- | --- |
| 需求 §7 岗位目录与筛选（展示强化） | jobs-catalog | 页面 /jobs | AC-3、AC-6、AC-16 |
| 需求 §8 岗位详情（信息充实） | jobs-catalog | 页面 /jobs/[id] | AC-2、AC-4、AC-7、AC-14 |
| 需求 §9 岗位信息充实 | source-tools、data-refresh | 脚本 extract:fields | AC-14 |
| 需求 §10 失效来源刷新与清理 | source-tools、data-refresh | 脚本 refresh:sources | AC-15 |
| 需求 §11 信息源与提取流程优化 | source-tools | 脚本 extract:fields 两阶段 | AC-14 |
| 需求 §12 信息展示优化 | jobs-catalog | 页面 /jobs、/jobs/[id] | AC-16 |
| 需求 §13 三类单位岗位补充 | data-acquisition | 规范化增补流程 | AC-17 |
| 需求 §13（大厂综合岗位，功能清单第 17 项） | data-acquisition | 规范化增补流程 | AC-18 |
| 需求 §13（京沪事业单位加量，功能清单第 18 项） | data-acquisition | 规范化增补流程 | AC-19 |
| 既有：内容页、市场、收藏、交叉方向 | site-shell、content-datasets、robotics-market | 对应页面与脚本 | AC-5、AC-8 |
| 既有：核验管线与数据增补 | verification-pipeline、jobs-dataset | 脚本 audit:jobs、add:jobs | AC-1、AC-9 |
| 既有：遗留复核与静态部署 | legacy-cleanup、site-shell | 脚本 recheck:legacy、render.yaml | AC-10、AC-13 |

# 3. 总体架构

架构形态不变：单仓库静态站点。**构建期**（本地 Node.js）聚合规范数据源并预渲染；**运行期**（浏览器）纯客户端筛选/搜索/收藏，无后端请求。

```text
┌─ 构建期（Node.js）────────────────────────────────────────────┐
│  src/data/jobs/*.ts（规范数据源，按批次）                       │
│      │  index.ts 聚合 → jobsCatalog（唯一前台数据入口）         │
│      ▼                                                        │
│  scripts/audit-verified-jobs.ts ──失败 exit 1──✕（门禁）        │
│      │ 通过（prebuild 跑 offline 模式）                        │
│      ▼                                                        │
│  next build（output: export）→ out/ ──► Render 静态托管         │
└────────────────────────────────────────────────────────────────┘
┌─ 维护期（命令行，新增）────────────────────────────────────────┐
│  add:jobs（增补录入） audit:jobs（核验）── 读写 src/data/jobs/   │
│  recheck:legacy（遗留复核）── 读写 workspace/legacy-recheck/     │
└────────────────────────────────────────────────────────────────┘
┌─ 运行期（浏览器）──────────────────────────────────────────────┐
│  筛选/搜索：URL 参数 ↔ getJobs() 内存过滤（新增职能维度）        │
│  收藏：localStorage('jiaodian-favorites')                      │
└────────────────────────────────────────────────────────────────┘
```

架构分层：数据层 `src/data/`（规范数据源 + 内容数据集 + 市场产物）、逻辑层 `src/lib/`、展示层 `src/app/` + `src/components/`、工具层 `scripts/`（核验、增补、复核、采集）。

# 4. 核心架构决策与契约

既有契约（保持）：

1. **前台数据白名单契约**：前台岗位目录唯一数据入口为规范数据源聚合结果 `jobsCatalog`（本轮起唯一定义于 `src/data/jobs/index.ts`）；`src/lib/data.ts` 与 `scripts/audit-verified-jobs.ts` 同源引用，不再各自拼接文件清单。
2. **核验层级契约**：每条前台岗位必须带 `verification_level`；「待核实」不得携带任何未核验条件字段；「逐字段核验」来源必须 HTTPS；前台禁止 `is_demo: true`。规则集中在 `scripts/audit-verified-jobs.ts`。
3. **证据可复核契约**：`source_evidence` 片段与 `source_title` 在在线核验中必须能在来源页 HTML 规范化后逐字命中。
4. **数据隔离契约**：未核验历史数据不进入前台；遗留数据的复核与处置以 recheck:legacy 的报告-确认流程为准（首轮全量复核与处置已于 2026-11-04 完成，遗留清单文件已移除）。
5. **分析标签与原文分离契约**：`platform_disciplines`、`required_skills`、`job_functions` 为平台标签；`original_major_requirements`、`source_title`、`source_evidence` 为公告原文引用，只能来自来源页。
6. **ID 契约**：`Job.id` 全目录唯一，由 add:jobs 自动分配（现有最大值 +1 递增），人工不得手填。
7. **状态枚举契约**：`status` 三枚举「招聘中/已截止/状态待核实」。
8. **静态导出契约**：`output: "export"`、`trailingSlash: true`；prebuild 强制 offline 审计；无服务端运行时。
9. **模块协作机制**：全部进程内直接调用；页面数据经 `src/lib/data.ts` 访问；无事件总线。
10. **全局约定**：日期 `YYYY-MM-DD` 字符串；空值语义——省略/空串/空数组/`null` 按字段既有语义区分（`salary: null` = 未公开）；UI 按字段存在性决定渲染。

本轮新增契约：

11. **报名窗口契约**：`application_opens_at`（可空，`YYYY-MM-DD`）表示报名开始；`deadline` 语义统一为「报名/申请截止日期」（岗位级与公告级一致）；原文明确「长期有效」「招满为止」等表述时不填 `deadline`，以 `application_info` 原文承载；UI 的「即将截止」判定只依据 `deadline`（7 日内且 status 为「招聘中」）。
12. **职能标签契约**：`job_functions: string[]` 为平台维护的岗位职能标签，枚举初始为「项目管理、产品经理、AI伦理、算法、工程、数据、科研、编辑出版、综合管理、其他」（定义于 `src/lib/utils.ts`，扩充须经 ::design）；与 `job_type`（单值，公告原文倾向）互补，多选。
13. **批次文件契约**：`src/data/jobs/{批次名}.ts` 每文件导出 `Job[]`，文件头注释注明采集日期与来源范围；批次文件只增改记录，不承载逻辑；`index.ts` 显式列出全部批次并聚合，禁止目录扫描式动态导入（保证构建期静态可分析）。
14. **增补入口契约**：新增岗位一律经 `npm run add:jobs` 录入（输入 JSON → 校验 → 自动 ID → 写入批次文件 → 自动 offline 审计）；直接手工编辑批次文件不被禁止，但必须通过同一 audit 门禁。
15. **遗留复核契约**：遗留数据的复核与处置以 `recheck:legacy` 报告为唯一依据，报告归档于 `workspace/legacy-recheck/`（本地工作产物，不入库）；处置动作（迁入/删除）体现在 git 历史中。
16. **推送通道契约**：一切远程同步经命令系统的 `::push`（用户手动触发），不设其他推送脚本。
17. **提取辅助契约**：`npm run extract:fields` 两阶段——`--scan`（抓取指定记录的来源页，抽取候选条件字段与其证据片段位置，产出到 `workspace/extract/`，只读不写库）与 `--apply <json>`（把人工确认的字段与证据写入对应批次文件，同步更新核验层级与 last_verified）；apply 后必须通过 `audit:jobs:offline` 才能提交；提取出的字段必须能在来源页命中（在线审计保证），核对不到的字段留空。
18. **来源刷新契约**：`npm run refresh:sources` 遍历前台记录在线访问来源页，分类「现行有效（证据命中）/ 内容失配（页面存在但锚点不命中）/ 来源过期（404、过期提示页、失效跳转）」，产出到 `workspace/source-refresh/`；对失效记录的处置（重新检索后刷新，或删除）由 data-refresh 执行并留痕（批次头注释处置记录）；状态修正随处置执行：截止已过仍标「招聘中」的记录改「已截止」或删除。
19. **空字段展示契约**：界面按字段存在性渲染；「条件见来源」提示仅用于没有任何条件字段的记录；deadline 早于当日仍标「招聘中」的记录在卡片与详情页显示灰色「报名已截止」标识（此类记录应在刷新处置中收敛）。
20. **用户画像存储契约**：画像存 localStorage 键 `jiaodian-profile`，结构 `{ education: [{ stage, major }], work: [{ title }], skills: [string] }`；全部读写与匹配计算在浏览器本地完成，不上传；解析失败按空画像处理。
21. **匹配契约**：打分函数为纯函数，输入画像与 jobsCatalog，输出按分排序的 `MatchResult[]`（岗位 + 得分 + 理由列表）；打分只使用平台标签（platform_disciplines、job_functions、required_skills/preferred_skills）与已核验字段（title、original_major_requirements 原文包含匹配、education 学历别名对照）；理由逐条可读（画像条目 ↔ 岗位字段）；权重集中定义可调。

# 5. 模块划分与职责边界

模块 ↔ 用户入口映射：

| 模块 | 用户入口 |
| --- | --- |
| jobs-dataset（规范数据源） | 脚本 add:jobs |
| verification-pipeline（核验管线） | 脚本 audit:jobs、构建门禁 |
| legacy-cleanup（遗留复核清理） | 脚本 recheck:legacy |
| data-acquisition（数据增补） | 规范化增补流程（研究 + add:jobs 录入） |
| jobs-catalog（岗位目录） | 页面 /jobs、/jobs/[id]、/ 部分区块、/favorites |
| site-shell（站点框架） | 全局 Header/Footer、页面 /、/directions |
| content-datasets（内容数据集） | 页面 /internships、/analysis、/market |
| robotics-market（机器人市场） | 页面 /market/robotics、脚本 collect:robotics |
| site-design（页面与文档治理） | 页面视觉、README、docs/ 维护 |
| source-tools（第 2 轮新增） | 脚本 extract:fields、refresh:sources |
| data-refresh（第 2 轮执行单元） | 信息充实、来源刷新与清理的执行 |
| jobs-catalog 第 2 轮强化 | 过期标识与展示优化 |
| match-engine（第 3 轮新增） | 匹配打分与理由生成（src/lib/match.ts） |
| match-ui（第 3 轮新增） | 页面 /match、画像编辑器与推荐列表（src/app/match/**、src/components/match/**、src/lib/use-profile.ts） |
| detail-enrich（第 3 轮执行单元） | 详情页全量字段展示 + 稀疏记录补提取 |

各模块整体定义：

- **jobs-dataset**（`src/data/jobs/`、`scripts/add-jobs.ts`）
  - 职责：定义并承载规范化岗位数据源；提供增补录入入口（校验、自动 ID、写入批次、触发审计）与一次性迁移（旧三文件 + leads 存活记录迁入）。
  - 数据所有权：`src/data/jobs/` 全部批次文件（前台岗位数据的唯一存放地）。
  - 边界：不含展示逻辑；不裁决核验层级语义（归 verification-pipeline）；不做来源网页研究（归 data-acquisition）。
- **verification-pipeline**（`scripts/audit-verified-jobs.ts`）
  - 职责：前台数据可信门禁——结构规则（唯一 ID、层级、证据完整性、报名窗口字段合法性）+ 在线回源核对。
  - 边界：只检查不修复；数据源切换后同源读取 `jobsCatalog`。
- **legacy-cleanup**（`scripts/recheck-legacy.ts`）
  - 职责：对三块遗留数据（real-jobs、platform-sources 快照、expanded-source-leads）逐条回源复核，产出分类报告（可升级/需人工复核/建议下架）。
  - 边界：只产出报告与建议，不直接改前台数据；处置由维护者确认后经 add:jobs/删除完成。
- **data-acquisition**（内容工作，无独立源码）
  - 职责：按需求 §13 采集事业单位、科研院所、新型研究机构、大厂综合岗位与京沪事业单位增补，整理为符合模式定义的记录，经批次文件或 add:jobs 录入。
  - 边界：只产出记录与证据；不修改管线与展示代码。
- **jobs-catalog**（`src/lib/data.ts`、`src/lib/types.ts`、`src/lib/use-favorites.ts`、`src/app/jobs/**`、`src/components/jobs/job-card.tsx`）
  - 职责：从 `jobsCatalog` 提供筛选/排序/分页查询（新增职能筛选与即将截止标识）；岗位详情静态生成；收藏。
  - 边界：不含数据可信规则与职能枚举定义（枚举归 site-shell 的 utils 常量体系）。
- **site-shell**（`src/app/layout.tsx`、`src/app/page.tsx`、`src/app/directions/`、`src/app/globals.css`、`src/components/layout/*`、`src/lib/utils.ts`）
  - 职责：全局布局与主题、首页导览、枚举常量体系（地区、学科、职能、类型、学历、状态）。
  - 边界：不含岗位查询与核验逻辑。
- **content-datasets**（实习、分析、市场内容数据与页面）
  - 职责：静态内容展示；本轮随清理更新实习与市场数据中被判定失效的记录。
  - 边界：不参与岗位目录聚合。
- **robotics-market**（市场样本采集与分析）
  - 职责：保持现状（分类、标准化、统计、生成）。
  - 边界：不读写岗位目录。
- **site-design**（横切治理工作，无独立源码目录）
  - 职责：首页/列表/详情视觉层级优化、核验徽标体系统一、README 与 docs 规范化维护；首页职能入口计数纯函数 `src/lib/job-function-stats.ts` 归其所有。
  - 边界：不改变交互逻辑与数据语义。
- **match-engine**（第 3 轮新增，`src/lib/match.ts`）
  - 职责：画像↔岗位匹配的打分纯函数与理由生成；权重集中定义。
  - 数据所有权：匹配算法与权重配置。
  - 边界：不做 UI；不读写存储（画像由 use-profile 提供）；不使用未核验字段。
- **match-ui**（第 3 轮新增，`src/app/match/page.tsx`、`src/components/match/*`、`src/lib/use-profile.ts`）
  - 职责：画像三组条目的增删编辑与本地持久化；调用 match-engine 渲染推荐列表（复用 JobCard）与理由；空画像引导态。
  - 数据所有权：localStorage `jiaodian-profile` 的读写 hook。
  - 边界：不含打分逻辑（归 match-engine）；不改变既有页面。
- **detail-enrich**（第 3 轮执行模块）
  - 职责：①详情页条件信息区按「字段存在性」渲染（替代层级门槛）：凡记录拥有学历/经验/专业要求/薪资等字段即展示（展示口径仍标核验层级）；②新增职能标签与招聘类型展示；③对 9 条稀疏记录与可补的关键字段记录执行补充提取（extract:fields --scan/--apply）。
  - 边界：批次修改经审计门禁；不改匹配逻辑。
- **source-tools**（第 2 轮新增，`scripts/extract-fields.ts`、`scripts/refresh-sources.ts`、`scripts/lib/` 复用基建）
  - 职责：提取辅助两阶段命令（scan 候选 / apply 写库）与来源刷新分类命令；复用 recheck-core 的抓取与规范化基建。
  - 数据所有权：上述三个脚本；`workspace/extract/`、`workspace/source-refresh/`（本地产物）。
  - 边界：scan 不写库；apply 写库后不自动提交（审计门禁 + 人工提交）；不做处置决策（归 data-refresh）。
- **data-refresh**（第 2 轮执行模块，无新增源码）
  - 职责：按 source-tools 产出的清单执行——对现行有效记录做字段充实（目标 ≥60 条升级或补齐）、对失配/过期记录重新检索现行来源后刷新、确认无现行来源的删除、状态修正；处置全部留痕。
  - 边界：只改批次文件与 `docs/test.md` 本模块小节；不修改管线脚本与页面代码。
- **jobs-catalog 第 2 轮强化**：过期标识（契约 19）、详情页条件信息分区与空提示优化。

源码布局（本轮目标状态）：

```text
jiaodian-careers/
├── src/
│   ├── app/                    # 路由页面（9 个页面路由 + 404，含 /match）
│   ├── components/             # layout / jobs / market
│   ├── data/
│   │   ├── jobs/               # ★ 本轮新增：规范数据源
│   │   │   ├── index.ts        #   聚合导出 jobsCatalog
│   │   │   └── {批次名}.ts     #   按批次组织（迁移 + 新增）
│   │   ├── internship-listings.ts  verified-internship-additions.ts
│   │   ├── robotics-ai-analysis.ts  platform-sources.ts
│   │   └── generated/robotics-market.json
│   └── lib/                    # types.ts data.ts utils.ts use-favorites.ts job-function-stats.ts
│       # robotics-market.ts match.ts（匹配引擎）use-profile.ts detail-sections.ts
├── scripts/
│   ├── audit-verified-jobs.ts  # 核验管线（结构 + 在线回源）
│   ├── add-jobs.ts             # 增补录入
│   ├── extract-fields.ts       # 字段提取辅助（scan/apply）
│   ├── refresh-sources.ts      # 来源刷新分类
│   ├── recheck-legacy.ts       # 遗留复核
│   ├── collect-robotics-market.ts
│   ├── lib/                    # recheck-core.ts、extract-core.ts
│   └── tests/                  # 模块与集成测试断言脚本
├── public/data/                # 可下载数据
└── docs/  plans/               # 文档体系
```

# 6. 模块间行为与数据流

依赖方向：`app/* → lib/* → data/jobs(index)`；`scripts → lib + data/jobs`；`components → lib`。

主要数据链（本轮变化加 ★）：

1. **岗位目录链**：`src/data/jobs/*` → `index.ts` 聚合 `jobsCatalog` → `data.ts getJobs()` 过滤/排序/分页（含职能过滤与即将截止计算）→ 列表页与首页卡片。
2. **岗位详情链**：`getJobIds()` → `generateStaticParams` → 每页 `getJob(id)` 渲染（★ 报名窗口区块）。
3. **增补链 ★**：data-acquisition 采集整理 → JSON 文件 → `add:jobs`（校验/自动 ID/写入批次）→ `audit:jobs:offline` 通过 → 本地提交 → `audit:jobs`（在线）复核 → `::push` 部署。
4. **清理链 ★**：`recheck:legacy` 遍历遗留清单（支持分批 `--ids`/`--limit`）→ 在线回源分类 → `workspace/legacy-recheck/` 报告 → 维护者确认 → 存活记录经 `add:jobs` 迁入（层级如实）→ 遗留文件移除 → `audit:jobs` 确认前台纯净。
5. **核验链**：数据变更 → prebuild offline 门禁 → 构建；提交前在线核验。
6. **市场链**：保持现状（collect → generated JSON → 市场页统计）。
7. **收藏链**：保持现状（localStorage ↔ getJob）。
8. **字段充实链（第 2 轮）**：`refresh:sources` 分类清单 → data-refresh 逐条处置：现行有效记录走 `extract:fields --scan` 出候选 → 人工确认 → `--apply` 写批次（层级按证据充分度升级）→ 离线审计 → 提交；失配/过期记录先重检索现行来源（单位官网、政府人事网站），检索到则刷新来源与证据，否则删除。
9. **新增岗位链（第 2 轮）**：三类单位来源采集 → `extract:fields --scan` 辅助抽取 → `add:jobs` 录入 → 在线审计 → 提交。
10. **匹配链（第 3 轮）**：用户编辑画像 → use-profile 写 localStorage → match-engine 纯函数打分 → /match 页渲染推荐与理由（输入即算，无网络请求）。
11. **详情充实链（第 3 轮）**：extract:fields 补提取稀疏记录 → 确认写入批次 → 审计；详情页按字段存在性全量渲染。

跨模块 DTO 清单：`Job`（jobs-dataset → jobs-catalog → site-shell 卡片）、`InternshipListing`、`RoboticsMarketDataset`、`Discipline`/`JobFunction`（site-shell → jobs-catalog 筛选参数）、`RecheckReport`（legacy-cleanup → 维护者）。字段级定义归拥有方模块文档。

# 7. 生命周期与状态机

- **Job.status**：`招聘中 → 已截止`（维护者更新；recheck 报告中「建议下架」≠「已截止」——下架是移除，截止是保留展示）。`状态待核实` 为不确定态，迁移目标只有「升级」或「下架」。
- **verification_level 提升路径**：`待核实 → 关键字段核验 → 来源核验 → 逐字段核验`；降级出口：recheck 判定来源失效 → 从前台移除。
- **★ 记录生命周期**：采集（data-acquisition）→ 录入（add:jobs，初始层级按证据充分度）→ 在线核验 → 发布 → 复核（recheck/audit）→ 升级/修正/下架。
- 状态可观察性：audit 输出各层级计数；recheck 输出分类计数；列表页核验摘要。

# 8. 并发模型与时间模型

不适用：单进程静态站点。构建期脚本串行 fetch 来源页（recheck:legacy 支持分批以规避长时运行与封禁）。

# 9. 开发轮次规划

本项目规划共 2 轮完整 loop。第 1 轮已交付（提交 f6beda9）：规范化数据源、京沪跨学科 30 条、遗留清理、职能筛选与报名窗口、页面优化。

**第 2 轮（已交付，提交 683f945 与 d756545）**：信息充实 108 条、失效刷新与清理、四批次 41 条、工具与展示优化、腾讯华为补采 7 条（当前 216 条、12 批次，已部署）。

**第 3 轮（当前轮，需求 V4.0）**：
- **轮次目标**：信息充实（≥60 条空白记录完成字段提取升级）、失效来源刷新与清理（无僵尸记录）、信息源与提取流程优化、展示优化、三类单位岗位 ≥20 条（事业单位 ≥8 条）、大厂综合岗位 ≥12 条与京沪事业单位增补 ≥6 条。
- **功能范围（最小完整链路优先）**：先建 source-tools 两条命令（刷新分类 + 提取辅助），再并行执行 data-refresh（充实+刷新+清理）、三类单位采集、展示优化，最后全量回归。
- **交付物**：extract:fields / refresh:sources 脚本、充实的批次数据（≥60 条带证据字段）、刷新后的前台数据（无失效来源）、三类单位新批次（≥20 条）、大厂综合岗位批次（≥12 条）、京沪事业单位增补（≥6 条）、优化后的展示、同步的文档与测试注册表。
- **模块开发阶段增量**（2026-11-05）：用户新增大厂综合岗位与京沪事业单位加量需求——属 data-acquisition 执行范围扩展（新建批次文件，不改架构契约与模块边界），经判定不构成整体设计改变、不触发打断归档；data-refresh 模块工作不受影响。

# 10. 承接被中断的上轮开发

不适用：无中断归档。

# 11. 测试架构概览

测试分层：①模块测试（tsx 断言脚本，`scripts/tests/`，随模块开发编写，只跑本模块）；②数据核验（audit:jobs offline/online，既是门禁也是测试）；③整库回归（`::ci` 按 docs/test.md 清单逐条执行）；④GUI 视觉验收（::ci 内截图 + rubric 判读，页面优化模块适用）。测试框架不引入新依赖，用 `tsx` 直接运行断言脚本，`npm run test` 聚合入口。

模块测试责任映射：jobs-dataset→增补/ID/校验；verification-pipeline→审计规则；legacy-cleanup→报告分类；jobs-catalog→筛选/排序/分页/收藏与展示判定；site-shell→枚举与首页（首页职能计数纯函数归 site-design）；robotics-market→分类与薪资标准化；source-tools→提取与分类规则；data-refresh→处置留痕断言；data-acquisition→批次 schema 与数量断言；match→打分与理由断言；detail-enrich→区块判定断言。全部测试依据 `docs/interaction.md` 与模块交互文档设计，逐条注册于 `docs/test.md`（格式见 `system/commands/dev.md`「测试文档规范」）。本章只定义预期行为与验证方法；实际结果只写入 `docs/test.md`。

# 12. 架构验收标准

- AC-1：`npm run audit:jobs`（在线）退出码 0；`audit:jobs:offline` 作为 prebuild 门禁生效。
- AC-2：`npm run build` 成功；`out/jobs/` 下每条 jobsCatalog 岗位存在独立静态页。
- AC-3：/jobs 筛选（含新增岗位职能维度）、排序、分页、URL 复现行为与 docs/interaction.md 一致。
- AC-4：前台任何岗位记录带核验层级与来源链接；「待核实」记录不渲染条件字段。
- AC-5：收藏写入 localStorage 键 `jiaodian-favorites`；列表与详情状态一致。
- AC-6：deadline 距今 ≤7 天且状态「招聘中」的岗位在卡片与详情页有「即将截止」标识；截止排序正确。
- AC-7：事业单位公告级记录详情页展示报名窗口（开始/截止/方式，原文有则必录，无则不编造）。
- AC-8：/market/robotics 统计值可由 `public/data/robotics-market.json` 复算；实习与市场内容无失效记录残留。
- AC-9：新增岗位经 `npm run add:jobs` 完成：非法记录被拒绝，合法记录自动获得唯一 ID 并写入批次文件，offline 审计自动执行。
- AC-10：`npm run recheck:legacy` 产出分类报告；三块遗留数据按报告完成处置，处置后仓库中不再存在未处置的遗留数据文件。
- AC-11：北京、上海各新增 ≥10 条经核验记录；跨学科岗位（项目管理/产品经理/AI伦理等）新增 ≥10 条；事业单位记录含报名窗口信息。
- AC-12：页面视觉优化落地且既有交互逻辑不回归（交互验收口径全数通过）。
- AC-13：README 与 docs/ 与代码同步，README 含数据增补指引。
- AC-14：`npm run extract:fields --scan` 对指定记录产出候选字段与证据位置且不写库；`--apply` 写入批次并自动离线审计；至少 60 条来源/关键字段级记录完成字段提取并升级或补齐。
- AC-15：`npm run refresh:sources` 产出全量分类清单；处置后前台无失效来源记录、无截止已过仍标「招聘中」的记录，处置留痕在批次头注释。
- AC-16：deadline 早于当日仍标「招聘中」的记录显示灰色「报名已截止」标识；「条件见来源」仅用于无任何条件字段的记录。
- AC-17：三类单位新增岗位合计 ≥20 条（事业单位 ≥8 条，含报名安排），全部带来源证据。
- AC-18：大厂综合岗位新增 ≥12 条（腾讯、小米、华为、字节等；覆盖项目经理、产品经理、AI／机器人、AI4S、AI 伦理职能），全部带来源证据且来源以官方渠道为准。
- AC-19：北京、上海事业单位在既有基础上新增 ≥6 条（累计事业单位 ≥15 条），含报名安排。
- AC-20：/match 页三类画像条目可增删（教育经历含自定义阶段），localStorage 键 `jiaodian-profile` 持久化，可一键清空。
- AC-21：填写画像后推荐列表按分排序且每条带理由；打分只使用平台标签与 title/original_major_requirements/education（均为已核验字段或平台标注）；权重集中于 src/lib/match.ts。
- AC-22：详情页条件信息区按字段存在性渲染（凡拥有已提取条件字段的记录均可见，不再被层级门槛隐藏），新增职能标签与招聘类型展示；空区块不渲染。
- AC-23：稀疏记录（9 条）完成补充提取或如实报告不可提取原因，新增字段审计通过。
