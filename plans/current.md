# 当前计划 — 信息充实、来源刷新与三类单位岗位补充（第 2 轮）

创建日期：2026-11-05
状态：待用户批准

## 1. 核心功能

（继承自需求 V3.0）从来源网页提取字段充实岗位展示（≥60 条空白记录升级或补齐，现状 136 条全空）；失效来源重新检索刷新或删除（前台无僵尸记录）；建立「采集 → 提取 → 确认 → 入库 → 审计」可重复流程；优化详情与列表展示；新增事业单位、科研院所、新型研究机构岗位 ≥20 条（事业单位 ≥8 条含报名安排），北京上海重点兼顾全国。

## 2. 接口与测试

- 维护者接口（CLI，新增 2 个）：`npm run extract:fields -- --scan|--apply`（提取辅助两阶段）、`npm run refresh:sources`（来源分类）；既有命令保持（见 docs/interaction.md §11）。
- 求职者接口：详情页与列表卡展示强化（「报名已截止」灰色标识、「条件信息请见来源公告」统一提示、详情分区）。
- 拟新增测试（登记 docs/test.md）：source-tools（scan 候选抽取、apply 校验与整条拒绝、refresh 分类三态）、data-refresh（处置留痕与审计通过断言，随执行登记结果）、data-acquisition（schema 自查、数量/事业单位/地域断言、在线回源）、jobs-catalog（过期标识互斥、空提示收敛）、integration 扩展（详情页含已提取字段抽查）。

## 3. 模块划分

| 模块 | 性质 | 模块文档 |
| --- | --- | --- |
| source-tools | 新增（extract:fields + refresh:sources） | docs/modules/source-tools_{design,interaction}.md |
| data-refresh | 执行（充实 + 刷新 + 清理） | docs/modules/data-refresh_{design,interaction}.md |
| data-acquisition | 执行（三类单位岗位） | docs/modules/data-acquisition_{design,interaction}.md |
| jobs-catalog | 修改（展示强化） | docs/modules/jobs-ui_{design,interaction}.md |

不动的模块：site-shell、content-datasets、robotics-market、legacy-cleanup。

耦合关系：source-tools 为工具层（脚本先行）；data-refresh 与 data-acquisition 是其使用方（执行模块，无新源码）；jobs-catalog 展示强化与数据模块无关（按字段存在性渲染），可并行。data-refresh 修改既有批次文件，data-acquisition 新建批次文件（index.ts 的 import 行合并时并集并入）——两者文件不相交，可并行。

## 4. 模块间接口与数据流（diff）

- `refresh:sources` 分类清单 → data-refresh 处置队列（A 充实 / B 刷新或删除 / C 状态修正）。
- `extract:fields --scan` 候选 JSON → 人工确认 → `--apply` 写批次（层级只升不降、证据在线复核）。
- 新批次文件 → index.ts 并集并入（::mergelocal 裁决项）。
- 展示层按字段存在性渲染，无新接口。

## 5. 模块内数据流

见各模块设计文档 §3。

## 修改清单

### 代码
- `scripts/extract-fields.ts`（新建）、`scripts/refresh-sources.ts`（新建）、`scripts/lib/extract-core.ts`（新建，抽取规则）
- `package.json`：增 `extract:fields`、`refresh:sources` 两条 scripts
- `src/data/jobs/public-sector-2026-11.ts`、`src/data/jobs/research-institutes-2026-11.ts`（新建批次）
- 既有批次文件：充实字段、刷新来源、删除失效、状态修正（data-refresh）
- `src/lib/data.ts`：过期判定辅助；`src/components/jobs/job-card.tsx`、`src/app/jobs/[id]/page.tsx`：展示强化
- `scripts/tests/`：各模块测试与 integration 扩展

### 文档
- `docs/modules/` 四模块文档（本轮已更新）
- `docs/test.md`：新增测试登记与结果
- `README.md`：extract:fields / refresh:sources 用法补入数据增补指引
- `docs/requirements.md`、`docs/design.md`、`docs/interaction.md`：本轮已更新（批准版）

## Checklist

- [ ] source-tools：extract:fields（scan/apply）+ refresh:sources + 抽取规则库 + 模块测试
- [ ] data-refresh：全量分类 → 充实 ≥60 条 → 失效刷新或删除 → 状态修正 → 处置留痕 → 在线审计通过
- [ ] data-acquisition：三类单位 ≥20 条（事业单位 ≥8 条含报名安排）+ schema 自查与在线回源
- [ ] jobs-catalog：报名已截止标识 + 条件见来源收敛 + 详情分区优化 + 模块测试
- [ ] 模块间级和整库级的整合测试
