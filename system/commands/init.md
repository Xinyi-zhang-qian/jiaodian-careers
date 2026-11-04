# ::init

> 命令索引见 `system/command_reference.md`。本文件为 `::init` 的完整执行协议。

---

## `::init [-fast] <custom prompt>`

开发 loop 的入口命令。判别当前仓库状态（四态），初始化 loop 状态文件，并按状态进入对应流程分支。由主 Agent 直接执行，不启动子 Agent。

**两种模式**：
- **标准模式**（`::init <custom prompt>`）：强制完整循环，见下文。
- **快速开发流**（`::init -fast <custom prompt>`）：适用于**已有全局文档**（`docs/requirements.md`、`docs/design.md`、`docs/interaction.md` 均存在）的情景。按 custom prompt **按需读取**全局设计与交互文档（只读、不修改），随后直接进入原工作流的 `::devplan` 与 `::dev` 阶段；开发完成后**只进行模块级测试**，不进入 `::lint` 与 `::ci`，而是经 `::mergelocal`（合并 dev 分支、清理 worktree）进入 `::devlog` 阶段（协议见 `system/commands/devlog.md`）记录本轮目的与全部文件 diff。fast 轮次欠下的全局文档更新与 lint/ci 由 `::doc` 命令事后追赶。
  - **前置校验**：三份全局文档任一缺失时不得进入 fast 模式——告知用户原因并改走标准模式（无文档时按四态判别走 `::req` / `::work -explore`）。
  - fast 模式可用 `/goal ::init -fast <设想>` 全自动触发，批准门槛不阻塞。
  - fast 轮次不影响 `[Loop Cycle]`（不递增轮次）；`[Phase History]` 本轮行以 `- fast 轮：` 起头，逐阶段记录 `开发计划 → 模块开发 → 分支合并 → 开发日志`。

**强制完整循环**（标准模式）：`::init` 启动的每轮 loop 必须走完整条链——`::req → ::design →（::devplan → ::dev 多轮往返）→ ::mergelocal → ::lint → ::ci`，禁止中途跳过阶段。loop 的代码检查阶段固定使用 `::lint` 普通模式；`::lint -hard`（文档深度专项）仅用户显式手动调用，loop 与各起始态流程均不使用。三种起始态的区别仅在文档工作方式：

| 起始态 | 文档工作方式 |
| --- | --- |
| 从零开始 | 各文档（requirements / design / interaction / plans / modules）全部**从零撰写** |
| 继续开发 | 在既有文档基础上**修改迭代**（保留仍有效内容，更新变化部分） |
| 二次开发 | 比继续开发多一步：先 `::work -explore` 基于代码生成初版文档，再在初版上修改迭代 |

**默认全自动**：标准使用方式为 `/goal ::init <设想>`——从 `::init` 到 `::ci` 全自动连续执行，批准门槛不阻塞。非 `/goal` 情景下在各批准门槛处等待用户确认。**唯一例外**：从零开始（含无关的 loop中断恢复按从零处理）时，`::req` 与 `::design` 的批准门禁在全自动情景下也强制生效——逐文档询问批准（AskUserQuestion 或同类「询问-等待回答」交互工具），未批准则按说明修改后重新询问，直到批准；进入 `::devplan` 后恢复自动放行（规范见 `system/command_reference.md`「从零开始强制批准门禁」）。

**参数格式**（由主 Agent 使用 LLM 能力直接解析）：
- `-fast`：可选标志。存在时进入快速开发流（见上文「两种模式」）。
- `<custom prompt>`：必填。用户对项目/本轮开发的设想与要求原文，是需求分析阶段（fast 模式下是 `::devplan`）的首要输入。续接场景（继续开发 / loop中断恢复）下可为对本轮追加的要求；无新要求时写「继续」即可。

**示例**：

```
::init 构建一个支持插件扩展的 EEG 实时解码平台
::init 在现有代码基础上增加离线分析能力
::init 继续
::init -fast 给 status 命令增加 --json 输出
```

**执行步骤**

**步骤 1 — 基础设施自检**：
- 当前目录不是 git 仓库时执行 `git init` 并完成首次提交（`::dev` 的 worktree 机制与全局本地提交规范均依赖 git）。
- `system_log.md` 缺失时创建（首行 `# system_log.md`）。
- `status.md` 缺失时按模板初始内容创建。
- `docs/`、`docs/modules/`、`plans/`、`qna/`、`workspace/`、`system/devlog/` 缺失时创建。
- `.gitignore` 缺失时创建；确保 `local.md` 与 `.worktrees/` 已列入其中。

**步骤 1.5 — 待追赶检查**：读取 `status.md` 的 `[Devlog Backlog]`。
- 存在待追赶记录时向用户报告条数与各条目的时间/目的，提示这些 fast 开发尚未更新全局文档、可择时执行 `::doc` 追赶。
- **自动降级**：待追赶记录非空、本次调用为**非 fast** 的 `::init`、且 `[Current Phase]` 为 `已完成` 或「（暂未设置）」（即没有进行中的标准 loop 可续接，属于新启动）时，**本次命令自动降级为 `::init -fast`**——明确提示用户：「存在 {N} 条未追赶的 fast 开发记录，全局文档尚未更新；本次 ::init 自动降级为 fast 模式。如需启动完整 loop，请先执行 `::doc` 追赶欠账。」随后按 fast 分支继续执行（含全局文档前置校验）。
- 断点续接场景（有进行中的标准 loop）不降级，维持续接，仅报告欠账条数。

**步骤 2 — 模式判别**：
- 带 `-fast` 标志：进入 fast 分支（步骤 4-fast）。前置校验三份全局文档均存在；任一缺失时告知用户原因并去掉 `-fast` 改走标准模式判别。
- 标准模式：执行仓库状态判别（四态）：

| 状态 | 判定条件 | 分支 |
| --- | --- | --- |
| 从零开始 | 无 docs/ 文档且无业务代码 | 建立空的 `docs/test.md`（骨架：头部约束声明 + 空的「全局测试」节 + 「最近一轮结果」节，格式与登记约束见 `system/commands/dev.md`「测试文档规范」），供后续 `::dev` 登记模块测试与 `::ci` 登记库级测试使用；随后进入需求分析阶段（步骤 4） |
| 二次开发 | 有业务代码但无 docs/ 文档 | 先对本仓库执行 `::work -explore`（无参数形态），直接基于代码生成 `docs/requirements.md`、`docs/design.md` 与 `docs/interaction.md`（含复用分析）；再进入需求分析阶段与用户迭代 |
| 继续开发 | 有业务代码且有 docs/ 文档 | 读取 `status.md` 的 `[Current Phase]`、`[Phase History]` 与现有文档，向用户报告当前阶段并续接 |
| loop中断恢复 | 有 docs/ 文档但无业务代码 | 判别 custom prompt 与既有 `docs/requirements.md` 内容的相关性：相关 → 视为 loop 被打断，续接到 `[Current Phase]`；无关 → 告知用户旧文档将被覆盖，按从零开始处理（含将 `docs/test.md` 重置为空骨架） |

「业务代码」指除 `system/`、文档目录（`docs/`、`plans/`、`qna/`、`workspace/`）与配置文件之外的源码。

**步骤 3 — 写入状态**：
- 标准模式——`status.md`：`[Repository State]` 写入判别结果，`[Current Phase]` 写入即将进入的阶段；`[Project Goal]` 未设置时根据 custom prompt 提炼写入；`[Loop Cycle]` 未设置时写入 `第 1 轮 / 共 ? 轮`（总轮数待 `::design` 的开发轮次规划确定后更新）；`[Phase History]` 尚无本轮记录时写入 `- 第 N 轮：` 起头行（N 取 `[Loop Cycle]` 的当前轮次）。
- fast 模式——`[Repository State]` 保持现状不覆盖；`[Current Phase]` 置为 `开发计划`；`[Fast Baseline]` 写入当前 git HEAD commit hash（非 git 仓库写 `working-tree`）；`[Phase History]` 另起 `- fast 轮：` 新行；`[Loop Cycle]` 不变（fast 轮次不计入开发轮次规划）。
- 判别依据向用户报告（哪些观察导致了该判定）。

**步骤 4 — 进入分支**：
- **步骤 4-fast（快速开发流）**：按 custom prompt **按需读取**全局文档（`docs/requirements.md`、`docs/design.md`、`docs/interaction.md`）与相关模块文档——只读，不修改；随后调用 `::devplan`（以 custom prompt 与现行文档为输入，计划只写本轮 diff，不得包含全局文档修改项）→ `::dev`（实现 + 模块内测试；跳过全局文档更新）→ `::mergelocal`（合并 dev 分支、清理 worktree）→ `::devlog`（记录目的与全部文件 diff，登记 `[Devlog Backlog]`）。在 `/goal ::init -fast` 等全自动情景下连续执行；否则在进入 `::devplan` 前向用户确认。
- 从零开始 / 二次开发 / 无关的 loop中断恢复：调用 `::req`（协议见 `system/commands/req.md`），以 custom prompt 为输入生成初版需求文档，随后调用 `::design` 生成初版设计文档（系统设计与用户交互设计两份），之后沿完整循环推进（`::devplan → ::dev → ::mergelocal → ::lint → ::ci`）。在 `/goal ::init` 等全自动情景下连续执行；否则在进入需求分析前向用户确认。**例外**：从零开始与无关的 loop中断恢复（按从零处理）时，`::req` 与 `::design` 的逐文档批准门禁即使在全自动情景也强制生效（协议见 `system/command_reference.md`「从零开始强制批准门禁」）；进入 `::devplan` 后恢复自动放行。
- 继续开发 / 相关的 loop中断恢复（**断点续接**）：对照 `[Current Phase]` 与 `[Phase History]` 定位断点，向用户报告：
  1. 当前轮次（`[Loop Cycle]`）与当前阶段；
  2. 本轮已完成的阶段（`[Phase History]` 本轮行）；
  3. 下一步动作（如「当前处于模块开发阶段，下一步执行 `::dev`」）；
  4. `docs/archive/` 下存在中断归档时，一并报告最近的中断记录（轮次、中断时阶段、原因）并提示续开发将承接该清单。
  等待用户指示；全自动情景下直接从断点阶段继续执行，把剩余阶段走完（直到 `::ci` 完成）。
  - 断点阶段的进入方式：`需求分析` → `::req`；`开发计划` → `::devplan`；`模块开发` → `::dev`；`分支合并` → `::mergelocal`；`代码检查` → `::lint`；`库级测试` → `::ci`；`已完成` → 提示用户以 `::req` 开启新一轮 loop 或结束。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 状态判别: {四态之一} | 进入阶段: {阶段名} | 断点续接: {是/否} | Project Goal: {已设置/沿用/未设置}
````

`::init -fast`（含自动降级）时摘要为：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 模式: fast | 自动降级: {是/否} | 基线: {commit hash 前 12 位或 working-tree} | 进入阶段: 开发计划 | 待追赶 devlog: {N} 条
````
