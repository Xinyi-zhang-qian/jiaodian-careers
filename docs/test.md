# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

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
