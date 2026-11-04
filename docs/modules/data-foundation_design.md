# data-foundation 模块设计文档

> 全局契约、模块职责边界引用 docs/design.md §4、§5，此处不重复。本模块对应 design.md 的 jobs-dataset 与 verification-pipeline 两个逻辑模块的开发执行单元（两者文件级强耦合，合并为一个开发模块）。

# 1. 模块职责与边界

- 职责：建立规范化岗位数据源 `src/data/jobs/`（index 聚合 + 批次文件），把现存前台 200 条记录迁移入批次文件；扩展 `Job` 类型（`application_opens_at`、`job_functions`）与职能枚举；提供增补录入命令 `add:jobs`；把核验脚本 `audit-verified-jobs.ts` 切换到同源数据并扩展新字段校验。
- 数据所有权：`src/data/jobs/` 全部文件、`scripts/add-jobs.ts`、`scripts/audit-verified-jobs.ts`、`src/lib/types.ts`、`src/lib/utils.ts`（职能枚举部分）。
- 不负责：查询/筛选逻辑（`src/lib/data.ts` 归 jobs-ui）、页面、遗留数据处置（legacy-cleanup）、新岗位内容采集（data-acquisition）。

# 2. 内部结构

```text
src/data/jobs/
├── index.ts                 # 显式 import 全部批次并聚合导出 jobsCatalog: Job[]
├── core-verified.ts         # 迁移自 verified-jobs.ts 的 13 条逐字段核验记录
├── shlab-2026.ts            # 迁移自 additional-verified-jobs.ts 的 15 条
├── restored-2026-10.ts      # 迁移自 restored-jobs.ts 的 109 条（层级原样）
└── leads-2026-09.ts         # 迁移自 expanded-source-leads.ts 的 63 条（层级原样）
scripts/add-jobs.ts          # npm run add:jobs -- <json> --batch <名称>
scripts/audit-verified-jobs.ts  # 同源化 + 新字段校验
src/lib/types.ts             # Job 扩展 2 个可选字段
src/lib/utils.ts             # 新增 JOB_FUNCTIONS 枚举
```

迁移原则：记录字段与核验层级原样保留，不做内容改写；每个批次文件头注释注明来源与迁移日期；`restored-2026-10.ts` 的记录仍来自 `real-jobs.ts` 派生（迁移时固化字段值，之后 real-jobs.ts 的处置归 legacy-cleanup）。

# 3. 内部数据流

add:jobs：读 JSON 文件 → 逐条按「模块交互文档 §3」校验 → 任一失败则整批拒绝（无半写入）→ 全部通过：ID 自动分配（现有 jobsCatalog 最大 id + 1 顺序递增）→ 生成批次 TS 文件（若已存在则追加）→ 更新 index.ts 追加 import/export 行 → 自动执行 `audit:jobs:offline` 并回显结果。

迁移（一次性，本模块内执行）：旧数据文件 → 批次文件 + index.ts → 切换 data.ts 前置校验（由 jobs-ui 同步改造，本模块只保证 index 正确）→ 删除 `verified-jobs.ts`、`additional-verified-jobs.ts`、`restored-jobs.ts`、`expanded-source-leads.ts`（`real-jobs.ts` 保留，归 legacy-cleanup 处置）。

audit 同源化：import 从三个旧文件改为 `src/data/jobs/index`；新增校验规则（见模块交互文档 §2）。

# 4. 内部数据结构

- `Job` 扩展（types.ts）：
  - `application_opens_at?: string`——报名开始日期，`YYYY-MM-DD`，可空；空值语义：公告未提供报名开始时间。
  - `job_functions?: string[]`——平台职能标签，枚举见 utils.ts `JOB_FUNCTIONS`；可空（历史记录允许无该字段，读取侧按空数组处理）。
- `JOB_FUNCTIONS = ['项目管理','产品经理','AI伦理','算法','工程','数据','科研','编辑出版','综合管理','其他']`（utils.ts，扩充须走 ::design）。
- 批次文件模式：`const records: Job[] = [...]; export default records;`（新增字段经由本模块扩展后的 Job 类型直接合法）。

# 5. 内部状态机

不适用（无内部状态；脚本为无状态批处理）。
