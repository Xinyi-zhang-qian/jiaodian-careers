# System Status

## [Project Goal]
面向人文、社会科学与理工科交叉人才的招聘信息网站（jiaodian-careers）：聚合重点城市（北京、上海等）的科研机构、事业单位与企业岗位，区分核验层级并保留可机器复核的来源证据。当前一轮开发目标：强化数据来源与提取准确性，补充北京、上海近期事业单位与企业招聘信息并剔除虚假信息，重点关注事业单位招聘公告与报名截止时间，以及项目管理、产品经理、AI 伦理等跨学科岗位；同时优化页面设计、规范项目文档、规范化岗位数据管理，便于后续持续增补与更新岗位。

## [Repository State]
二次开发

> 由 `::init` 判别并写入，枚举：`从零开始` / `二次开发` / `继续开发` / `loop中断恢复`。

## [Current Phase]
开发计划

> 开发 loop 的当前阶段，枚举：`需求分析` / `开发计划` / `模块开发` / `分支合并` / `代码检查` / `库级测试` / `开发日志` / `文档追赶` / `已完成`。
> `分支合并` 为 `::dev` 完成之后、`::mergelocal` 执行期间的阶段（标准 loop 中位于 `代码检查` 之前，fast loop 中位于 `开发日志` 之前）；`开发日志` 为快速开发流（`::init -fast`）的收尾阶段（`::mergelocal` 之后、`::devlog` 期间）；`文档追赶` 为 `::doc` 执行期间。
> 各 loop 命令在进入与完成时更新本字段。

## [Phase History]
- 第 1 轮：需求分析（2026-11-04 17:25）

> 各轮 loop 已完成阶段的履历。每轮一行，格式：
> `- 第 N 轮：{阶段}（{YYYY-MM-DD HH:MM}）→ {阶段}（{YYYY-MM-DD HH:MM}）→ …`
> fast 轮次以 `- fast 轮：` 起头（不计入 `[Loop Cycle]` 轮次编号），逐阶段记录 `开发计划 → 模块开发 → 分支合并 → 开发日志`。
> 各 loop 命令在完成自身阶段时向对应轮次行追加；新一轮 loop 由 `::design` 在打断重设计时开新行。
> 手动调用 loop 命令（`::design` / `::devplan` / `::dev` / `::mergelocal` / `::devlog`）时以本字段与 `[Current Phase]` 共同判断上一阶段的完成情况。

## [Loop Cycle]
第 1 轮 / 共 1 轮

> 当前开发轮次，格式：`第 N 轮 / 共 M 轮`（M 取自最新设计文档「开发轮次规划」的总轮数，规划重排时同步更新）。
> 由 `::init` 初始化、`::design` 在规划确定与打断重设计时更新。被打断的旧轮次归档于 `docs/archive/`。

## [Fast Baseline]
（无）

> 快速开发流（`::init -fast`）启动时记录的 git 基线 commit hash（非 git 仓库记 `working-tree`）。
> 非空即表示当前处于 fast loop 中——`::devplan` / `::dev` 据此启用 fast 模式行为（全局文档只读、`::mergelocal` 后进入 `::devlog`）。
> 由 `::init -fast` 写入，`::devlog` 完成记录后清空为 `（无）`。

## [Devlog Backlog]
（无）

> 待追赶文档的 fast 开发记录清单，每条一行：
> `- system/devlog/{文件名}（{YYYY-MM-DD HH:MM}）— {本轮目的}`
> 由 `::devlog` 追加；`::doc` 每追赶完一条删除对应行并删除对应 devlog 文件。
> 非空即表示存在 fast 开发未更新全局文档的欠账，提示用户择时执行 `::doc`。
