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

### 补采批次 schema 自查（腾讯华为）
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据 `docs/modules/data-acquisition_interaction.md` §2b 补采批次规格，导入 tencent-huawei-2026-11 批次文件逐条校验——必填字段齐全、枚举合法（org_type/source_type/status/verification_level/job_functions）、日期字段为 YYYY-MM-DD、application_opens_at 不晚于 deadline、「逐字段核验」记录 source_evidence ≥3 段且 source_url 为 HTTPS、is_demo 均为 false、city 无模糊表述；任一违规输出逐条错误行并断言失败。

### 补采批次数量与 id 段断言（腾讯华为）
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据模块交互文档 §2b 补采批次规格，断言 tencent-huawei-2026-11 批次合计 ≥6 条、organization 含「腾讯」的记录 ≥3 条、organization 含「华为」的记录 ≥3 条；批次内 id 无重复且全部落在 3201 起的手工段，并与既有全部批次核对无 id 冲突；未达标即断言失败并输出实际数量。

### 补采批次 AI 伦理职能断言（腾讯华为）
- 如何运行：`npx tsx scripts/tests/data-acquisition.test.ts`
- 测试内容：依据模块交互文档 §2b 职能优先级要求，对 tencent-huawei-2026-11 批次逐条判定——凡标题或职责描述命中 AI 安全／大模型安全／AI 治理／AI 伦理类表述的记录，其 job_functions 必须含枚举值「AI伦理」，缺失即断言失败并输出违规记录 id；并断言批次整体至少有一条记录标注「AI伦理」（补采目标为补齐第 2 轮大厂批次五类职能中唯一缺失的 AI 伦理）。

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

## 模块 source-tools 测试

### extractCandidates：标签分区抽取候选字段且证据可命中
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据 docs/modules/source-tools_interaction.md §2，验证「标签＋冒号」分区启发式对夹具来源页正确抽取候选字段，且每个证据片段在规范化文本中逐字命中。

### extractCandidates：空页面返回 inaccessible，无标签页面返回空候选
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据模块交互文档 §2 边界检查，验证规范化文本为空时返回 inaccessible 含原因、无标签分区时返回空候选（宁可少提取不提取假证据）。

### extractCandidates：已有值的可写入字段跳过抽取
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据模块设计文档 §3 scan 流程，验证记录已有值的可写入字段不重复抽取。

### applyConfirmed：记录不存在拒绝且不写库
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据模块交互文档 §3 边界检查，验证记录 id 不存在时整条拒绝且批次目录无任何写入。

### applyConfirmed：证据不命中整条拒绝且不写库
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据契约 17 与模块交互文档 §3，验证字段值对应证据片段在线复核不命中时整条拒绝（不做部分写入）。

### applyConfirmed：允许清单外字段与缺证据片段拒绝
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据模块交互文档 §3 预期输入，验证候选字段允许清单之外的字段与缺证据片段的确认被拒绝。

### applyConfirmed：_level 非升级请求（同级与降级）拒绝
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据契约 17 层级只升不降，验证同级与降级请求被拒绝。

### applyConfirmed：合法确认写入批次（待核实自动升级 + 字段值/证据/last_verified）
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据模块交互文档 §3 预期输出，验证合法确认写入批次文件：字段值、证据追加、待核实记录自动升「关键字段核验」、last_verified 更新。

### applyConfirmed：_level 升级写入层级并追加证据
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据契约 17，验证显式升级请求经证据校验后写入新层级并追加证据。

### classifyRefresh：夹具分类（现行有效/来源过期/内容失配）
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据契约 18 与 docs/interaction.md §11，验证锚点命中+招聘关键词→现行有效、「该信息已过期」类跳转→来源过期、锚点不命中→内容失配。

### 缺省目标筛选口径（selectScanTargets / selectRefreshTargets）
- 如何运行：`npm run test`（scripts/tests/source-tools.test.ts）
- 测试内容：依据 docs/interaction.md §11，验证 scan 缺省目标为全部无条件字段记录、refresh 缺省目标为全部「状态待核实」与来源/关键字段核验记录。


### 已过期且招聘中显示报名已截止
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据 docs/design.md 契约 19，验证 deadline 早于当日且状态「招聘中」时 deadlineBadgeLabel 返回「报名已截止」（第 2 轮规格，替代第 1 轮「已过期不显示徽标」口径）。

### 已截止状态即使 deadline 已过也不显示报名已截止
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据契约 19 与 docs/interaction.md §3，验证 status「已截止」时不返回「报名已截止」（不与既有「已截止」状态徽标重复）。

### 报名已截止与即将截止互斥且各情形文案唯一
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据契约 19，验证负天数→「报名已截止」、0→「今天截止」、1–7 天→「x 天后截止」两两互斥且同一记录同一时刻只落入一种语义。

### 条件字段全空判定为无条件信息
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §3，验证 hasConditionInfo 对五条件字段全空（空串与 null）返回 false。

### 任一条件字段非空判定为有条件信息
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据同上规格，验证任一条件字段非空时返回 true。

### 统一提示在卡片与详情页各出现一次且无零散兜底
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据 docs/interaction.md §6/§7 收敛规则，验证「条件信息请见来源公告」提示在卡片与详情页各仅出现一次、零散「条件见来源」兜底文案不再出现。

### 卡片与详情页经 hasConditionInfo 判定提示条显隐
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据收敛规则，验证卡片与详情页源码均经 hasConditionInfo 决定提示条渲染。

### 报名已截止徽标样式区别于红色即将截止与灰色已截止徽标
- 如何运行：`npm run test`（scripts/tests/jobs-ui.test.ts）
- 测试内容：依据 docs/interaction.md §3 色彩协议，验证三种徽标样式类互不混用。

## 模块 detail-enrich 测试

### detailSections 区块渲染判定（条件信息区按字段存在性渲染）
- 如何运行：`npx tsx scripts/tests/detail-enrich.test.ts`
- 测试内容：依据 docs/interaction.md §7「条件信息区块（第 3 轮改版）」与 docs/modules/detail-enrich_interaction.md §2.1，验证 detailSections 纯函数：来源核验记录含 education 或 original_major_requirements 时条件信息区 visible=true 且标题为「已核验条件信息」；关键字段核验记录含 salary 时 visible=true；逐字段核验记录标题为「原公告资格条件」；五项条件字段全空的记录条件信息区 visible=false。

### detailSections 区块渲染判定（其余区块）
- 如何运行：`npx tsx scripts/tests/detail-enrich.test.ts`
- 测试内容：依据 docs/interaction.md §7「职能标签区块」「条件信息区块」与 docs/modules/detail-enrich_interaction.md §2.1，验证：job_functions 非空时方向与职能标签区 visible=true（空数组不渲染）；platform_disciplines 非空时同区 visible；responsibilities 非空时职责区 visible；preferred_skills 非空时优先条件区 visible；description 非空时本站说明区 visible；source_evidence 非空时来源核验区 visible；五区块字段全空时对应区 visible=false；返回清单的 key 顺序固定且与页面渲染顺序一致。

### 详情页展示接线（源码结构断言）
- 如何运行：`npx tsx scripts/tests/detail-enrich.test.ts`
- 测试内容：依据 docs/interaction.md §7「条件信息区块（第 3 轮改版）」「职能标签区块（第 3 轮新增）」「招聘类型标识（第 3 轮新增）」与 docs/modules/detail-enrich_interaction.md §2.1，对 src/app/jobs/[id]/page.tsx 源码做结构断言：页面经 detailSections 判定渲染条件信息区与方向职能标签区、不再按 verification_level 门槛单独渲染条件区块；job_functions 标签与方向标签同区渲染（secondary 色系）；recruit_type 存在时以既有校招/社招徽标样式（bg-blue-100/bg-green-100）在标题旁展示；长文本行保持 whitespace-pre-wrap 完整渲染。

## 模块 match 测试

### 教育经历命中与理由生成
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据 docs/modules/match_interaction.md §2 与 docs/design.md §4 契约 21，对画像「硕士·计算语言学」断言：original_major_requirements 原文含该专业的岗位命中且理由为「硕士·计算语言学 ↔ 专业要求原文」（引用画像条目与岗位字段）；学历对照达标的岗位（岗位学历要求为硕士）得分高于同条件但要求博士的岗位。

### 工作经历命中 title 与平台职能标签
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §2（维度「工作经历↔title/job_functions」），对工作经历「数据分析师」断言：岗位 title 包含该名称时理由「数据分析师 ↔ 岗位名称」；岗位 job_functions 含「数据」时理由「数据分析师 ↔ 职能标签」且强度低于 title 命中。

### 技能命中 required_skills 与 preferred_skills
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §2（维度「技能↔required/preferred_skills」），对技能「Python」断言：命中 required_skills 时理由「Python ↔ 技能标签」且得分高于命中 preferred_skills 的同条件岗位（后者理由为「Python ↔ 优先技能标签」）。

### 方向契合经 DISCIPLINES 关键词映射命中平台方向
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据 docs/modules/match_design.md §3（画像专业映射的平台方向命中 platform_disciplines），对专业「数据科学」（含 DISCIPLINES 关键词「数据」）断言：platform_disciplines 含「数据科学×社会科学」的岗位命中且理由「数据科学 ↔ 平台方向标签」。

### 排序：多维度命中排在单维度命中之前
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §4 断言 2，对画像「硕士·计算语言学 + 技能 Python」与两个夹具岗位（同时命中教育+技能 vs 仅命中技能）断言多维度命中岗位排名在前、得分降序。

### 权重注入可翻转相对顺序且默认权重顺序稳定
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §4 断言 5，对「仅教育命中」与「仅工作命中」两个夹具岗位，断言默认权重下教育命中在前（教育权重高于工作）；注入 education 低于 work 的权重后顺序翻转，验证权重集中于 src/lib/match.ts 常量且经 weights 参数可调。

### 空画像返回空数组且零命中岗位不出现
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §2 边界检查，断言空画像对任意目录返回空数组；夹具中的零命中岗位（无任何可命中字段）不出现在结果中。

### 正则特殊字符按字面量匹配不报错
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §2 边界检查，对技能「C++」与专业含括号的画像断言正常命中（String.includes 字面量包含）、不抛异常、理由正确。

### 无平台标签且 title/专业要求为空的记录不进推荐
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §4 断言 3（打分依据限定），对 title 与 original_major_requirements 为空、无任何平台标签的记录断言其不出现在任何画像的推荐结果中。

### 画像存储解析与结构归一化
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据 docs/design.md §4 契约 20（解析失败按空画像处理）与模块交互文档 §3，断言 parseStoredProfile 对 null、非 JSON 文本、结构不合法（字段非数组、成员非字符串）输入返回空画像或字段级归一化结果且不抛异常；readStoredProfile 在无 window（Node 环境）下返回空画像；mock localStorage 注入后读取到已存画像。

### 画像增删纯函数语义
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据模块交互文档 §3 增删语义，断言六个增删函数与 clearAll：添加 trim 后为空的输入被忽略；与既有条目重复（小写化后相同）的不重复添加；删除按索引且越界静默；原画像对象不被修改（不可变）；clearAll 返回空画像。

### useProfile hook 与页面接线（源码结构断言）
- 如何运行：`npx tsx scripts/tests/match.test.ts`
- 测试内容：依据 docs/interaction.md §5a 与模块交互文档 §4，对源码做结构断言：use-profile.ts 带 'use client'、使用键 `jiaodian-profile`、含 window 守卫与写失败静默；/match 页为客户端组件、经 useMemo 实时重算、含地区/单位类型组合筛选（引用 REGIONS/ORG_TYPES）与空画像引导文案；profile-editor 含三组编辑器与自定义阶段文本输入、空输入禁用添加；recommend-list 引用 JobCard、渲染理由标签与「暂无高度匹配岗位」空态；header 导航首位含「岗位匹配」/match 链接。

## 模块 match 测试

### matchProfile 打分与排序
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据 docs/modules/match_interaction.md §2 与契约 21，验证多维命中（专业要求原文 + 技能 + 方向标签）岗位排在单维命中之前、结果按得分降序、最高分归一化为 100、零命中岗位不进推荐。

### matchProfile 理由生成
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据契约 21 理由要求，验证每条理由引用画像条目与命中的岗位字段（如「硕士·计算语言学 ↔ 专业要求原文」「技能 Python ↔ 技能标签」）。

### matchProfile 空画像与零命中
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据模块交互文档 §2 边界检查，验证空画像返回空数组、无平台标签且 title/original_major_requirements 为空的记录不出现（打分依据限定）。

### matchProfile 正则特殊字符字面量匹配
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据模块交互文档 §2 边界检查，验证技能名含正则特殊字符（如 C++）时按字面量匹配不抛异常。

### matchProfile 打分依据限定
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据契约 21，验证仅 description 含关键词的记录不命中（打分不使用未核验内容）。

### matchProfile 权重影响排序
- 如何运行：`npm run test`（scripts/tests/match.test.ts）
- 测试内容：依据模块设计文档 §3 权重集中定义，验证技能权重归零后仅技能命中的岗位不再居首（权重可调生效）。

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
- 2026-11-05 | 范围：整库（::ci 第 2 轮）| 通过：npm run test 7/7 套件；npm run build 成功（209 个详情页与目录一致）；npm run audit:jobs 在线审计 209 条全量回源命中（165 逐字段/33 来源/11 关键字段）；处置 2 条——589 证据锚点改为静态可命中片段（原长句证据来自页面 JS 渲染岗位卡）、588（清华 AIR）来源站点本环境持续不可达收敛为关键字段核验并留痕
- 2026-11-05 | 范围：GUI 视觉验收（::ci 第 2 轮）| 通过：13 张截图复拍判读，verdict overall=pass（1 warn：notfound 环境限制）；列表页确认 209 条计数与新批次完整条件字段展示
- 2026-11-06 | 范围：模块 data-acquisition（第 2 轮补采，分支 dev/data-acquisition-3，worktree .worktrees/data-acquisition-3）| 腾讯华为补采：运行 `npx tsx scripts/tests/data-acquisition.test.ts`：通过 29 组断言 / 失败 0，覆盖 77 条记录（北京 10、上海 10、跨学科 10、事业单位 9、科研院所 13、大厂综合 12、京沪事业单位增补 6、腾讯华为补采 7；其中事业单位 30 条）；`npx tsc --noEmit` 通过（0 错误）。
- 补充核验（腾讯华为补采）：一次性底稿脚本（workspace/acquisition/verify-evidence-3.ts，normalize 口径与 user-agent 均与 scripts/audit-verified-jobs.ts 一致，提交前已删除）对新增 7 条记录（腾讯 4 条、华为 3 条）逐条在线回源，source_title、published_at（含中文日期变体）与全部 source_evidence 片段逐字命中，7/7 全量通过；腾讯记录来源为腾讯招聘官网职位数据接口（详情页 jobdesc.html 为 JS 渲染壳，来源渠道说明见模块交互文档 §2b），华为记录来源为南开大学就业信息网转载职位页；来源清单与放弃候选原因见 workspace/acquisition/sources-3.md（本地产物，不入库）。
- 2026-11-11 | 范围：模块 detail-enrich | 通过 20/20（详情区块判定与改版断言）；补提取执行——440（中科院物理所 AI4S 中心）：补学历/薪资/申请方式/本站说明四字段（来源页原文证据，apply 在线复核命中），维持来源核验；588（清华 AIR）站点恢复可达、证据 4/4 命中，回升「来源核验」；放弃记录与原因——583（字节 seed 招聘页无标注字段可抽取）、584/585/604（飞书详情页静态内容仅标题）、401/439/476（GBK 编码站点工具链不可核验）、449/602/579-582（JS 渲染壳）；离线审计与 tsc 通过
- 2026-11-11 | 范围：模块 match | 通过 7 组断言（打分排序与归一化、理由生成、空画像与零命中、正则字面量、打分依据限定、权重生效）；tsc --noEmit 无错误
