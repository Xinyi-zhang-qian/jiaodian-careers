# legacy-cleanup 模块交互文档

> 用户交互规格见 docs/interaction.md §11（recheck:legacy 命令行），此处只定义模块内部接口。

# 1. 交互面总览

- 命令行入口：`npm run recheck:legacy -- [--offline] [--ids id1,id2] [--limit N]`（交互规格归 docs/interaction.md §11）。
- 内部关键接口：`classifySource(record, deps?)`（分类判定）、`normalizeHtml(html)`（HTML 规范化）、`markUnverified(record)`（离线态标注）、`mergeDetails(old, fresh)`（明细合并）、`buildReport(details, meta)`（报告产出）。

# 2. classifySource 规格

- 签名：`async classifySource(record: LegacyRecord, deps?: { fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<RecheckItem>`（调用方：recheck-legacy.ts 主流程与模块测试）。
- 预期输入：一条遗留记录 `{ origin, id, title, organization, source_url, source_title? }`（字段缺失按空串处理）；deps 未传时用全局 fetch 与 15 秒超时，测试注入 fetchImpl 假实现，不发真实请求。
- 预期输出：RecheckItem（见设计文档 §4），verdict 为「可升级 / 需人工复核 / 建议下架」之一（「未核验」只由 markUnverified 产生）。判定口径（写死在 recheck-core.ts，report.md 头部同步声明）：
  1. URL 缺失或非 http(s) → 「建议下架」，note「URL 非法」；
  2. fetch 抛错且为 DNS 解析失败（ENOTFOUND / EAI_AGAIN）→ 「建议下架」，note 含「域名失效」与原因；
  3. fetch 抛错（其余网络异常、超时）→ 「需人工复核」，note 含「访问失败：」与原因；
  4. HTTP 404/410 → 「建议下架」，note 含状态码；
  5. HTTP 401/403/429 → 「建议下架」，note 含「疑似反爬拦截」与状态码；
  6. 其余非 2xx 状态 → 「需人工复核」，note 含状态码；
  7. HTTP 2xx 但规范化文本为空 → 「需人工复核」，note「页面内容为空」；
  8. HTTP 2xx 且锚点命中（有 source_title 时 source_title 命中；平台快照要求 title 与 organization 都命中；其余 title 命中即可）且页面含招聘相关关键词（招聘/岗位/职位/报名/简历/recruit/hiring/career/job 之一）→ 「可升级」；页面标注「已暂停招聘 / 已停止招聘」类停招字样时例外，转第 9 条判「需人工复核」；
  9. HTTP 2xx 但锚点不命中、页面不含任何招聘相关关键词（疑似非招聘页），或页面标注停招字样（note 标注「已暂停招聘」；「信息已过期」类提示页在 note 中标注「过期提示页」）→ 「需人工复核」，note 注明「锚点不命中」或「疑似非招聘页」及命中情况。
- 边界检查：超时按第 3 条处理；重定向由 fetch 默认跟随，按最终响应判定。
- 错误处理：单条失败不中断整批（本函数内部捕获全部异常并落为明细条目，不向外抛错）。

# 3. 报告规格（buildReport）

- 签名：`buildReport(details: RecheckItem[], meta: { generatedAt: string; args: string; sources: Record<origin, number> }): string`（调用方：recheck-legacy.ts；测试直接调用并解析产物文本）。
- report.md 结构：头部（生成时间、参数、各清单加载条数、分类口径 9 条声明）→ 分类统计表（三分类 + 未核验 + 合计）→ 「可升级」清单表（id、单位、岗位、来源 URL、命中锚点、定层级建议）→ 「需人工复核」清单表（id、单位、岗位、原因）→ 「建议下架」清单表（id、单位、岗位、http 状态/原因）→ 处置建议（逐条列到记录 id：可升级经 add:jobs 迁入新批次并给默认层级「来源核验」；建议下架按 origin 给出对应文件的移除对象；需人工复核列人工确认动作；未核验给剩余条数与续跑命令）。
- 验收断言：三个清单的并集等于本次已复核（非「未核验」）明细的全量 id 集，无遗漏无重复；「未核验」条目只出现在统计与处置建议中，不进入三个清单。

# 4. 其余内部接口规格

- `normalizeHtml(html: string): string`：去 script/style 块、去标签、解 HTML 实体（&nbsp;/&amp;/&quot;/&lt;/&gt;/&#160;/&#34;）、压缩全部空白（含全角空格）、统一 en/em dash 为 `-`；调用方：classifySource 与模块测试。
- `markUnverified(record: LegacyRecord): RecheckItem`：返回 verdict「未核验」、http_status null、evidence_hits 空、note「离线模式未访问来源」的明细条目；调用方：recheck-legacy.ts 离线分支。
- `mergeDetails(old: RecheckItem[], fresh: RecheckItem[]): RecheckItem[]`：按 `origin + '#' + id` 去重，fresh 覆盖 old 中同键条目，old 独有条目保留，输出顺序保持 old 原序、新条目追加在后；调用方：recheck-legacy.ts 增量写入。
- 清单加载（recheck-legacy.ts 内部）：三份遗留文件一律 `await import()` + try/catch，失败时该来源记 0 条并向 stderr 输出提示行，进程继续。

# 5. 处置验收断言（处置执行时适用，本轮不触发）

1. 处置完成后仓库内不存在 `src/data/real-jobs.ts`；`platform-sources.ts` 不含 QUARANTINED 快照段。
2. `legacy-recheck-{日期}.ts` 中每条记录 verification_level 与报告「可升级」清单一致，且全部带 source_evidence。
3. `npm run audit:jobs:offline` 通过（新批次纳入 jobsCatalog 后）。
4. 前台不展示任何「建议下架」清单中的记录。
