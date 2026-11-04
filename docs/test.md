# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

（暂无条目：库级集成与端到端测试由 `::ci` 阶段依据各模块登记的模块测试与交互验收口径聚合执行。）

## 模块 data-foundation 测试

### jobsCatalog 完整性
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_design.md §2 批次聚合结构与 §4 迁移验收断言 1，验证 `src/data/jobs/index.ts` 聚合出的 jobsCatalog 共 200 条、id 全目录唯一，核验层级分布为逐字段核验 28 条、来源核验 76 条、关键字段核验 96 条（13 + 63 + 15 + 109 四批次齐全）。

### audit:jobs:offline 通过
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，内部以子进程运行 `npx tsx scripts/audit-verified-jobs.ts --offline`）
- 测试内容：依据 docs/interaction.md §11 `audit:jobs:offline` 行与 docs/modules/data-foundation_interaction.md §2 规则全集，验证离线审计不发网络请求、退出码为 0，并输出 `Audited 200 public jobs (28 field-level, 76 source-level, 96 key-field)` 计数行。

### add:jobs 校验矩阵（validateJobRecord）
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts）
- 测试内容：依据 docs/modules/data-foundation_interaction.md §3 validateJobRecord 规格，验证合法记录返回空错误列表；缺 source_title、缺 source_evidence、org_type/status 枚举外取值、published_at 非 YYYY-MM-DD、application_opens_at 晚于 deadline、job_functions 含枚举外取值、输入携带 id 字段七类非法输入各自被拒绝且错误信息含字段名；输入携带 Job 模式未知字段被拒绝。

### add:jobs 整批写入行为
- 如何运行：`npm run test`（scripts/tests/data-foundation.test.ts，通过 `--jobs-dir` 注入临时目录隔离写入）
- 测试内容：依据 docs/interaction.md §11 add:jobs 行与 docs/modules/data-foundation_interaction.md §3 错误处理与边界检查，验证批次内任一记录非法时整批拒绝、退出码 1、不产生任何文件写入；title+organization+source_url 与现有目录重复的记录被跳过并提示；合法批次自动分配 ID（现有 jobsCatalog 最大 id+1 起递增）、创建批次文件、更新 index.ts 的 import 与聚合行，并以退出码 0 结束；非 kebab-case 批次名（如 Bad_Batch）被拒绝且无文件写入。

## 最近一轮结果

- 2026-11-04 | 范围：模块 data-foundation | 通过 6/6（jobsCatalog 完整性 200 条、audit offline、add:jobs 校验矩阵、合法批次写入与 ID 自动分配、整批拒绝无写入、批次名校验）；类型检查 tsc --noEmit 无错误
- 2026-11-04 | 范围：模块 data-foundation（一次性迁移校验，仅本轮运行，不计入永久测试）| 通过：200/200 条按 id 逐字段等值（迁移脚本运行确认；脚本按其头部声明在提交前删除）
