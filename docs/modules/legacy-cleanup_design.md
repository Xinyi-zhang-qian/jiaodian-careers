# legacy-cleanup 模块设计文档

> 全局契约引用 docs/design.md §4（契约 4、15）、§5；本模块对应 design.md 的 legacy-cleanup。

# 1. 模块职责与边界

- 职责：对三块遗留数据逐条回源复核并产出分类报告；执行处置——可升级记录迁入规范数据源新批次文件、确认失效的遗留文件移除。
- 数据所有权：`scripts/recheck-legacy.ts`、`workspace/legacy-recheck/`（报告，本地产物）、处置动作产生的新批次文件 `src/data/jobs/legacy-recheck-{YYYY-MM-DD}.ts`、删除 `real-jobs.ts`、`platform-sources.ts` 快照段清理。
- 不负责：规范数据源结构（data-foundation）、实习/分析内容数据（本轮实习线索已核验，平台快照段清理仅限未核验部分）。

# 2. 内部结构

```text
scripts/recheck-legacy.ts    # npm run recheck:legacy
src/data/jobs/legacy-recheck-{日期}.ts  # 处置产出（仅可升级记录）
workspace/legacy-recheck/
├── report.md                # 分类摘要 + 处置记录（验收依据）
└── details.json             # 逐条明细（记录 id、来源、分类、证据命中情况）
```

复核对象清单（脚本内置，写明依据）：
1. `src/data/real-jobs.ts` 全量（约 3800 行、未发布候选）；
2. `src/data/platform-sources.ts` 中 QUARANTINED 平台快照段；
3. `src/data/expanded-source-leads.ts`（若 data-foundation 迁移后该文件仍在，则复核其 63 条并对照批次内记录）。

# 3. 内部数据流

recheck:legacy（在线模式）：遍历清单 → 逐条 GET source_url（带 UA、超时 15s）→ 规范化 HTML → 分类判定：来源可访问 且 source_title（或平台快照的 title+organization）命中 → 「可升级」；可访问但关键锚点不命中/页面疑似非招聘页 → 「需人工复核」；404/域名失效/反爬拦截 → 「建议下架」（拦截类标注原因）→ 写 details.json + report.md。支持 `--ids`、`--limit` 增量执行，报告按 id 增量更新（同 id 覆盖）。

处置执行（本模块内、报告生成后）：「可升级」记录按证据充分度定层级（默认「来源核验」，证据片段齐全可判「逐字段核验」的须在报告中标明依据）写入 `legacy-recheck-{日期}.ts`；「建议下架」确认后：删除 `real-jobs.ts`（其可升级部分已固化进批次）、移除 `platform-sources.ts` 快照段；`expanded-source-leads.ts` 若仍存在则删除（批次内对应记录按复核结果改层级或移除——若批次文件属 data-foundation 产出，移除动作改在本模块批次文件中做排除说明，不改他人文件，冲突在 ::mergelocal 裁决）。index.ts 增加新批次一行（合并时并集处理）。

# 4. 内部数据结构

- 复核明细条目：`{ origin: 'real-jobs'|'platform-sources'|'leads', id, title, organization, source_url, verdict: '可升级'|'需人工复核'|'建议下架', http_status: number|null, evidence_hits: string[], note: string }`。
- 分类口径写死在脚本内并在 report.md 头部声明（可复核）。

# 5. 内部状态机

不适用（批处理）。
