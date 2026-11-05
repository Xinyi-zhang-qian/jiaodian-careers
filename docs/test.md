# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

### 整库构建与静态导出
- 如何运行：`npm run build`（prebuild 自动执行 audit:jobs:offline 门禁）
- 测试内容：依据 docs/design.md 架构验收标准 AC-2 与 docs/interaction.md §11 `npm run build` 行，验证整库构建成功且 prebuild 离线审计通过，静态站点导出到 `out/`（含首页、404 页与每岗位独立详情页）。

### 构建产物与数据链一致性
- 如何运行：`npm run test`（scripts/tests/integration.test.ts，out/ 缺失时自动先执行整库构建）
- 测试内容：依据 docs/design.md §6 岗位目录链与岗位详情链，验证 out/ 下详情页数量与 jobsCatalog 条数一致，并抽样核对详情页 HTML 含岗位标题、来源链接与核验锚点片段，404 页存在（AC-2、AC-4 的构建期断言）。

## 模块 data-foundation 测试

### jobsCatalog 完整性
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_design.md §2 批次聚合结构与 §4 迁移验收断言 1，验证 `src/data/jobs/index.ts` 聚合出的 jobsCatalog 共 188 条、id 全目录唯一，核验层级分布为逐字段核验 46 条、来源核验 57 条、关键字段核验 85 条（迁移 200 条 + 新增 30 条 − 线索处置移除 36 条 − ::ci 在线审计失配处置 6 条；11 条关键字段记录经复核升级为来源核验、实验室失配记录降级，七批次齐全）。

### audit:jobs:offline 通过
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，内部以子进程运行 `npx tsx scripts/audit-verified-jobs.ts --offline`）
- 测试内容：依据 docs/interaction.md §11 `audit:jobs:offline` 行与 docs/modules/data-foundation_interaction.md §2 规则全集，验证离线审计不发网络请求、退出码为 0，并输出 `Audited 188 public jobs (46 field-level, 57 source-level, 85 key-field)` 计数行。

### add:jobs 校验矩阵（validateJobRecord）
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_interaction.md §3 validateJobRecord 规格，验证合法记录返回空错误列表；缺 source_title、缺 source_evidence、org_type/status 枚举外取值、published_at 非 YYYY-MM-DD、application_opens_at 晚于 deadline、job_functions 含枚举外取值、输入携带 id 字段七类非法输入各自被拒绝且错误信息含字段名；输入携带 Job 模式未知字段被拒绝。

### add:jobs 整批写入行为
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，通过 `--jobs-dir` 注入临时目录隔离写入）
- 测试内容：依据 docs/interaction.md §11 add:jobs 行与 docs/modules/data-foundation_interaction.md §3 错误处理与边界检查，验证批次内任一记录非法时整批拒绝、退出码 1、不产生任何文件写入；title+organization+source_url 与现有目录重复的记录被跳过并提示；合法批次自动分配 ID（现有 jobsCatalog 最大 id+1 起递增）、创建批次文件、更新 index.ts 的 import 与聚合行，并以退出码 0 结束；非 kebab-case 批次名（如 Bad_Batch）被拒绝且无文件写入。

## 模块 data-acquisition 测试

### 批次 schema 自查
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据 `docs/modules/data-acquisition_interaction.md` §2 批次文件规格与 `docs/interaction.md` §11 audit 错误分类，导入三个采集批次文件（beijing-2026-11、shanghai-2026-11、cross-disciplinary-2026-11）逐条校验——必填字段齐全（title、organization、province、city、location、org_type、job_type、source_url、source_name、source_type、published_at、status、verification_level、source_title、source_evidence）、枚举合法（org_type/source_type/status/verification_level/job_functions）、日期字段格式为 YYYY-MM-DD、application_opens_at 不晚于 deadline、「待核实」记录不携带任何条件字段、「逐字段核验」记录 source_evidence ≥3 段且 source_url 为 HTTPS、is_demo 均为 false、三批 id 无重复且全部 ≥2001；任一违规输出逐条错误行并断言失败。校验逻辑实现为独立可复用函数，口径与 `scripts/audit-verified-jobs.ts` 的 audit 规则对齐。

### 批次数量断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据需求 §16 采集目标与本模块设计文档 §1 职责，断言北京批次记录数 ≥10、上海批次记录数 ≥10、跨学科批次记录数 ≥10，未达标即断言失败并输出实际条数。

### 事业单位报名窗口断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据 docs/design.md §4 契约 11（报名窗口契约），对每条 org_type 为「事业单位」的记录断言 application_opens_at 或 deadline 至少其一有值，或 application_info 含报名方式（时间或途径）原文说明，三者皆缺即断言失败，保证事业单位公告的可执行报名信息不缺失。

### 跨学科批次职能标注断言
- 如何运行：`npm run test`（scripts/tests/data-acquisition.test.ts）
- 测试内容：依据 docs/design.md §4 契约 12 职能标签契约，验证跨学科批次每条记录的 job_functions 均已标注且取值全部在 JOB_FUNCTIONS 枚举内，聚焦岗位（项目管理、产品经理、AI 伦理等）未漏标。

### 增量批次 schema 自查（大厂与京沪事业单位）
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据 `docs/modules/data-acquisition_interaction.md` §2a 增量批次规格，导入 enterprise-bigtech-2026-11 与 public-sector-bjsh-2026-11 两个增量批次文件逐条校验——必填字段齐全、枚举合法（org_type/source_type/status/verification_level/job_functions）、日期字段为 YYYY-MM-DD、application_opens_at 不晚于 deadline、「待核实」记录不携带条件字段、「逐字段核验」记录 source_evidence ≥3 段且 source_url 为 HTTPS、is_demo 均为 false、id ≥3101 且两增量批次间无重复；任一违规输出逐条错误行并断言失败。

### 增量批次数量断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据需求 V3.1 §17、§18 采集目标，断言大厂综合岗位批次记录数 ≥12、京沪事业单位增补批次记录数 ≥6，未达标即断言失败并输出实际条数。

### 大厂批次职能覆盖断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据需求 V3.1 §17 与模块交互文档 §2a，对大厂综合岗位批次按五类职能（项目经理类、产品经理类、AI／机器人类、AI4S 类、AI 伦理类）的判定谓词统计覆盖，断言至少四类各有至少一条记录命中，不足四类即断言失败并输出未覆盖类别清单。

### 京沪事业单位增补批次报名窗口断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据 docs/design.md §4 契约 11 报名窗口契约与模块交互文档 §2a，对京沪事业单位增补批次每条 org_type 为「事业单位」的记录断言 application_opens_at 或 deadline 至少其一有值，或 application_info 含报名方式原文说明，三者皆缺即断言失败。

### 京沪事业单位增补批次地域断言
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据需求 V3.1 §18 地域要求，断言京沪事业单位增补批次全部记录的 province 均为「北京」或「上海」且 city 与省份一致（北京记录 city 为北京、上海记录 city 为上海），出现其他省份即断言失败并输出违规记录 id。

## 模块 legacy-cleanup 测试

### classifySource 分类判定（来源命中 → 可升级）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 8 条，注入返回含 source_title 原文的夹具 HTML 的 fetch 假实现（不发真实请求），断言带 source_title 的记录判定为「可升级」且 evidence_hits 记录命中锚点；平台快照记录（无 source_title）在 title 与 organization 都命中时判定为「可升级」。

### classifySource 分类判定（锚点不命中/疑似非招聘页 → 需人工复核）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 7、9 条，注入返回与记录无关内容的夹具 HTML 的 fetch 假实现，断言锚点不命中判定为「需人工复核」且 note 含「锚点不命中」；注入返回 200 但正文经 normalizeHtml 后为空的夹具，断言判定为「需人工复核」且 note 含「页面内容为空」。

### classifySource 分类判定（过期提示页如实标注）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 9 条（「信息已过期」类提示页标注），以南开就业网实测的 200 过期跳转页夹具驱动 classifySource，断言判定为「需人工复核」且 note 同时含「锚点不命中」与「过期提示页」。

### classifySource 分类判定（已暂停招聘页不得升级）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 8、9 条（停招字样例外），以锚点命中但标注「该职位已暂停招聘」的平台职位页夹具（猎聘实测行为）驱动 classifySource，断言判定为「需人工复核」且 note 含「已暂停招聘」。

### classifySource 分类判定（网络异常 → 需人工复核且 note 含原因）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 3 条，注入抛出普通 Error 的 fetch 假实现模拟网络异常，断言判定为「需人工复核」且 note 含「访问失败：」与异常原因，不发真实请求。

### classifySource 分类判定（URL 非法/404/反爬/域名失效 → 建议下架）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §2 判定口径第 1、2、4、5 条，分别以空 URL、返回 404 与 403 的 fetch 假实现、抛出带 ENOTFOUND  cause 的 fetch 假实现驱动 classifySource，断言均判定为「建议下架」且 note 分别含「URL 非法」、HTTP 状态码、「疑似反爬拦截」、「域名失效」。

### normalizeHtml 规范化
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §4 normalizeHtml 规格，给定含 script/style 块、标签、&nbsp;/&amp;/&quot; 实体、换行缩进与 en dash 的夹具 HTML，断言输出为去除上述噪声后的连续文本，且「中国移动2027校园招聘」这类跨标签短语规范化后可被 includes 命中。

### markUnverified 离线态标注
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §4 markUnverified 规格，断言离线标注条目 verdict 为「未核验」、http_status 为 null、note 为「离线模式未访问来源」，对应 interaction.md §11 离线模式全量标「未核验」。

### mergeDetails 增量合并（同 id 覆盖）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §4 mergeDetails 规格与设计文档 §3「同 id 覆盖」，给定旧明细与新一批含同 `origin+id` 条目的明细，断言同键条目被新结果覆盖、旧独有条目保留、输出无重复键。

### buildReport 报告完整性（三清单并集等于复核全集、无重复）
- 如何运行：`npx tsx scripts/tests/legacy-cleanup.test.ts`
- 测试内容：依据模块交互文档 §3 报告验收断言，给定覆盖三种 verdict 与三个 origin 的夹具明细集生成 report.md 文本，从「可升级 / 需人工复核 / 建议下架」三个清单表中提取 id，断言三者并集等于夹具全部已复核 id、任一 id 在三个清单中不重复出现、未核验条目不出现在三个清单中。

## 模块 jobs-ui 测试

### 职能筛选只命中标注记录
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2（docs/interaction.md §6 岗位职能下拉），对含 `job_functions` 字段与无该字段的记录混合目录断言：传入枚举值「算法」时只返回标注该职能的记录，传入「数据」时不命中无 `job_functions` 字段的记录。

### 非枚举与空职能值视为不过滤
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2 边界检查，断言 `job_function` 传非枚举值、空串或缺省时混合目录全量返回；并依据 docs/interaction.md §13 断言 1 断言 `getJobs` 对全量目录在非枚举值下同样不过滤。

### 职能筛选与其他过滤器 AND 组合
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2 预期输出，断言 `job_function` 与 `org_type` 同时传入时返回两者交集，组合无效时返回空集。

### deadlineDaysLeft 剩余天数计算
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §3，注入固定当前日期，断言：无 deadline 返回 null；status「已截止」返回 null；deadline 当天返回 0；未来 3 天返回 3；过去日期返回负数；非法日期（02-30、非 YYYY-MM-DD 格式）返回 null；「状态待核实」仍按 deadline 计算。

### 即将截止徽标判定
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/interaction.md §6「JobCard 即将截止徽标」、§7「即将截止标识」与 §13 断言 4、docs/modules/jobs-ui_interaction.md §4，断言：剩余 3 天且「招聘中」返回「3 天后截止」；当天返回「今天截止」；剩余 7 天仍在边界内；剩余 8 天、已过期、「已截止」「状态待核实」、无 deadline 均返回 null。

### 报名窗口渲染判定
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/interaction.md §7「报名窗口区块」与 §13 断言 5、docs/modules/jobs-ui_interaction.md §5，断言：有 `application_opens_at`、`deadline`、`application_info` 之一或公告级条目时 visible 为 true；事业单位公告级 publicRecruitNotice 为 true；企业公告级为 false；具体岗位三字段全空 visible 为 false。

### 职能枚举与契约一致
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/design.md §4 契约 12，断言 `JOB_FUNCTIONS` 恰为契约规定的 10 个枚举值（项目管理、产品经理、AI伦理、算法、工程、数据、科研、编辑出版、综合管理、其他）。

## 模块 site-design 测试

### 职能入口计数逻辑（getJobFunctionEntries）
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/modules/site-design_interaction.md §2 首页职能入口规格，对夹具记录集（部分记录含 job_functions 字段）验证：计数大于 0 的职能按计数降序出现在返回清单（同数按枚举声明顺序）、计数为 0 的职能不出现、无 job_functions 字段的记录不计入任何职能、一条记录携带多个职能时在每个职能下各计一次、枚举外职能名不计入、全部职能计数为 0 时返回空数组（首页据此整块不渲染）且输入数组不被修改。

### 首页职能入口渲染接线
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/interaction.md §5「职能快捷入口」控件规格，对 src/app/page.tsx 源码做结构断言：页面从 src/lib/job-function-stats 导入计数结果渲染职能卡、职能卡以 `/jobs?function=` 链接跳转、经 `getJobs({ limit: 1000 }).jobs` 取全量后本地统计而不调用 getJobs 的 job_function 过滤参数（现行实现为全量本地统计，不依赖 getJobs 的 job_function 过滤参数）。

### README 数据增补指引与命令一致性
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/modules/site-design_interaction.md §3 README 断言：README 含「数据增补指引」节，节内写明 add:jobs 用法（`npm run add:jobs -- <json路径> --batch <批次名>`）、全部 14 个必填字段名、核验层级与证据要求及 audit:jobs 门禁；README 全文不再出现 update.sh 与 Vercel 表述；README 中出现的每个 `npm run X` 均登记于 package.json scripts（package.json 已登记 add:jobs、recheck:legacy、test 三个命令），且 README 写明 npm ci、npm run dev、npm run build、npm run test 四个基础命令。

### 徽标语义色变量登记
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/interaction.md §3 核验徽标色彩协议，src/app/globals.css 的 @theme 中登记逐字段核验（绿）、来源核验（蓝）、关键字段核验（琥珀）、待核实（黄）、即将截止（红）五组语义色变量及其浅底色变量，且既有主题变量的取值保持不变。

## 最近一轮结果

- 2026-11-04 | 范围：模块 data-foundation | 通过 6/6（jobsCatalog 完整性、audit offline、add:jobs 校验矩阵、合法批次写入与 ID 自动分配、整批拒绝无写入、批次名校验）；worktree 内首轮以迁移后 200 条口径通过，::mergelocal 处置后按 194 条（58/51/85）期望复跑全部通过；类型检查 tsc --noEmit 无错误
- 2026-11-04 | 范围：模块 data-foundation（一次性迁移校验，仅本轮运行，不计入永久测试）| 通过：200/200 条按 id 逐字段等值（迁移脚本运行确认；脚本按其头部声明在提交前删除）
- 2026-11-04 | 范围：data-acquisition 模块 | 运行 `npx tsx scripts/tests/data-acquisition.test.ts`：通过 9 组断言 / 失败 0，覆盖 30 条记录（北京 10、上海 10、跨学科 10；其中事业单位 15 条）；`npx tsc --noEmit` 通过（0 错误）。
- 2026-11-05 | 范围：data-acquisition 模块（第 2 轮，分支 dev/data-acquisition，worktree .worktrees/data-acquisition）| 运行 `npx tsx scripts/tests/data-acquisition.test.ts`：通过 17 组断言 / 失败 0，覆盖 52 条记录（北京 10、上海 10、跨学科 10、事业单位批次 9、科研院所批次 13；其中事业单位合计 24 条）；`npx tsc --noEmit` 通过（0 错误）。
- 补充核验（第 2 轮新增 22 条）：本地底稿脚本（workspace/acquisition/verify-evidence.ts，normalize 口径与 scripts/audit-verified-jobs.ts 一致）对 public-sector-2026-11 与 research-institutes-2026-11 逐条在线回源，source_title、published_at（含中文日期变体）与全部 source_evidence 片段逐字命中，22/22 全量通过；事业单位批次中报名起止时间原文有则必录（3001/3002/3003/3004/3009/3014），原文未给出起止时间或长期有效的（3005 仅录页面标注截止日、3006/3007/3008 及科研院所各条）把报名方式原文写入 application_info，deadline 留空。采集底稿与来源访问记录见 workspace/acquisition/sources.md（本地工作产物，不入库）。
- 补充核验：本地底稿脚本（workspace/acquisition/verify-evidence.ts，normalize 口径与 scripts/audit-verified-jobs.ts 一致）对 30 条记录逐条在线回源，source_title、published_at（含中文日期变体）与全部 source_evidence 片段逐字命中，全量通过。
- 2026-11-04 | 模块 legacy-cleanup | 通过 18/18，失败 0 | 运行方式：`npx tsx scripts/tests/legacy-cleanup.test.ts`（聚合入口 `npm run test` 通过，1/1 套件）；`npx tsc --noEmit` 无错误。
  - 覆盖：classifySource 判定口径第 1–9 条（可升级/需人工复核/建议下架/未核验、过期提示页与已暂停招聘例外）、normalizeHtml、markUnverified、mergeDetails 同 id 覆盖、buildReport 三清单并集等于复核全集且无重复。
  - 复核执行（`npm run recheck:legacy`，在线模式）：全量 295 条复核完成——可升级 51（real-jobs 24、expanded-source-leads 27、platform-sources 0）、需人工复核 236（含过期提示页 36、停招标注 1、访问失败 19、页面内容为空 7、HTTP 非成功 4、疑似非招聘页 3、锚点不命中 166）、建议下架 8（域名失效 3 经 nslookup 独立佐证、反爬拦截 403/404 共 5）；未核验 0。明细与报告见 `workspace/legacy-recheck/`（本地工作产物，不入库）。
  - 抽样验证：可升级条目（南开 117635/116865、猎聘 ps-4 前身）来源页实际内容与锚点命中逐一核对；猎聘 ps-4 因页面标注「该职位已暂停招聘」由可升级改判需人工复核，据此在口径第 8/9 条补充停招例外。
  - 处置建议（逐条 id）见 `workspace/legacy-recheck/report.md` 处置建议节；物理删除与迁入由主 Agent 在合并阶段执行。
- 2026-11-04 | 模块 jobs-ui | 通过 27/共 27 | 无失败（`npx tsx scripts/tests/jobs-ui.test.ts` 全部通过；`npx tsc --noEmit` 无类型错误）。
- 2026-11-05 | 模块 jobs-catalog（第 2 轮展示强化，分支 dev/jobs-catalog，worktree .worktrees/jobs-catalog）| 通过 34/共 34 | 无失败。运行命令：`npx tsx scripts/tests/jobs-ui.test.ts`（既有 27 个断言保留，其中「已过期日期不显示徽标」按 docs/design.md §4 契约 19 更新为「报名已截止」；新增报名已截止过期标识与互斥、「条件见来源」收敛、卡片与详情页展示接线共 8 个用例）；`npx tsc --noEmit` 无类型错误。
- 2026-11-04 | 范围：模块 site-design（分支 dev/site-design，worktree .worktrees/site-design）| 通过 4/4，失败 0 | 无失败明细。运行命令：`npx tsx scripts/tests/site-design.test.ts`（职能入口计数逻辑、首页职能入口渲染接线、README 数据增补指引与命令一致性、徽标语义色变量登记四套件全通过）与 `npx tsc --noEmit`（通过）。说明：README 命令一致性断言对 add:jobs、recheck:legacy、test 三个命令按模块交互文档 §3.3 采用跨模块桩例外集合（其 package.json 登记由 data-foundation 与 legacy-cleanup 分支交付，合并后一致）。
- 2026-11-05 | 范围：整库（::ci）| 通过：npm run test 6/6 套件（含新增 integration.test.ts）；npm run build 成功（prebuild 离线审计通过）；npm run audit:jobs 在线审计通过（188 条，46 逐字段/57 来源/85 关键字段，全部证据回源命中）；out/ 详情页 188 个与目录一致、抽样内容核对通过
- 2026-11-05 | 范围：整库在线审计失配处置 | 处置 6 条：617（南开转载页过期）、1101/1102/1108/1109/1110（实验室岗位改版后存储标题失配）删除；1106/1111 及其他发布日期不可复核记录降级为「来源核验」；实验室全部记录移除失效地址证据片段；204/205/211 证据锚点改为 UnitreeRobotics；处置后 188 条全量在线审计通过
- 2026-11-05 | 范围：GUI 视觉验收（::ci）| 通过：13 张截图（11 页面 + 2 流程镜头）逐张判读，13 pass / 1 warn（notfound 截图为本地测试服务器原始 404 响应，站点 404.html 存在已由集成测试断言，属环境限制）；机器门控通过（文件存在且 >20KB、颜色多样性充分）；verdict overall=pass；console 错误未采集（chrome headless 命令行限制，如实记录），经渲染结果判读兜底
- 2026-11-05 | 模块 source-tools（分支 dev/source-tools，worktree .worktrees/source-tools）| 通过 11/共 11，失败 0 | 运行命令：`npx tsx scripts/tests/source-tools.test.ts`（extractCandidates 抽取与证据命中/空页面与无标签页/已有值跳过，applyConfirmed 记录不存在/证据不命中整条拒绝不写库/允许清单外与缺证据拒绝/_level 非升级拒绝/合法确认写入含待核实自动升级与 _level 升级，classifyRefresh 六类夹具分类，selectScanTargets/selectRefreshTargets 缺省目标口径）；`npx tsc --noEmit` 无错误。全部网络行为为注入的 fetch 假实现，apply 写库经临时目录注入隔离，不发真实请求。CLI 接线冒烟（无参数用法提示、未知参数报错、空目标运行）通过；当前目录下 scan 缺省目标 136 条、refresh 缺省目标 142 条（合并后由 data-refresh 按 --ids/--limit 分批执行）。模块文档微调：过期提示页归类由「内容失配」修正为「来源过期」（依据 docs/interaction.md §11 失效跳转口径与设计文档 §3），applyConfirmed 增加 options 注入参数并在模块交互文档 §3 补记校验与写入细则
- 2026-11-05 | 范围：模块 data-refresh（分支 dev/data-refresh，worktree .worktrees/data-refresh）| 全量来源分类与处置完成，处置后回归全部通过
  - 分类统计（188 条全量在线访问来源页，一次性脚本复用 recheck-core 规范化并做字符集感知解码）：现行有效 105、内容失配 81、访问失败 2（485 反爬拦截、209 超时）；来源过期 0（404/域名失效类均以失效跳转/JS 壳形态归入内容失配处置）。
  - 充实（A 类）107 条（目标 ≥60 达成）：平安科技 18 条与安克创新 9 条（校招公告统一字段）、上海人工智能实验室 11 条（页面卡片日期回填 published_at）、事业单位与科研院所公告 52 条（401-415、419-423、436-448、470-478、515-517、530、541、543-546、578、587、588、590-596、202-216、301-306、502 等）、企业岗位 17 条（206-208、416、449、480-484、494、496、204/205/211 宇树现行中文页、589 等）；每条新填字段附来源页可逐字命中证据片段，充实记录层级只升不降。
  - 失效刷新（B 类）：同源换锚点刷新 52 条 + 换源刷新 4 条（474 上海博物馆换 rsj.sh 现行公告、502 中国航油换对外经贸大学就业网转载、306 上科大换中公转载、203 北京脑所同 URL 现行公告重锚）；删除 19 条（201、209、210、212、305、417、418、485、499、555、557、559、586、597、598、599、600、601、603——JS 渲染壳/404/反爬且经检索无现行可核验来源，逐条批次头留痕）。
  - 状态修正（C 类）29 条改「已截止」（报名/申请窗口经原文确认已过，含 2016 同济口腔医院）；处置后无截止已过仍标「招聘中」的记录。
  - 回归：`npx tsx scripts/audit-verified-jobs.ts --offline` 通过；`npm run audit:jobs` 在线审计通过（169 条：128 逐字段/31 来源/10 关键字段，全部证据回源命中，0 失败）；`npx tsc --noEmit` 通过（0 错误）；`npx tsx scripts/tests/data-foundation.test.ts` 通过 6/6（计数期望已同步 169 条口径）。处置中间产物（分类明细、检索候选、更新脚本）在 workspace/source-refresh/ 与 scripts/tmp-*（提交前删除），不入库。
  - 工具链限制记录：GBK 编码站点（qgsydw/zgsydw）与 JS 渲染壳来源经 audit 工具链无法在线核验，相关记录（401-403、476、439、214、444、579-582、602 等）层级按可核验性收敛并如实标注。
- 2026-11-05 | 范围：模块 data-acquisition（增量执行，分支 dev/data-acquisition-2）| 运行 `npx tsx scripts/tests/data-acquisition.test.ts`：通过 16 组断言 / 失败 0，覆盖 49 条记录（北京 10、上海 10、跨学科 10、大厂综合 12、京沪事业单位增补 7；其中事业单位 22 条）；`npx tsc --noEmit` 通过（0 错误）。
- 补充核验（增量执行）：一次性底稿脚本（normalize 口径与 scripts/audit-verified-jobs.ts 一致，提交前已删除）对新增 19 条记录（大厂综合 12 条、京沪事业单位增补 7 条）逐条在线回源，source_title、published_at（逐字段核验级）与全部 source_evidence 片段逐字命中，全量通过；来源清单与放弃记录原因见 workspace/acquisition/sources-2.md（本地产物，不入库）。
