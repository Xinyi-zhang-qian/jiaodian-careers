# 交点 Careers（jiaodian-careers）

## 软件需求规格说明书

> 项目路径：/Users/qianzhang/Desktop/AI agent项目/招聘网址开发/jiaodian-careers
> 生成时间：2026-11-04 16:16（::work -explore 生成，重复执行时整体覆盖）
> 说明：本文档以代码现状为真实行为基准（已实现的写实现状，仅有计划未实施的标注「已计划/未实施」）。

目标系统：面向人文、社会科学与理工科交叉人才的招聘信息静态网站。
目标运行平台：Web 浏览器（静态托管，当前部署于 Render）；数据维护在本地 Node.js 环境完成。
主要使用方式：求职者用浏览器浏览、筛选、收藏岗位；内容维护者通过命令行脚本增补数据、核验来源、构建与部署。

# 1. 文档目的与系统目标

本文档定义交点 Careers 的软件需求。系统需要提供的能力清单：

1. 公开一个经来源核验的岗位目录，逐条标注核验层级（已核验（逐字段）／已核验（来源）／已核验（关键字段））。
2. 支持按地区、城市、单位类型、岗位类型、学历、学科方向、招聘状态与关键词组合筛选岗位。
3. 为每条岗位提供详情页，展示来源证据（来源页标题、原文片段、获取与核验时间、来源链接）。
4. 提供交叉学科方向浏览（11 个方向定义）与本地收藏。
5. 提供实习岗位线索、机器人与 AI 方向分析、招聘市场观察与机器人岗位样本专题。
6. 提供数据核验管线：提交数据前强制校验来源证据，构建期做离线结构检查。
7. 支持静态导出与静态托管部署。

系统长期目标：成为交叉背景求职者可信赖的信息入口——宁可少展示，不可展示未经核验或编造的内容。

# 2. 产品定位

系统定位：招聘信息聚合与核验展示站点，不做简历投递、不代理招聘流程，只提供经核验的信息与原始来源链接。

围绕以下核心业务对象组织：

- **岗位（Job）**：一条招聘记录，含身份（id）、条件字段（专业、学历、经验、薪资、职责）、来源字段（source_name、source_url、source_title、source_evidence）与核验字段（verification_level、fetched_at、last_verified、status）。类型定义见 `src/lib/types.ts:1`。
- **交叉方向（Discipline）**：平台维护的学科组合标签（11 个，`src/lib/utils.ts:6`），用于归类与筛选，明确区别于公告原文。
- **实习线索（InternshipListing）**：按 7 个实习方向（`src/data/internship-listings.ts:1`）组织的实习记录，仅保留已核对来源页的记录。
- **市场样本（RoboticsMarketJob）**：机器人岗位采集样本（`src/lib/robotics-market.ts:60`），带方向分类与薪资标准化结果。
- ** listing 类型（ListingKind）**：由标题正则推导的三种条目形态——具体岗位、招聘公告、招聘项目（`src/lib/utils.ts:27`），用于提示「这是公告级线索而非单一职位」。

# 3. 用户角色

- **求职者（浏览器访客）**：浏览岗位目录、按条件筛选、查看详情与来源、收藏感兴趣岗位。不需要注册登录。
- **内容维护者（命令行操作者）**：增补与修订岗位数据、运行核验脚本、构建站点、推送部署。通过本地命令行与数据文件交互。
- **运行环境参与者**：
  - Render 构建流水线：执行 `npm ci && npm run build`（构建前自动跑 `audit:jobs:offline` 结构检查）。
  - 来源网站：核验脚本在线模式（`npm run audit:jobs`）会实际访问来源页并核对标题、发布日期与证据片段。

# 4. 总体功能划分

1. 岗位目录与筛选（页面 `/jobs`）
2. 岗位详情（页面 `/jobs/[id]`，构建时逐条生成）
3. 首页导览与核验摘要（页面 `/`）
4. 交叉方向浏览（页面 `/directions`）
5. 本地收藏（页面 `/favorites`）
6. 实习岗位线索（页面 `/internships`）
7. 机器人与 AI 方向分析（页面 `/analysis`）
8. 招聘市场观察与机器人样本专题（页面 `/market`、`/market/robotics`）
9. 数据核验管线（脚本 `npm run audit:jobs` / `audit:jobs:offline`）
10. 机器人市场数据采集（脚本 `npm run collect:robotics` / `collect:robotics:offline`）
11. 静态导出与部署（`next.config.ts`、`render.yaml`）

# 5. 架构选择（用户决策层）

以下为项目既有的平台级架构决策，属需求约束，改动须用户确认：

1. **纯静态站点**：`next.config.ts` 设置 `output: "export"`，无后端服务、无数据库；筛选、搜索、收藏全部在浏览器端完成。
2. **数据文件化管理**：岗位数据以 TypeScript 文件形式纳入仓库（`src/data/`），不使用外部数据库。
3. **数据可信三级核验层级**：所有前台岗位必须带 `verification_level`，并保存可机器复核的 `source_evidence` 原文片段；未经核验的条件字段不得填写。
4. **Render 静态托管**：`render.yaml` 声明 Static Site，分支 main，构建命令 `npm ci && npm run build`，发布目录 `out`，提交自动部署。
5. **原页核验锚点强制**：详情页公开展示核验脚本必须能在来源页找到的原文片段。

# 6. 系统运行需求

- 本地运行：`npm ci && npm run dev`，访问 http://localhost:3000。
- 构建：`npm run build`（含 prebuild 钩子自动执行 `audit:jobs:offline`），产物在 `out/`。
- 数据核验：提交数据前必须运行 `npm run audit:jobs`（在线回源）；构建期自动执行离线结构检查。
- 市场数据更新：`npm run collect:robotics`（在线检查来源可访问性）或 `npm run collect:robotics:offline`。
- 运行状态检查：构建成功且 `out/` 生成即为正常；核验失败时脚本以非零码退出并逐条列错误。

# 7. 岗位目录与筛选（/jobs）

- 用户可见行为：左侧筛选面板 + 右侧岗位卡片列表；支持关键词、地区、城市、单位类型、岗位类型、学历、主学科、第二学科/技能、招聘状态共 9 类筛选；排序（最新发布／最近核验／截止日期）；分页每页 12 条；筛选条件实时同步到 URL（`src/app/jobs/page.tsx:39`），可分享与回退。
- 数据内容：仅展示 `src/lib/data.ts:8` 白名单聚合的三份数据（verified-jobs、restored-jobs、additional-verified-jobs）。
- 边界：地区「其他地区」表示不属于北京、上海、天津、广东、浙江、江苏的记录（`src/lib/data.ts:29`）；城市选项随所选地区动态生成；无结果时显示空态提示。
- 列表顶部固定展示核验层级说明（`src/app/jobs/page.tsx:238`）。

# 8. 岗位详情（/jobs/[id]）

- 用户可见行为：按核验层级展示不同提示条（逐字段/来源/关键字段/待核实四种文案，`src/app/jobs/[id]/page.tsx:72-100`）；展示原页核验锚点（`source_evidence` 逐条列出）；展示方向标签、技能标签、优先条件、申请方式、截止日期与来源信息区（来源名称、获取时间、最后核验时间、来源页标题、核验层级、来源链接）。
- 数据内容：右侧信息卡展示学历、地点、单位类型（仅逐字段核验）、发布与截止日期、薪资。
- 边界：公告级条目（招聘公告/招聘项目）显示「本条是 XX 级线索，不代表一个单独职位」提示；「本站说明（非公告原文）」区块明确区分平台归纳与公告原文；不存在的区块不渲染。
- 生成方式：`generateStaticParams` 按全部岗位 ID 逐条生成静态页（`src/app/jobs/[id]/page.tsx:14`）。

# 9. 首页（/）

- 用户可见行为：主标题与简介；搜索表单（关键词输入 + 地区按钮组 + 浙江/江苏的城市按钮组）跳转 `/jobs`；核验摘要统计（公开岗位总数与三级核验计数，`src/app/page.tsx:159`）；交叉方向卡片（有岗位的前 6 个方向）；精选岗位（最新 6 条）；来源优先级与核验规则说明；右侧展示最新 2 条岗位预览卡。

# 10. 交叉方向（/directions）与收藏（/favorites）

- 交叉方向：11 个方向卡片（主学科 × 第二学科、典型岗位、关键词、岗位计数），点击跳转 `/jobs?discipline=…`。
- 收藏：列表页与详情页可收藏/取消（心形按钮）；收藏存于浏览器 localStorage（键 `jiaodian-favorites`，`src/lib/use-favorites.ts:5`）；收藏页展示已收藏岗位卡片；无账号体系，换浏览器不同步。

# 11. 实习岗位（/internships）

- 用户可见行为：7 个实习方向导航卡（含各方向线索计数与锚点跳转）；按方向分组的实习线索卡（标题、单位、地点、待遇、学历、批次要求、摘要、来源链接）。
- 数据内容：`internshipListings` + `verifiedInternshipAdditions`（`src/app/internships/page.tsx:9`）。
- 边界：页面顶部固定「实习岗位正在逐条回源复核」说明（`src/app/internships/page.tsx:33`）；仅展示能从原页核对的记录。

# 12. 方向分析与市场观察（/analysis、/market、/market/robotics）

- 方向分析：机器人与 AI 七类方向的职责、能力、作品集证据与适配建议；不同背景的切入路线卡；按类别（实习/博士后/企业岗位）的机会样本（含外链）。
- 市场观察：人才需求报告摘要（`platform-sources.ts` 的 marketReport）、平台渠道说明；机器人样本专题页展示方向统计（份额条形、薪资中位数）、城市分布、单位分布、招聘类型与来源类型统计、可下载 JSON/CSV（`public/data/`）。
- 边界：市场页数据来自脚本生成的 `src/data/generated/robotics-market.json`；未核验记录不展示人工补写的条件字段；页面明示样本数不代表全行业。

# 13. 数据核验管线（audit:jobs）

- 行为：遍历前台白名单三份数据，逐条检查——ID 唯一、`verification_level` 必填、非「待核实」必须有 `source_title` 与 `source_evidence`、「待核实」不得携带任何未核验条件字段、逐字段核验来源必须 HTTPS、禁止 `is_demo` 数据（`scripts/audit-verified-jobs.ts:27`）。
- 在线模式（`npm run audit:jobs`）：实际请求来源页，规范化 HTML 后核对——逐字段核验：来源页标题、发布日期（三种格式变体）、全部证据片段必须命中；来源核验：核对证据片段。
- 离线模式（`audit:jobs:offline`）：只做结构检查（Render 构建期使用，避免来源网站屏蔽云服务器阻断发布）。
- 失败行为：逐条打印错误，进程以退出码 1 结束；成功时打印各层级计数。

# 14. 机器人市场数据采集（collect:robotics）

- 行为：从脚本内维护的种子数据生成机器人市场数据集：按标题规则与关键词评分做方向分类（`src/lib/robotics-market.ts:101`）、薪资标准化（月薪 K、日薪、面议三种，`src/lib/robotics-market.ts:122`）、按单位+岗位+城市去重；在线模式检查每个来源 URL 可访问性并记录 `sourceStatus` 与 HTTP 状态。
- 输出：`src/data/generated/robotics-market.json`（站点读取）与 `public/data/robotics-market.json`、`public/data/robotics-market.csv`（可下载）。
- 边界：只读取无需登录的公开页面，不绕过验证码；排除实习记录；方法论声明写入数据集 `methodology` 字段。

# 15. 性能需求

- 用户未提出量化性能指标。现状约束：静态导出，无服务端运行时；构建时逐岗位生成详情页（当前全量岗位数为三位数量级，可接受）；客户端筛选在内存中进行，单页渲染上限 12 条。

# 16. 可扩展性、可维护性与可测试性需求

- 新增岗位通过向数据文件追加记录完成，经 `audit:jobs` 校验后生效。
- 新增筛选维度需扩展 `src/lib/data.ts` 过滤逻辑与 `src/app/jobs/page.tsx` 筛选面板。
- 核验规则集中于 `scripts/audit-verified-jobs.ts` 单一文件，规则变更只需改脚本。
- 测试现状：除 `audit:jobs` 外无自动化测试；测试注册表 `docs/test.md` 尚未建立（已计划/未实施）。

# 17. 验收目标

1. `npm run audit:jobs` 通过（在线模式），全部前台岗位证据可在来源页命中。
2. `npm run build` 成功，`out/` 生成，每条岗位有独立静态详情页。
3. 岗位列表 9 类筛选与 3 种排序行为与本文档第 7 节一致，筛选状态可通过 URL 复现。
4. 前台任何岗位记录均带核验层级与来源链接；「待核实」记录不展示任何条件字段。
5. 收藏在同一浏览器刷新后保持；详情页收藏与列表页收藏状态一致。
6. 机器人市场专题页的统计数字可由 `public/data/robotics-market.json` 复算。
7. 站点可经 Render 按 `render.yaml` 自动部署，访问 https://jiaodian-careers.onrender.com。
