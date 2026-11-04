# legacy-cleanup 模块设计文档

> 全局契约引用 docs/design.md §4（契约 4、15）、§5；本模块对应 design.md 的 legacy-cleanup。

# 1. 模块职责与边界

- 职责：对三块遗留数据逐条回源复核并产出分类报告；执行处置——可升级记录迁入规范数据源新批次文件、确认失效的遗留文件移除。
- 数据所有权：`scripts/recheck-legacy.ts`、`workspace/legacy-recheck/`（报告，本地产物）、处置动作产生的新批次文件 `src/data/jobs/legacy-recheck-{YYYY-MM-DD}.ts`、删除 `real-jobs.ts`、`platform-sources.ts` 快照段清理。
- 不负责：规范数据源结构（data-foundation）、实习/分析内容数据（本轮实习线索已核验，平台快照段清理仅限未核验部分）。

# 2. 内部结构

```text
scripts/recheck-legacy.ts    # npm run recheck:legacy（命令行入口：加载清单、调度复核、写产物）
scripts/lib/recheck-core.ts  # 纯函数：normalizeHtml、classifySource（fetch 可注入）、markUnverified、mergeDetails、buildReport
src/data/jobs/legacy-recheck-{日期}.ts  # 处置产出（仅可升级记录，本轮不生成）
workspace/legacy-recheck/
├── report.md                # 分类摘要 + 处置建议（验收依据）
└── details.json             # 逐条明细（记录 id、来源、分类、证据命中情况）
```

复核对象清单（脚本内置，写明依据；三份文件一律动态 import + try/catch 读取，任一文件在合并阶段被删除时对应清单记 0 条并在控制台提示，脚本不崩溃）：
1. `src/data/real-jobs.ts` 全量（228 条未发布候选，id 401–604，default 导出）；
2. `src/data/platform-sources.ts` 中 QUARANTINED 平台快照段 `unverifiedPlatformListings`（4 条；该 const 原未导出，本模块为其补加 export 关键字，platform-sources.ts 的快照段归本模块管辖）；
3. `src/data/expanded-source-leads.ts`（63 条已发布线索，id 1001–1063，default 导出；data-foundation 迁移后该文件若仍在则照常复核）。

# 3. 内部数据流

recheck:legacy（在线模式）：加载清单（leads → real-jobs → platform-sources 顺序入队）→ 按参数筛出本次待复核条目（`--ids` 命中的条目无论状态一律重跑；未带 `--ids` 时跳过 details.json 中已有非「未核验」结论的条目，`--limit` 取剩余队列前 N 条）→ 逐条 GET source_url（带 UA `JiaodianCareersSourceAudit/1.0`、超时 15s；同一 URL 单次运行内共享一次抓取结果）→ 规范化 HTML → 分类判定：可访问 且 source_title（无 source_title 时标题，平台快照为 title+organization）命中 → 「可升级」；可访问但锚点不命中/页面疑似非招聘页 → 「需人工复核」；404/域名失效/反爬拦截 → 「建议下架」（注明原因）；网络异常/超时 → 「需人工复核」（note 含原因）→ 合并写 details.json（同 id 覆盖）+ 重建 report.md。离线模式不发网络请求，全量标「未核验」。单条失败不中断整批。

处置执行（本模块内、报告生成后）：「可升级」记录按证据充分度定层级（默认「来源核验」，证据片段齐全可判「逐字段核验」的须在报告中标明依据）写入 `legacy-recheck-{日期}.ts`；「建议下架」确认后：删除 `real-jobs.ts`（其可升级部分已固化进批次）、移除 `platform-sources.ts` 快照段；`expanded-source-leads.ts` 若仍存在则删除（批次内对应记录按复核结果改层级或移除——若批次文件属 data-foundation 产出，移除动作改在本模块批次文件中做排除说明，不改他人文件，冲突在 ::mergelocal 裁决）。index.ts 增加新批次一行（合并时并集处理）。

# 4. 内部数据结构

- 复核明细条目 RecheckItem：`{ origin: 'real-jobs'|'platform-sources'|'leads', id: string, title: string, organization: string, source_url: string, verdict: '可升级'|'需人工复核'|'建议下架'|'未核验', http_status: number|null, evidence_hits: string[], note: string }`。
  - id 取原记录 id 的十进制字符串（real-jobs、leads）；platform-sources 快照无原生 id，按数组下标编 `ps-1` 起。
  - `未核验` 仅为离线模式或尚未在线复核的状态，不进入报告三个清单。
  - evidence_hits 记录命中的锚点（格式 `锚点类型:原文`）；分类口径（锚点集合、关键词、HTTP 状态归类的判定阈值）写死在 recheck-core.ts 并在 report.md 头部声明（可复核）。
- details.json 为 RecheckItem 数组，mergeDetails 按 `origin + id` 去重合并，新条目覆盖旧条目。

# 5. 内部状态机

不适用（批处理）。
