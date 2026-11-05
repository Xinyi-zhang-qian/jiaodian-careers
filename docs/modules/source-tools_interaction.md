# source-tools 模块交互文档

> 命令行用户交互规格见 docs/interaction.md §11（extract:fields、refresh:sources 两行），此处只定义模块内部接口。

# 1. 交互面总览

- 对外公共接口：`extractCandidates(job, normalizedHtml) -> candidates`、`applyConfirmed(json) -> 写库结果`、`classifySource`（复用 recheck-core）。
- 命令行入口：extract:fields（scan/apply）、refresh:sources（交互规格归 docs/interaction.md §11）。

# 2. extractCandidates 规格

- 签名：`extractCandidates(job: Job, normalizedHtml: string): { candidates: Record<字段, { value: string; evidence: string }>, inaccessible?: string }`。
- 预期输入：前台记录 + 其来源页规范化文本。
- 预期输出：候选字段对象——每个候选字段给出从页面提取的值与一段可命中的证据片段（≥10 字符，取自页面原文）；页面无法访问时返回 inaccessible 含原因；抽取不到的字段不出现在 candidates 中。
- 边界检查：规范化文本为空 → inaccessible「页面内容为空」；证据片段无法命中 → 该字段不进入候选（宁可少提取不提取假证据）。
- 错误处理：纯函数，不抛异常。

# 3. applyConfirmed 规格

- 签名：`applyConfirmed(confirmed: Record<id, { 字段: 值, _evidence: Record<字段, 片段>, _level?: string }>, catalog: Job[]): { applied: number[], rejected: { id, reason }[] }`。
- 预期输入：人工确认后的 JSON（只含允许清单内的字段）。
- 预期输出：应用与拒绝清单；被应用的记录写入对应批次文件（字段值、证据追加进 source_evidence、层级按 _level 或证据充分度、last_verified=当日）。
- 边界检查：id 不存在 → 拒绝；字段值对应的证据片段在其来源页在线复核不命中 → 该条拒绝（整条拒绝，不做部分写入）；`_level` 只允许升级方向（关键字段核验→来源核验→逐字段核验），降级请求拒绝。
- 错误处理：apply 完成后自动运行 `audit:jobs:offline`，失败时退出码 1（已写文件需人工修正——这是唯一允许「写后失败」的位置，因审计在写入之后运行）。

# 4. refresh 分类规格

- 签名：`classifyRefresh(job: Job) -> RefreshItem`（在线，复用 recheck-core fetch/normalize）。
- 分类口径（与 docs/interaction.md §11 一致）：锚点命中且含招聘关键词 → 现行有效；页面存在但锚点不命中/停招字样/过期提示页 → 内容失配（note 注明）；404/域名失效/反爬 403/失效跳转（如「该信息已过期」）→ 来源过期。
- 边界：单条失败不中断整批；不写库。

# 5. 模块验收断言

1. scan 对夹具 HTML 正确抽取候选字段且证据片段可命中；对空页面返回 inaccessible。
2. apply 对证据不命中的记录整条拒绝且不写库；对合法确认写入批次并升级层级。
3. refresh 对夹具页面正确分类（有效/失配/过期）。
