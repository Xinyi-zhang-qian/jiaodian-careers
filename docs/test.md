# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

<<<<<<< HEAD
<<<<<<< HEAD
（暂无；整库回归测试由 ::ci 建立）

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

## 模块 data-foundation 测试
### jobsCatalog 完整性
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_design.md §2 批次聚合结构与 §4 迁移验收断言 1，验证 `src/data/jobs/index.ts` 聚合出的 jobsCatalog 共 200 条、id 全目录唯一，核验层级分布为逐字段核验 28 条、来源核验 76 条、关键字段核验 96 条（13 + 63 + 15 + 109 四批次齐全）。

### audit:jobs:offline 通过
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，内部以子进程运行 `npx tsx scripts/audit-verified-jobs.ts --offline`）
- 测试内容：依据 docs/interaction.md §11 `audit:jobs:offline` 行与 docs/modules/data-foundation_interaction.md §2 规则全集，验证离线审计不发网络请求、退出码为 0，并输出 `Audited 200 public jobs (28 field-level, 76 source-level, 96 key-field)` 计数行。

### add:jobs 校验矩阵（validateJobRecord）
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_interaction.md §3 validateJobRecord 规格，验证合法记录返回空错误列表；缺 source_title、缺 source_evidence、org_type/status 枚举外取值、published_at 非 YYYY-MM-DD、application_opens_at 晚于 deadline、job_functions 含枚举外取值、输入携带 id 字段七类非法输入各自被拒绝且错误信息含字段名；输入携带 Job 模式未知字段被拒绝。

### add:jobs 整批写入行为
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，通过 `--jobs-dir` 注入临时目录隔离写入）
- 测试内容：依据 docs/interaction.md §11 add:jobs 行与 docs/modules/data-foundation_interaction.md §3 错误处理与边界检查，验证批次内任一记录非法时整批拒绝、退出码 1、不产生任何文件写入；title+organization+source_url 与现有目录重复的记录被跳过并提示；合法批次自动分配 ID（现有 jobsCatalog 最大 id+1 起递增）、创建批次文件、更新 index.ts 的 import 与聚合行，并以退出码 0 结束；非 kebab-case 批次名（如 Bad_Batch）被拒绝且无文件写入。

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

## 最近一轮结果
- 2026-11-04 | 模块 jobs-ui | 通过 27/共 27 | 无失败（`npx tsx scripts/tests/jobs-ui.test.ts` 全部通过；`npx tsc --noEmit` 无类型错误）。
- 2026-11-04 | 模块 legacy-cleanup | 通过 18/18，失败 0 | 运行方式：`npx tsx scripts/tests/legacy-cleanup.test.ts`（聚合入口 `npm run test` 通过，1/1 套件）；`npx tsc --noEmit` 无错误。
  - 覆盖：classifySource 判定口径第 1–9 条（可升级/需人工复核/建议下架/未核验、过期提示页与已暂停招聘例外）、normalizeHtml、markUnverified、mergeDetails 同 id 覆盖、buildReport 三清单并集等于复核全集且无重复。
  - 复核执行（`npm run recheck:legacy`，在线模式）：全量 295 条复核完成——可升级 51（real-jobs 24、expanded-source-leads 27、platform-sources 0）、需人工复核 236（含过期提示页 36、停招标注 1、访问失败 19、页面内容为空 7、HTTP 非成功 4、疑似非招聘页 3、锚点不命中 166）、建议下架 8（域名失效 3 经 nslookup 独立佐证、反爬拦截 403/404 共 5）；未核验 0。明细与报告见 `workspace/legacy-recheck/`（本地工作产物，不入库）。
  - 抽样验证：可升级条目（南开 117635/116865、猎聘 ps-4 前身）来源页实际内容与锚点命中逐一核对；猎聘 ps-4 因页面标注「该职位已暂停招聘」由可升级改判需人工复核，据此在口径第 8/9 条补充停招例外。
  - 处置建议（逐条 id）见 `workspace/legacy-recheck/report.md` 处置建议节；物理删除与迁入由主 Agent 在合并阶段执行。
- 2026-11-04 | 范围：模块 data-foundation | 通过 6/6（jobsCatalog 完整性 200 条、audit offline、add:jobs 校验矩阵、合法批次写入与 ID 自动分配、整批拒绝无写入、批次名校验）；类型检查 tsc --noEmit 无错误
- 2026-11-04 | 范围：模块 data-foundation（一次性迁移校验，仅本轮运行，不计入永久测试）| 通过：200/200 条按 id 逐字段等值（迁移脚本运行确认；脚本按其头部声明在提交前删除）
- 2026-11-04 | 范围：data-acquisition 模块 | 运行 `npx tsx scripts/tests/data-acquisition.test.ts`：通过 9 组断言 / 失败 0，覆盖 30 条记录（北京 10、上海 10、跨学科 10；其中事业单位 15 条）；`npx tsc --noEmit` 通过（0 错误）。
- 补充核验：本地底稿脚本（workspace/acquisition/verify-evidence.ts，normalize 口径与 scripts/audit-verified-jobs.ts 一致）对 30 条记录逐条在线回源，source_title、published_at（含中文日期变体）与全部 source_evidence 片段逐字命中，全量通过。
=======
（本节放库级测试：模块间集成、端到端、契约、视觉验收等；由各模块与 ::ci 按规格登记。）

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

## 最近一轮结果

- 2026-11-04 | 模块 legacy-cleanup | 通过 18/18，失败 0 | 运行方式：`npx tsx scripts/tests/legacy-cleanup.test.ts`（聚合入口 `npm run test` 通过，1/1 套件）；`npx tsc --noEmit` 无错误。
  - 覆盖：classifySource 判定口径第 1–9 条（可升级/需人工复核/建议下架/未核验、过期提示页与已暂停招聘例外）、normalizeHtml、markUnverified、mergeDetails 同 id 覆盖、buildReport 三清单并集等于复核全集且无重复。
  - 复核执行（`npm run recheck:legacy`，在线模式）：全量 295 条复核完成——可升级 51（real-jobs 24、expanded-source-leads 27、platform-sources 0）、需人工复核 236（含过期提示页 36、停招标注 1、访问失败 19、页面内容为空 7、HTTP 非成功 4、疑似非招聘页 3、锚点不命中 166）、建议下架 8（域名失效 3 经 nslookup 独立佐证、反爬拦截 403/404 共 5）；未核验 0。明细与报告见 `workspace/legacy-recheck/`（本地工作产物，不入库）。
  - 抽样验证：可升级条目（南开 117635/116865、猎聘 ps-4 前身）来源页实际内容与锚点命中逐一核对；猎聘 ps-4 因页面标注「该职位已暂停招聘」由可升级改判需人工复核，据此在口径第 8/9 条补充停招例外。
  - 处置建议（逐条 id）见 `workspace/legacy-recheck/report.md` 处置建议节；物理删除与迁入由主 Agent 在合并阶段执行。
>>>>>>> dev/legacy-cleanup
=======
（占位说明：本节用于登记库级测试——模块间集成、端到端、契约、视觉验收等，由主 Agent 在分支合并阶段统一登记；并行开发期间各模块只在下方各自模块小节登记模块内测试，聚合运行入口 `npm run test` 由主 Agent 合并时建立。）

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

## 最近一轮结果

- 2026-11-04 | 模块 jobs-ui | 通过 27/共 27 | 无失败（`npx tsx scripts/tests/jobs-ui.test.ts` 全部通过；`npx tsc --noEmit` 无类型错误）。
>>>>>>> dev/jobs-ui
