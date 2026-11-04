# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试

（本节登记库级测试：模块间集成、端到端、契约、视觉验收等。本轮各模块测试仍在登记中，全局条目由 `::ci` 按 `::devlog` 后的清单执行。）

## 模块 site-design 测试

### 职能入口计数逻辑（getJobFunctionEntries）
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/modules/site-design_interaction.md §2 首页职能入口规格，对夹具记录集（部分记录含 job_functions 字段）验证：计数大于 0 的职能按计数降序出现在返回清单（同数按枚举声明顺序）、计数为 0 的职能不出现、无 job_functions 字段的记录不计入任何职能、一条记录携带多个职能时在每个职能下各计一次、枚举外职能名不计入、全部职能计数为 0 时返回空数组（首页据此整块不渲染）且输入数组不被修改。

### 首页职能入口渲染接线
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/interaction.md §5「职能快捷入口」控件规格，对 src/app/page.tsx 源码做结构断言：页面从 src/lib/job-function-stats 导入计数结果渲染职能卡、职能卡以 `/jobs?function=` 链接跳转、经 `getJobs({ limit: 1000 }).jobs` 取全量后本地统计而不调用 getJobs 的 job_function 过滤参数（该参数由 jobs-ui 分支交付，合并前不存在）。

### README 数据增补指引与命令一致性
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/modules/site-design_interaction.md §3 README 断言：README 含「数据增补指引」节，节内写明 add:jobs 用法（`npm run add:jobs -- <json路径> --batch <批次名>`）、全部 14 个必填字段名、核验层级与证据要求及 audit:jobs 门禁；README 全文不再出现 update.sh 与 Vercel 表述；README 中出现的每个 `npm run X` 均登记于 package.json scripts（并行开发期内 add:jobs、recheck:legacy、test 为跨模块桩例外集合，其 scripts 登记由 data-foundation 与 legacy-cleanup 分支交付、合并后一致），且 README 写明 npm ci、npm run dev、npm run build、npm run test 四个基础命令。

### 徽标语义色变量登记
- 如何运行：`npx tsx scripts/tests/site-design.test.ts`
- 测试内容：依据 docs/interaction.md §3 核验徽标色彩协议，src/app/globals.css 的 @theme 中登记逐字段核验（绿）、来源核验（蓝）、关键字段核验（琥珀）、待核实（黄）、即将截止（红）五组语义色变量及其浅底色变量，且既有主题变量的取值保持不变。

## 最近一轮结果

- 2026-11-04 | 范围：模块 site-design（分支 dev/site-design，worktree .worktrees/site-design）| 通过 4/4，失败 0 | 无失败明细。运行命令：`npx tsx scripts/tests/site-design.test.ts`（职能入口计数逻辑、首页职能入口渲染接线、README 数据增补指引与命令一致性、徽标语义色变量登记四套件全通过）与 `npx tsc --noEmit`（通过）。说明：README 命令一致性断言对 add:jobs、recheck:legacy、test 三个命令按模块交互文档 §3.3 采用跨模块桩例外集合（其 package.json 登记由 data-foundation 与 legacy-cleanup 分支交付，合并后一致）。
