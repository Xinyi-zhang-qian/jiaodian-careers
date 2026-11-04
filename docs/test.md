# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

（占位说明：本节用于登记库级测试——模块间集成、端到端、契约、视觉验收等，由主 Agent 在分支合并阶段统一登记；并行开发期间各模块只在下方各自模块小节登记模块内测试，聚合运行入口 `npm run test` 由主 Agent 合并时建立。）

## 模块 jobs-ui 测试

### 职能筛选只命中标注记录
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2（docs/interaction.md §6 岗位职能下拉），对含 `job_functions` 字段与无该字段的记录混合目录断言：传入枚举值「算法」时只返回标注该职能的记录，传入「数据」时不命中无 `job_functions` 字段的记录。

### 非枚举与空职能值视为不过滤
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2 边界检查，断言 `job_function` 传非枚举值、空串或缺省时混合目录全量返回；并依据 docs/interaction.md §13 断言 1 断言 `getJobs` 对全量目录在非枚举值下同样不过滤。

### 职能筛选与其他过滤器 AND 组合
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §2 预期输出，断言 `job_function` 与 `org_type` 同时传入时返回两者交集，组合无效时返回空集。

### deadlineDaysLeft 剩余天数计算
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/modules/jobs-ui_interaction.md §3，注入固定当前日期，断言：无 deadline 返回 null；status「已截止」返回 null；deadline 当天返回 0；未来 3 天返回 3；过去日期返回负数；非法日期（02-30、非 YYYY-MM-DD 格式）返回 null；「状态待核实」仍按 deadline 计算。

### 即将截止徽标判定
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/interaction.md §6「JobCard 即将截止徽标」、§7「即将截止标识」与 §13 断言 4、docs/modules/jobs-ui_interaction.md §4，断言：剩余 3 天且「招聘中」返回「3 天后截止」；当天返回「今天截止」；剩余 7 天仍在边界内；剩余 8 天、已过期、「已截止」「状态待核实」、无 deadline 均返回 null。

### 报名窗口渲染判定
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/interaction.md §7「报名窗口区块」与 §13 断言 5、docs/modules/jobs-ui_interaction.md §5，断言：有 `application_opens_at`、`deadline`、`application_info` 之一或公告级条目时 visible 为 true；事业单位公告级 publicRecruitNotice 为 true；企业公告级为 false；具体岗位三字段全空 visible 为 false。

### 职能枚举与契约一致
- 如何运行：`npx tsx scripts/tests/jobs-ui.test.ts`
- 测试内容：依据 docs/design.md §4 契约 12，断言 `JOB_FUNCTIONS` 恰为契约规定的 10 个枚举值（项目管理、产品经理、AI伦理、算法、工程、数据、科研、编辑出版、综合管理、其他）。

## 最近一轮结果

- 2026-11-04 | 模块 jobs-ui | 通过 27/共 27 | 无失败（`npx tsx scripts/tests/jobs-ui.test.ts` 全部通过；`npx tsc --noEmit` 无类型错误）。
