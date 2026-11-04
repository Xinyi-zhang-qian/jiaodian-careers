# ::devlog

> 命令索引见 `system/command_reference.md`。本文件为 `::devlog` 的完整执行协议。

---

## `::devlog`

快速开发流的收尾阶段命令。将本轮 fast 开发（`::init -fast` 启动）的**修改目的**与**全部文件 diff（记录行号）**按固定模板写入 `system/devlog/` 下的记录文件，并在 `status.md` 登记一条待追赶记录。由主 Agent 直接执行，不启动子 Agent。

fast 开发跳过全局文档更新与 `::lint` / `::ci`，本命令产出的 devlog 是后续 `::doc` 追赶文档与整合测试的**唯一依据**，必须完整、如实记录。

**参数格式**：无参数。

**前置条件**：`status.md` 的 `[Fast Baseline]` 非空（处于 fast loop 中，由 `::init -fast` 设置），fast 轮次的 `::dev` 已全部模块完成（模块级测试全部通过），且 `::mergelocal` 已完成（全部分支合并、worktree 已清理——diff 基线以合并后的主工作区为准）。

**手动调用检查（门禁）**：本命令由用户手动调用时，先执行 `system/command_reference.md` 的「阶段门禁与手动调用提醒」：读 `status.md` 的 `[Current Phase]`、`[Phase History]` 与 `[Fast Baseline]`，向用户报告 fast loop 各阶段完成情况与本次调用的性质；`[Fast Baseline]` 为空或模块开发/分支合并未完成时，提醒用户缺失的前置阶段（全自动情景除外）。

**执行步骤**

**步骤 1 — 汇集 diff 数据**：
- 以 `[Fast Baseline]` 记录的 git commit 为基线，执行 `git diff <baseline> --unified=0` 获取全部修改文件的 hunk 头（`@@ -a,b +c,d @@`），逐文件提取变更行号范围；
- `git status --porcelain` 补充基线之后的**新增文件**（未跟踪文件整文件计为新增，行号 `1-{总行数}`）与**删除文件**（记基线侧行范围）；
- 非 git 仓库的兜底：以 `plans/current.md` 的修改清单与实际文件枚举代替 git diff，逐文件记录新增/修改/删除与行号范围，并在 devlog「基线与范围」节注明 `基线: working-tree（非 git 仓库）`；
- diff 范围排除：`system/devlog/` 自身、`status.md`、`system_log.md`（这三者为命令系统记录，不属于业务变更）。

**步骤 2 — 撰写 devlog**：按下文「输出文档模板」写入 `system/devlog/{YYYY-MM-DD-HHMMSS}.md`（秒级时间戳保证唯一）。「文档偏差备忘」由主 Agent 对照 diff 与现行全局文档撰写：本轮实现与 `docs/requirements.md`、`docs/design.md`、`docs/interaction.md` 不一致或未覆盖的点逐条列出，供 `::doc` 追赶时核对。

**步骤 3 — 登记状态**：
- `status.md` 的 `[Devlog Backlog]` 追加一行：`- system/devlog/{文件名}（{YYYY-MM-DD HH:MM}）— {本轮目的}`；
- `[Fast Baseline]` 清空为 `（无）`（fast loop 结束）；
- `[Current Phase]` 置为 `已完成`，并向 `[Phase History]` 本轮行追加 `开发日志（{YYYY-MM-DD HH:MM}）`；
- 向用户输出摘要：变更文件数、目的、待追赶条数，并提示存在 fast 开发未更新全局文档，可择时执行 `::doc` 追赶。

**规则**：
- 只记录、不修改任何业务文件与文档（本命令是纯记录动作）。
- 行号必须来自真实 diff 数据（或兜底枚举），禁止凭印象编造。
- 一条 devlog 对应一次 `::init -fast` 启动的完整 fast loop；不允许把多轮 fast 开发合并进一条记录。

---

## 输出文档模板（`system/devlog/{YYYY-MM-DD-HHMMSS}.md`，固定模板，章节不可增删）

```markdown
# Devlog — {YYYY-MM-DD HH:MM}

## 本轮目的
{::init -fast 的 prompt 提炼：本轮快速开发要达成什么，一两句话}

## 基线与范围
- git 基线: {commit hash 前 12 位 或 working-tree（非 git 仓库）}
- 涉及模块: [{模块清单}]
- 模块测试: {通过N/共M（逐模块一行：{模块} {通过/共}）}

## 文件变更
| 文件 | 变更类型 | 变更行号 |
| --- | --- | --- |
| {路径} | 新增/修改/删除/重命名 | {行号范围} |

## 文档偏差备忘
{实现与现行全局文档（requirements/design/interaction）的偏差点，逐条列出；无偏差写「无」}

## 状态
待文档追赶（::doc）
```

「变更行号」列格式：
- 修改：`+{新起始}-{新结束} / -{基线起始}-{基线结束}`，多个 hunk 以逗号分隔（hunk 长度为 1 时只写单个行号）；
- 新增：`1-{总行数}`；
- 删除：`-{基线起始}-{基线结束}`；
- 重命名：注明 `由 {旧路径} 重命名`，行号按修改规则记录。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- devlog 写入 system/devlog/{文件名} | 目的: {一句话} | 变更文件 {N} 个 | 模块测试 {通过N/共M} | 待追赶: {M} 条
````
