# 当前计划 — 数据规范化、信息清理与体验升级（第 1 轮）

创建日期：2026-11-04
状态：待用户批准

## 1. 核心功能

（继承自需求 V2.0）把岗位数据收敛为规范化数据源并建立增补/复核两条流水线；清理三块遗留数据中的虚假与失效信息；补充北京、上海近期岗位（重点事业单位公告与报名截止时间）与企业跨学科岗位（项目管理、产品经理、AI 伦理）；新增岗位职能筛选与「即将截止」标识；优化首页/列表/详情视觉；README 与文档规范化。

## 2. 接口与测试

- 用户接口（求职者，Web）：/jobs 新增「岗位职能」筛选（URL 参数 `function`）与「即将截止」徽标；/jobs/[id] 新增「报名窗口」区块；首页新增职能快捷入口；其余交互保持（见 docs/interaction.md）。
- 维护者接口（CLI）：新增 `npm run add:jobs`（增补录入：校验→自动 ID→写入批次→自动离线审计）、`npm run recheck:legacy`（遗留复核分类报告）、`npm run test`（聚合测试入口）；`audit:jobs` 扩展报名窗口与职能枚举校验并同源读取 `jobsCatalog`。
- 已有测试：`audit:jobs:offline`（结构门禁，已存在）。
- 拟新增测试（登记 docs/test.md，由 ::dev 编写）：data-foundation（迁移等值、add:jobs 校验矩阵、audit 新规则）、jobs-ui（职能筛选、即将截止、报名窗口渲染）、legacy-cleanup（分类判定、报告完整性）、data-acquisition（批次 schema 自查、数量与证据要求）、site-design（职能入口计数、README 一致性）、整库回归（::ci）。

## 3. 模块划分

本轮涉及 5 个模块（模块正式定义见 docs/design.md §5，模块文档见 docs/modules/）：

| 模块 | 性质 | 模块文档 |
| --- | --- | --- |
| data-foundation | 新增（jobs-dataset + verification-pipeline 开发单元） | docs/modules/data-foundation_{design,interaction}.md |
| jobs-ui | 修改（jobs-catalog 开发单元） | docs/modules/jobs-ui_{design,interaction}.md |
| legacy-cleanup | 新增 | docs/modules/legacy-cleanup_{design,interaction}.md |
| data-acquisition | 新增（内容工作） | docs/modules/data-acquisition_{design,interaction}.md |
| site-design | 修改（site-shell 视觉 + 治理） | docs/modules/site-design_{design,interaction}.md |

不动的模块：robotics-market、content-datasets（实习/分析页面本轮不改代码）。

耦合关系：data-foundation 为地基（types 扩展、枚举、jobsCatalog）；jobs-ui / site-design 读取其产物（worktree 内以最小桩编译，合并时以 data-foundation 版本为准——types.ts、utils.ts 冲突裁决归 data-foundation）；data-acquisition 产出新批次文件（index.ts 的 import 行在合并时并集并入）；legacy-cleanup 处置遗留文件（real-jobs.ts 删除、platform-sources 快照段移除），其新批次同样并集并入 index。

## 4. 模块间接口与数据流（diff）

- `src/data/jobs/index.ts` 新增导出 `jobsCatalog: Job[]`：data.ts 与 audit 脚本改为唯一从该入口取数（jobs-ui 改 data.ts、data-foundation 改 audit）。
- `Job` 类型新增可选字段 `application_opens_at`、`job_functions`（data-foundation 定义，jobs-ui / site-design / data-acquisition 读取）。
- `JOB_FUNCTIONS` 枚举新增于 utils.ts（data-foundation 定义，jobs-ui 筛选与 site-design 首页入口读取）。
- `getJobs` 新增 `job_function` 过滤参数（jobs-ui 实现，site-design 首页计数只读调用）。
- 新批次文件流：data-acquisition 与 legacy-cleanup 各自产出批次文件 → index.ts 并集并入（::mergelocal 裁决项）。

## 5. 模块内数据流

见各模块设计文档 §3（data-foundation：add:jobs 校验→ID 分配→写入→自动审计；jobs-ui：URL 参数→过滤链→徽标计算；legacy-cleanup：遍历→分类→报告→处置；data-acquisition：采集→核对→录入三步固定顺序；site-design：枚举→计数→入口卡渲染）。

## 修改清单

### 代码
- `src/data/jobs/`（新建 index.ts 与 4 个迁移批次文件）
- `src/data/verified-jobs.ts`、`src/data/additional-verified-jobs.ts`、`src/data/restored-jobs.ts`、`src/data/expanded-source-leads.ts`：迁移后删除
- `src/data/real-jobs.ts`：legacy-cleanup 处置后删除
- `src/data/platform-sources.ts`：移除 QUARANTINED 快照段（legacy-cleanup）
- `src/lib/types.ts`：Job 扩展 2 可选字段（data-foundation）
- `src/lib/utils.ts`：新增 JOB_FUNCTIONS（data-foundation）
- `src/lib/data.ts`：同源化 + job_function 过滤 + deadlineDaysLeft（jobs-ui）
- `src/app/jobs/page.tsx`：职能筛选下拉、URL 同步、即将截止（jobs-ui）
- `src/app/jobs/[id]/page.tsx`：报名窗口区块、即将截止徽标（jobs-ui）
- `src/components/jobs/job-card.tsx`：即将截止徽标、视觉层级（jobs-ui）
- `src/app/page.tsx`：职能快捷入口、视觉优化（site-design）
- `src/app/globals.css`、`src/components/layout/*`：语义色与框架微调（site-design）
- `scripts/audit-verified-jobs.ts`：同源化 + 报名窗口/职能校验（data-foundation）
- `scripts/add-jobs.ts`（新建，data-foundation）
- `scripts/recheck-legacy.ts`（新建，legacy-cleanup）
- `scripts/tests/`（新建，各模块断言脚本）+ `package.json` 增 `test`、`add:jobs`、`recheck:legacy` scripts
- `update.sh`：删除（site-design）

### 文档
- `docs/requirements.md`、`docs/design.md`、`docs/interaction.md`：本轮已更新（批准版）
- `docs/modules/*`：本轮已建立，::dev 按实现更新
- `docs/test.md`：新建测试注册表
- `README.md`：规范化重写含数据增补指引（site-design）

## Checklist

- [ ] data-foundation：jobs/ 规范数据源 + 迁移 200 条 + types/utils 扩展 + audit 同源化与新规则 + add:jobs + 模块测试
- [ ] jobs-ui：data.ts 同源化与职能筛选 + 即将截止 + 报名窗口区块 + 列表/详情视觉优化 + 模块测试
- [ ] legacy-cleanup：recheck:legacy 脚本 + 遗留数据复核报告 + 处置（迁入/删除）+ 模块测试
- [ ] data-acquisition：北京 ≥10、上海 ≥10、跨学科 ≥10 条采集录入（事业单位含报名窗口）+ schema 自查测试
- [ ] site-design：首页职能入口与视觉优化 + 徽标色彩统一 + README 重写 + 删除 update.sh + 模块测试
- [ ] 模块间级和整库级的整合测试
