# ::doc

> 命令索引见 `system/command_reference.md`。本文件为 `::doc` 的完整执行协议。

---

## `::doc` / `::doc -hard`

文档追赶命令。fast 开发流（`::init -fast`）跳过全局文档更新与 `::lint` / `::ci`，其修改由 `::devlog` 记录在 `system/devlog/`。本命令根据这些 devlog 记录**追赶补齐**欠下的文档与质量工序：需求文档（`::req` 语义）、双设计文档（`::design` 语义）更新，以及最终的 `::lint` 修正与 `::ci` 整合测试。由主 Agent 直接执行（最终 `::lint` 阶段按其自身协议派发子 Agent）。

**参数格式**（由主 Agent 使用 LLM 能力直接解析）：
- `::doc`：普通模式。逐条追赶全部待办 devlog 的文档，最后执行一次 `::lint`（普通模式）与一次 `::ci`。
- `::doc -hard`：最终 `::lint` 使用 `-hard` 文档深度专项（其余流程相同）。

**前置条件**：`status.md` 的 `[Devlog Backlog]` 非空且 `system/devlog/` 下存在对应记录文件；无待追赶记录时向用户报告「无待追赶的 fast 开发记录」并结束。

本命令是阶段门禁的**豁免命令**：可随时手动调用，不做「阶段门禁与手动调用提醒」。

**执行步骤（逐步执行，不得跳步）**

**步骤 1 — 建立追赶队列（主 Agent）**：
- 读取 `status.md` 的 `[Devlog Backlog]` 与 `system/devlog/` 实际文件清单，二者核对一致（status 有记录而文件缺失，或文件存在而 status 无记录时，向用户报告偏差并以实际文件为准重建队列，同步修正 status）；
- 队列按记录时间**升序**排列（最旧优先），向用户展示待追赶清单（每条：文件名、目的、时间）。

**步骤 2 — 状态进入**：`status.md` 的 `[Current Phase]` 置为 `文档追赶`。

**步骤 3 — 逐条追赶文档（循环，每次取队列最旧一条）**：
1. 读取该 devlog 文件全文（本轮目的、基线与范围、文件变更表、文档偏差备忘）；
2. **需求文档追赶**（`::req` 语义）：以 devlog 目的与代码现状为输入，**修改迭代** `docs/requirements.md`（保留仍有效内容，更新变化部分；不是整体覆盖重生成）；
3. **设计文档追赶**（`::design` 语义）：**修改迭代** `docs/design.md` 与 `docs/interaction.md`，以代码现状与 devlog 文件变更表、文档偏差备忘为准校准；改动后按 `system/commands/design.md` 的「设计文档一致性检查」逐项核对两份文档，不一致先修复；
4. **模块文档补齐**：`docs/modules/` 下设计/交互文档与 `docs/test.md` 与最终实现有缺漏或偏差时一并补齐；
5. 不一致修正按 `system/command_reference.md`「不一致采纳优先级」处理：devlog 记录的用户 prompt（本轮目的）为最高依据，其次需求文档，再次代码现状，最后其他文档；prompt/需求与代码冲突时文档以 prompt/需求为准更新，代码偏差列入追赶报告（不静默改代码行为）；
6. 追赶中**不触发打断归档**——fast 开发的代码已落盘，本步骤是让文档追上现实，不是重设计；
7. 该条追赶完成后：**删除对应 `system/devlog/` 记录文件**，并从 `[Devlog Backlog]` 删除对应行；
8. 队列非空 → 回到本步骤第 1 条处理下一条；队列清空 → 进入步骤 4。

**步骤 4 — 一次 `::lint`**：全部 devlog 文档追赶完成后，统一执行一次 `::lint`（`::doc -hard` 时执行 `::lint -hard`），协议见 `system/commands/lint.md`。fast 各轮叠加的代码与文档问题在此一次性清理。

**步骤 5 — 一次 `::ci`**：`::lint` 通过后统一执行一次 `::ci` 完整流程（库级测试编写/修改/执行 + 通过后更新所有文档），协议见 `system/commands/ci.md`。顺序保持先 lint 后 ci（先清理后库级测试）。

**步骤 6 — 收尾**：
- `status.md`：`[Current Phase]` 置为 `已完成`；向 `[Phase History]` 本轮行追加 `文档追赶（{YYYY-MM-DD HH:MM}）`（步骤 4/5 的 lint 与 ci 履历由各自命令按自身协议追加）；
- 向用户输出追赶报告：已追赶 devlog 条数与各自目的、文档更新清单、lint 修复统计、ci 测试结果。

**规则**：
- 每条 devlog 追赶完成后才删除其记录文件与 status 行；追赶中途失败时保留该条及后续记录，修复后重新执行 `::doc` 从未完成处继续。
- 无论启动时有多少条待追赶记录，`::lint` 与 `::ci` 只在最后各执行一次，禁止逐条追赶时穿插执行。
- 文档追赶依据按「不一致采纳优先级」（`system/command_reference.md`）：devlog 记录的用户 prompt（本轮目的）> 需求文档 > 代码现状 > 其他文档；与代码冲突且 prompt/需求未覆盖时以代码为准，并在追赶报告中注明。
- 写入范围：业务源码与测试（lint 修复）、`docs/`、`README.md`、`status.md`、`system_log.md`，以及 `system/devlog/` 中已追赶记录的删除（本命令特有权限）；不得修改 `system/` 下其他文件。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 追赶 devlog {N} 条: [{文件名列表}] | 文档更新: [{...}] | lint: {普通/-hard}（修复 {N} 项） | ci: {通过N/共M} | backlog 已清空
````

无待追赶记录而结束时摘要为 `- 无待追赶的 fast 开发记录`。
