# detail-enrich 模块交互文档

> 用户交互规格见 docs/interaction.md §7（详情页第 3 轮改版规格），此处只定义模块内部断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md §7）：条件信息区块（字段存在性渲染 + 层级口径标题）、职能标签区块、招聘类型标识。
- 维护者交互：extract:fields --scan/--apply（既有命令，规格见 docs/interaction.md §11）。

# 2. 逐接口交互规格

## 2.1 detailSections（区块渲染判定）

| 项目 | 内容 |
| --- | --- |
| 签名 | `detailSections(job: Job): { key: string; title: string; visible: boolean }[]`；调用方：`src/app/jobs/[id]/page.tsx` 与模块测试 |
| 预期输入 | `job`：完整 Job 记录（必填） |
| 预期输出 | 区块判定数组，固定顺序：条件信息区（key `condition`）、方向与职能标签区（key `tags`）、职责区（key `responsibilities`）、优先条件区（key `preferred`）、本站说明区（key `description`）、报名窗口区（key `application`）、来源核验区（key `evidence`）。条件信息区 title 按层级口径：逐字段核验=「原公告资格条件」，其余（含无层级）=「已核验条件信息」；tags 区含方向、职能、技能三组标签（标题「技能与方向标签」）；其余 title 仅作标识 |
| 边界检查 | 条件信息区 visible = hasConditionInfo(job)；tags 区 visible = platform_disciplines 或 job_functions 或 required_skills 非空；职责区 = responsibilities 非空；优先条件区 = preferred_skills 非空；本站说明区 = description 非空；报名窗口区 = applicationWindow(job, getListingKind(job.title)).visible；来源核验区 = source_evidence 非空 |
| 错误处理 | 纯函数无异常分支；可选字段（job_functions/source_evidence/verification_level）缺省按空值/无层级处理 |

# 3. 详情页断言

1. 来源核验/关键字段核验记录若拥有 education/original_major_requirements/salary 字段，主内容区条件信息区块展示对应行（不再被层级门槛隐藏）；区块标题按层级标注口径。
2. 逐字段核验记录展示不变（原公告资格条件口径）。
3. job_functions 非空的记录详情页出现职能标签；recruit_type 存在时标题旁出现校招/社招徽标（样式与列表卡一致）。
4. 无任何条件字段的记录不渲染条件信息区块（维持「条件信息请见来源公告」统一提示，若有）。
5. 长文本字段完整渲染（无截断省略）。

# 4. 补提取断言

1. 目标记录（9 条稀疏 + 可补关键字段）逐条执行 scan 并人工确认；确认写入后 `npm run audit:jobs`（在线）通过。
2. 新填字段全部带证据；核对不到的留空并在 docs/test.md 最近一轮结果如实报告不可提取原因。
3. 处置留痕：涉及批次文件头注释追加处置记录。
