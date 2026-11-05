# source-tools 模块交互文档

> 命令行用户交互规格见 docs/interaction.md §11（extract:fields、refresh:sources 两行），此处只定义模块内部接口。

# 1. 交互面总览

- 对外公共接口：`extractCandidates(job, normalizedHtml) -> candidates`、`applyConfirmed(confirmed, catalog, options) -> 写库结果`、`classifyRefresh(job, deps) -> RefreshItem`、缺省目标筛选 `selectScanTargets(catalog)` 与 `selectRefreshTargets(catalog)`；分类口径复用 recheck-core 的 `classifySource` 与 `normalizeHtml`。
- 命令行入口：extract:fields（scan/apply）、refresh:sources（交互规格归 docs/interaction.md §11）。

# 2. extractCandidates 规格

- 签名：`extractCandidates(job: Job, normalizedHtml: string): { candidates: Record<string, { value: string; evidence: string }>, inaccessible?: string }`；调用方：extract-fields.ts `--scan`。
- 预期输入：前台记录 job（用于跳过记录已有值的字段）+ 来源页规范化文本（recheck-core `normalizeHtml` 产物，无空白字符）。
- 预期输出：候选字段对象——每个候选键给出从页面提取的值与一段可命中的证据片段（≥10 字符，取自规范化文本原样切片）；抽取不到的键不出现在 candidates 中；页面内容为空时返回 `{ candidates: {}, inaccessible: '页面内容为空' }`。
- 候选键分两组：
  - 可直接写入批次文件（apply 允许清单成员）：`education`（学历要求）、`salary`（薪资待遇）、`responsibilities`（岗位职责）、`original_major_requirements`（专业要求）、`application_info`（报名方式）；
  - 参考信息（不在 apply 允许清单，人工处置时并入其他字段）：`recruit_count`（招聘人数）、`application_schedule`（报名安排：报名时间/截止时间）、`contact`（联系方式）。
- 抽取规则（集中在 scripts/lib/extract-core.ts，标签分区启发式）：
  1. 每个候选键配置一组触发标签（长词在前），在规范化文本中查找「标签 + 冒号（：或:）」的首次出现作为分区起点；
  2. 分区终点为「任意候选键的任意标签 + 冒号」在分区起点之后出现的最小位置，且不超过 300 字符；其后无标签时截到文本末尾；
  3. value 为冒号之后到分区终点的文本；value 为空则该键不进入候选；
  4. evidence 为规范化文本中自标签起点起的原样切片，长度取 min(80, max(10, 分区长度))；切片不足 10 字符时向后扩展到 10 字符（文本不足时取文本末尾 10 字符）；evidence 必须能在规范化文本中 includes 命中，命中不了则该键不进入候选（宁可少提取不提取假证据）；
  5. 可写入组键在 job 对应字段已有非空值时跳过抽取（scan 服务于字段空白记录的充实）；参考信息组键始终抽取。
- 边界检查：规范化文本为空 → inaccessible「页面内容为空」；无任何标签命中 → 返回空 candidates 且不带 inaccessible。
- 错误处理：纯函数，不抛异常。

# 3. applyConfirmed 规格

- 签名：`applyConfirmed(confirmed: Record<string, { [字段: string]: unknown; _evidence?: Record<string, string>; _level?: string }>, catalog: Job[], options?: { jobsDir?: string; fetchImpl?: typeof fetch; today?: string }): Promise<{ applied: number[]; rejected: { id: string; reason: string }[] }>`；调用方：extract-fields.ts `--apply` 与模块测试。
- options：`jobsDir` 批次文件目录（缺省 `src/data/jobs`）；`fetchImpl` 在线复核用 fetch（测试注入假实现，不发真实请求）；`today` 记账日期（缺省当日，测试注入固定日期）。
- 预期输入：人工确认后的 JSON——顶层键为记录 id（十进制数字串），值为 `{ 字段: 值…, _evidence: { 字段: 证据片段 }, _level?: 层级 }`，字段只含允许清单成员：`original_major_requirements`、`education`、`experience`、`salary`、`responsibilities`、`description`、`application_info`、`deadline`、`application_opens_at`、`recruit_type`、`platform_disciplines`、`job_functions`。
- 校验按序逐条独立执行，任一失败整条拒绝且该条不产生任何写入：
  1. id 非数字串或 catalog 中不存在 → 拒绝「记录不存在」；
  2. 未包含任何字段 → 拒绝；字段不在允许清单 → 拒绝（逐字段列出）；
  3. 字段值类型非法 → 拒绝：条件字符串字段须非空字符串；`deadline`/`application_opens_at` 须 YYYY-MM-DD 且二者合成值（新值缺省取记录既有值）不得 opens 晚于 deadline；`recruit_type` 须「校招/社招」；`platform_disciplines`/`job_functions` 须非空字符串数组且 `job_functions` 在 JOB_FUNCTIONS 枚举内；
  4. 每个新字段值必须带 `_evidence` 片段且长度 ≥10 字符，缺失或不足 → 拒绝；
  5. `_level` 须为四层级之一，且相对记录当前层级（缺省按「待核实」）必须是严格升级（待核实 < 关键字段核验 < 来源核验 < 逐字段核验），非升级请求（降级或同级）拒绝；请求「逐字段核验」而 source_url 非 HTTPS → 拒绝；
  6. 当前层级为「待核实」且未声明 `_level` 时，写入条件字段自动升至「关键字段核验」（契约 2「待核实不得携带条件字段」的必然要求）；由「待核实」升级（含自动）要求记录已有 `source_title`，缺失则拒绝；
  7. 在线复核：抓取记录 source_url（超时 15s）规范化后逐片段 includes 复核，任一片段不命中或来源页无法访问/非 2xx → 整条拒绝。
- 写入：通过的记录在其所在批次文件（jobsDir 下含该记录对象的 .ts 文件；按字符串字面量与注释感知的扫描定位 id 字段与记录对象文本区间）原位替换为更新后的单行 JSON 记录——字段值更新、各字段证据片段去重追加进 source_evidence、verification_level 按第 5/6 条更新、last_verified=当日；批次头注释与文件其余内容不变。多记录逐条独立，单条失败不影响其他条。
- 预期输出：applied 为写入成功的记录 id（number，按输入顺序）；rejected 的 id 为确认 JSON 的键原文（string），reason 为拒绝原因。
- 错误处理：`audit:jobs:offline` 由命令层（extract-fields.ts `--apply`）在 applyConfirmed 返回后自动执行，失败时退出码 1（此时批次文件已写入，需人工修正——这是唯一允许「写后失败」的位置，因审计在写入之后运行）；applyConfirmed 本身仅在 jobsDir 无法读取等环境异常时抛异常。

# 4. refresh 分类规格

- 签名：`classifyRefresh(job: Job, deps?: { fetchImpl?: typeof fetch; timeoutMs?: number }): Promise<RefreshItem>`（在线，复用 recheck-core `classifySource` 的 fetch/normalize 与分类口径）；调用方：refresh-sources.ts 与模块测试。
- 实现口径：把记录映射为 LegacyRecord（origin 取 'real-jobs'，有 source_title 时以 source_title 作锚点，否则以 title 作锚点）后调用 classifySource，再按下表映射归类（过期提示页、停招字样例外同样适用）：
  - 可升级（锚点命中且含招聘关键词）→ **现行有效**；
  - 建议下架（URL 非法、域名失效、HTTP 404/410、401/403/429 反爬拦截）→ **来源过期**；
  - 需人工复核且 note 含「过期提示页」（如南开就业网「该信息已过期」跳转页）→ **来源过期**，note 原样保留；
  - 其余需人工复核（锚点不命中、疑似非招聘页、停招字样、页面内容为空、网络异常、其余非 2xx）→ **内容失配**，note 原样保留（网络异常时 note 为「访问失败：原因」）。
- 预期输出：RefreshItem `{ id: number, title: string, organization: string, source_url: string, verdict: '现行有效'|'内容失配'|'来源过期', http_status: number|null, note: string }`。
- 边界检查：单条失败不中断整批（classifySource 在函数内部消化异常，调用层另有兜底捕获）；不写库文件；缺省目标由 `selectRefreshTargets` 选取：status「状态待核实」或 verification_level 为「来源核验/关键字段核验」的记录（逐字段核验记录由 audit:jobs 在线审计覆盖，不重复刷新）。
- 错误处理：分类结果只进 workspace 产物与控制台摘要，不产生任何写库副作用。

# 5. 模块验收断言

1. scan 对夹具 HTML 正确抽取候选字段且证据片段可命中；对空页面返回 inaccessible；记录已有值的可写入键被跳过。
2. apply 对证据不命中、id 不存在、_level 非升级的记录整条拒绝且不写库；对合法确认写入批次（字段值、证据追加、层级升级、last_verified 更新）且批次头注释保持不变。
3. refresh 对夹具页面正确分类（锚点命中+招聘关键词 → 现行有效；「该信息已过期」跳转页 → 来源过期；锚点不命中/停招字样 → 内容失配）。
