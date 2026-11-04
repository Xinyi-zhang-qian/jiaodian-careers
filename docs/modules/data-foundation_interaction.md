# data-foundation 模块交互文档

> 用户交互规格见 docs/interaction.md §11（add:jobs / audit:jobs 命令行），此处只定义模块内部接口。

# 1. 交互面总览

- 对外公共接口：`jobsCatalog`（src/data/jobs/index.ts 默认导出，供 src/lib/data.ts 与 audit 脚本消费）。
- 命令行入口：`npm run add:jobs -- <json路径> --batch <批次名>`（用户交互规格归 docs/interaction.md §11）。
- 内部关键接口：`validateJobRecord(record)`（add-jobs.ts 内部校验函数）、audit 脚本的规则集。

# 2. audit 脚本规则规格（扩展后全集）

签名：`npm run audit:jobs [--offline]`（调用方：维护者、prebuild）。

| 规则 | 触发条件 | 表现 |
| --- | --- | --- |
| ID 唯一 | jobsCatalog 中重复 id | 错误行 `ID {id}: duplicate id` |
| 层级必填 | 无 verification_level | `ID {id}: missing verification_level` |
| 证据必填 | 非「待核实」缺 source_title 或 source_evidence | `ID {id}: missing source_title/source_evidence` |
| 待核实纯净 | 待核实记录携带 evidence/专业/学历/经验/薪资/职责/deadline | `ID {id}: unverified listing contains unverified condition fields` |
| HTTPS | 逐字段核验来源非 https | `ID {id}: source_url must use HTTPS` |
| 禁止 demo | is_demo 为 true | `ID {id}: verified dataset cannot contain demo data` |
| ★ 报名窗口日期格式 | application_opens_at 或 deadline 非 YYYY-MM-DD | `ID {id}: invalid date format: {字段}` |
| ★ 报名窗口先后 | application_opens_at > deadline | `ID {id}: application_opens_at after deadline` |
| ★ 职能枚举 | job_functions 含 JOB_FUNCTIONS 之外取值 | `ID {id}: unknown job_function: {值}` |
| 在线核对 | 逐字段核验：标题/发布日期三变体/全部证据片段命中来源页规范化文本；来源核验：证据片段命中 | 未命中 → `ID {id}: ... not found`；HTTP 非 200 / fetch 异常 → 对应错误行 |

成功输出：`Audited {N} public jobs ({x} field-level, {y} source-level, {z} key-field)…`；失败退出码 1。

# 3. add:jobs 内部校验规格

签名：`validateJobRecord(record: unknown, existingIds: Set<number>): string[]`（返回错误列表，空数组即合法；调用方 add-jobs.ts main）。

- 预期输入：单条记录对象；必填字段——`title`、`organization`、`province`、`city`、`org_type`（五枚举）、`job_type`、`source_url`（http/https）、`source_name`、`source_type`（三枚举）、`published_at`（YYYY-MM-DD）、`status`（三枚举）、`verification_level`（四枚举）、`source_title`、`source_evidence`（非空字符串数组）；「待核实」层级禁止携带条件字段（同 audit 规则）；`application_opens_at`/`deadline` 可选但格式必须 YYYY-MM-DD 且先后合法；`job_functions` 取值必须在枚举内；`id` 不允许出现在输入中（自动分配）。输入对象只允许携带 Job 模式已知字段（types.ts Job 接口全集），任何未知字段出现即报错，保证写入的批次文件满足 Job 类型；已知字段出现时类型必须符合 Job 定义（纯字符串字段不接受 null，数组字段元素须为非空字符串）。
- 预期输出：错误列表（中文描述含字段名）；无错误时由调用方写入。
- 边界检查：JSON 文件不存在/非法 JSON/顶层非数组 → 整体错误退出码 1；批次名非 kebab-case（`/^[a-z0-9-]+$/`）→ 拒绝；批次文件已存在 → 追加模式（去重：与现有 jobsCatalog 的 `title+organization+source_url` 重复的记录跳过并提示）；维护者未提供的结构字段由写入层按空值语义缺省填充——`location`、`original_major_requirements`、`education`、`experience`、`description`、`responsibilities`、`application_info` 置空串，`platform_disciplines`、`required_skills`、`preferred_skills` 置空数组，`salary`、`deadline` 置 null，`fetched_at`、`last_verified` 置录入当日，`is_demo` 置 false，缺省填充不视作内容补写；输出目录可用 `--jobs-dir <目录>` 覆盖（默认 `src/data/jobs`），仅供模块测试隔离写入。
- 错误处理：任一记录校验失败 → 整批拒绝，列出全部错误，不产生任何文件写入。

# 4. 迁移验收断言

1. 迁移后 `jobsCatalog.length` = 200（13 + 15 + 109 + 63），与迁移前白名单逐条等值（按 id 对比全字段，除新增两可选字段缺省外无差异）。
2. `npm run audit:jobs:offline` 通过。
3. 旧白名单四文件删除后 `npx tsc --noEmit` 无引用错误（data.ts 的切换由 jobs-ui 模块同步完成，本模块验收不含 data.ts）。
