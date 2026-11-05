# source-tools 模块设计文档

> 全局契约引用 docs/design.md §4（契约 17、18）、§5；本模块为第 2 轮新增脚本模块。

# 1. 模块职责与边界

- 职责：提供提取辅助命令 `extract:fields`（scan/apply 两阶段）与来源刷新分类命令 `refresh:sources`；复用 `scripts/lib/recheck-core.ts` 的抓取、规范化与分类基建。
- 数据所有权：`scripts/extract-fields.ts`、`scripts/refresh-sources.ts`、`scripts/lib/extract-core.ts`（如需独立抽取逻辑）；`workspace/extract/`、`workspace/source-refresh/`（本地产物）。
- 不负责：处置决策与批次文件修改（归 data-refresh）；新岗位采集（归 data-acquisition）；页面展示（归 jobs-catalog）。

# 2. 内部结构

```text
scripts/extract-fields.ts     # npm run extract:fields -- --scan|--apply
scripts/refresh-sources.ts    # npm run refresh:sources
scripts/lib/extract-core.ts   # 字段抽取规则（正则 + 分区启发式，来源页规范化文本上运行）
```

# 3. 内部数据流

**scan**：读取目标记录清单（--ids 或缺省取全部无任何条件字段的前台记录）→ 逐条抓取来源页（复用 recheck-core 的 fetch + normalize，超时 15s）→ `extractCandidates(job, normalizedHtml)` 按规则抽取候选字段 → 写 `workspace/extract/candidates-{时间戳}.json`（含记录 id、来源 URL、候选字段值、每个字段的证据片段与其在规范化文本中的命中位置）→ 控制台逐条摘要。单条失败记「无法访问：原因」继续。**scan 不写任何库文件。**

**apply**：读确认 JSON（`{ id: { 字段: 值, _evidence: { 字段: 证据片段 }, _level?: 层级 } }`）→ 校验（记录存在、字段在允许清单内、每个新字段值的证据片段在其来源页规范化文本中命中——apply 时在线复核）→ 写批次文件（保留原字段语义，更新 verification_level（若 JSON 声明升级且证据充分）与 last_verified=当日）→ 末尾自动执行 `audit:jobs:offline` 并回显计数。apply 直接编辑批次文件（与 data-refresh 相同的处置留痕规则：批次头注释不追加逐条记录，处置记录统一写在该批次头）。

**refresh:sources**：遍历目标记录（--ids 或缺省取全部「状态待核实」+ 来源/关键字段核验记录）→ 在线访问来源页 → 分类「现行有效（标题与组织锚点命中）/ 内容失配（页面存在但锚点不命中）/ 来源过期（404、过期提示页、失效跳转）」→ 写 `workspace/source-refresh/report-{时间戳}.json` 与控制台摘要。分类口径复用 recheck-core 的 CLASSIFY 规则语义（过期提示页、停招字样等例外同样适用）。不写库文件。

# 4. 内部数据结构

- 候选字段允许清单：`original_major_requirements`、`education`、`experience`、`salary`、`responsibilities`、`description`、`application_info`、`deadline`、`application_opens_at`、`recruit_type`、`platform_disciplines`（平台标签，抽取时单独标注）、`job_functions`（同前）。
- 候选 JSON 条目：`{ id, source_url, candidates: { 字段: { value, evidence } }, inaccessible?: string }`。
- 刷新分类条目：`{ id, title, organization, source_url, verdict: '现行有效'|'内容失配'|'来源过期', http_status|null, note }`。

# 5. 内部状态机

不适用（批处理）。
