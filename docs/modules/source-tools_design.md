# source-tools 模块设计文档

> 全局契约引用 docs/design.md §4（契约 17、18）、§5；本模块为第 2 轮新增脚本模块。

# 1. 模块职责与边界

- 职责：提供提取辅助命令 `extract:fields`（scan/apply 两阶段）与来源刷新分类命令 `refresh:sources`；复用 `scripts/lib/recheck-core.ts` 的抓取（UA、超时、异常消化）与规范化、分类基建。
- 数据所有权：`scripts/extract-fields.ts`、`scripts/refresh-sources.ts`、`scripts/lib/extract-core.ts`；`workspace/extract/`、`workspace/source-refresh/`（本地产物，不入库）。
- 不负责：处置决策与批次文件的删除/状态修正（归 data-refresh）；新岗位采集（归 data-acquisition）；页面展示（归 jobs-catalog）。

# 2. 内部结构

```text
scripts/extract-fields.ts     # npm run extract:fields -- --scan|--apply；applyConfirmed 与缺省目标筛选在此导出
scripts/refresh-sources.ts    # npm run refresh:sources；classifyRefresh 与缺省目标筛选在此导出
scripts/lib/extract-core.ts   # 字段抽取规则（标签分区启发式，来源页规范化文本上运行的纯函数）
```

# 3. 内部数据流

**scan**：读取目标记录清单（`--ids` 指定；缺省取全部无任何条件字段的前台记录——`original_major_requirements`、`education`、`salary`、`responsibilities`、`application_info` 五项全为空值，`src/data/jobs` 聚合目录）→ 逐条抓取来源页（UA 与 15s 超时同 recheck-core 口径，同 URL 缓存复用）→ `extractCandidates(job, normalizedHtml)` 按标签分区规则抽取候选字段 → 写 `workspace/extract/candidates-{时间戳}.json`（条目 `{ id, source_url, candidates: { 字段: { value, evidence } }, inaccessible? }`，含记录 id、来源 URL、候选字段值、每个字段的证据片段）→ 控制台逐条摘要。单条失败记「无法访问：原因」继续。**scan 不写任何库文件。**

**apply**：读确认 JSON（`{ id: { 字段: 值, _evidence: { 字段: 证据片段 }, _level?: 层级 } }`）→ `applyConfirmed` 逐条按序校验（记录存在 → 字段在允许清单与值类型 → 证据片段 ≥10 字符 → `_level` 严格升级与待核实纯净 → 在线复核证据命中）→ 通过的记录在其所在批次文件中原位替换为更新后的单行 JSON（字段值、证据去重追加进 source_evidence、层级按 `_level` 或待核实自动升至关键字段核验、last_verified=当日；批次头注释不变）→ 末尾命令层自动执行 `audit:jobs:offline` 并回显计数，审计失败退出码 1（文件已写，需人工修正）。apply 只写批次文件，单条失败整条拒绝且不产生该条任何写入。

**refresh:sources**：遍历目标记录（`--ids` 指定；缺省取全部「状态待核实」+ verification_level 为「来源核验/关键字段核验」的记录，逐字段核验记录由 audit:jobs 在线审计覆盖不重复刷新）→ 在线访问来源页 → `classifyRefresh` 按 recheck-core 口径分类「现行有效（锚点命中+招聘关键词）/ 内容失配（页面存在但锚点不命中、停招字样、页面内容为空、访问失败）/ 来源过期（404、域名失效、反爬 403、过期提示页、失效跳转）」→ 写 `workspace/source-refresh/report-{时间戳}.json` 与控制台摘要。单条失败不中断。不写库文件。

# 4. 内部数据结构

- 候选键两组（详见模块交互文档 §2）：可写入组 `education`、`salary`、`responsibilities`、`original_major_requirements`、`application_info`；参考信息组 `recruit_count`、`application_schedule`、`contact`。
- apply 允许清单：`original_major_requirements`、`education`、`experience`、`salary`、`responsibilities`、`description`、`application_info`、`deadline`、`application_opens_at`、`recruit_type`、`platform_disciplines`、`job_functions`。
- 候选 JSON 条目：`{ id: number, source_url: string, candidates: { 字段: { value, evidence } }, inaccessible?: string }`。
- 刷新分类条目：`{ id: number, title, organization, source_url, verdict: '现行有效'|'内容失配'|'来源过期', http_status: number|null, note }`。

# 5. 内部状态机

不适用（批处理）。
