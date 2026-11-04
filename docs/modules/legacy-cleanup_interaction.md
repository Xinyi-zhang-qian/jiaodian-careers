# legacy-cleanup 模块交互文档

> 用户交互规格见 docs/interaction.md §11（recheck:legacy 命令行），此处只定义模块内部接口。

# 1. 交互面总览

- 命令行入口：`npm run recheck:legacy -- [--offline] [--ids id1,id2] [--limit N]`（交互规格归 docs/interaction.md §11）。
- 内部关键接口：`classifySource(record) -> verdict`（分类判定）、`writeReport(details)`（报告产出）。

# 2. classifySource 规格

- 签名：`async classifySource(record: {title, organization, source_url, source_title?}): Promise<RecheckItem>`。
- 预期输入：一条遗留记录（字段缺失时按空串处理）。
- 预期输出：RecheckItem（见设计文档 §4），verdict 三值之一。
- 边界检查：URL 非法 → verdict「建议下架」note「URL 非法」；响应超时/网络异常 → 「需人工复核」note 含原因；HTTP 200 但规范化文本为空 → 「需人工复核」。
- 错误处理：单条失败不中断整批（逐条捕获并记入明细）。

# 3. 报告规格

- report.md 结构：头部（生成时间、参数、分类口径）→ 分类统计表 → 「可升级」清单（id、单位、岗位、来源、定层级依据）→ 「需人工复核」清单（含原因）→ 「建议下架」清单（含 http 状态/原因）→ 处置记录（本次实际执行的迁入/删除动作清单）。
- 验收断言：三个清单的并集等于本次复核的全量 id 集，无遗漏无重复。

# 4. 处置验收断言

1. 处置完成后仓库内不存在 `src/data/real-jobs.ts`；`platform-sources.ts` 不含 QUARANTINED 快照段。
2. `legacy-recheck-{日期}.ts` 中每条记录 verification_level 与报告「可升级」清单一致，且全部带 source_evidence。
3. `npm run audit:jobs:offline` 通过（新批次纳入 jobsCatalog 后）。
4. 前台不展示任何「建议下架」清单中的记录。
