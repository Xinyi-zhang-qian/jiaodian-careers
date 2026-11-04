# 命令参考手册

> 本文件为 `::` 命令系统索引。各命令的完整执行协议见 `system/commands/{name}.md`。
> 全局行为规范见 `AGENTS.md`。

---

## 全局：运行日志规范

每个 `::` 命令执行完毕后向仓库根目录 `system_log.md` 追加一条记录：

```markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- {结果摘要单行}
```

各命令的结果摘要模板见对应 `system/commands/{name}.md` 末尾的「运行日志」一节。

`system_log.md` 缺失时由 `::init` 自动创建（首行模板：`# system_log.md`）。

---

## 全局：本地提交规范

每个 `::` 命令执行完毕后（含 `system_log.md` 运行日志追加完成），**必须**在本地完成一次 git commit：

1. 提交内容为本命令产生的全部变更（含 `system_log.md` 的追加）；提交信息使用中文，首行格式：`::{命令名} {一句话摘要}`。
2. 提交只发生在本地；推送到远程只能由 `::push` 命令执行（见 `AGENTS.md` 约定「推送统一经 ::push」），且 `::push` 只允许用户手动调用，任何自动化流程都不得触发。
3. 特例——`::dev`：各模块的变更提交由子 Agent 在各自 worktree 的分支内完成（协议见 `system/commands/dev.md`）；主 Agent 在主工作区提交自身产生的变更（`status.md`、`plans/current.md` 勾选、`system_log.md` 等）。
4. 特例——`::mergelocal`：分支合并产生的合并提交即为本命令提交的一部分；命令收尾时把状态、清单与日志变更一并提交。
5. 命令未产生其他文件变更时（纯只读且按协议无归档写入），仍须提交运行日志的追加——任何 `::` 命令都至少有一条日志变更可提交。

---

## 全局：远程操作限制

- `::push` 是唯一允许执行 `git push` 的操作，**只能由用户在当前消息中显式输入 `::push` 触发**。`/goal` 全自动模式、开发 loop 的任何阶段、其他命令内部步骤、后台任务、定时任务与 CI 流水线一律不得调用或触发 `::push`；出现自动 push 请求时主 Agent 必须拒绝并报告。
- `::push` 只做快进推送：本地严格包含远程 HEAD 时推送，远程含本地缺失提交或双方分叉时停止并要求用户手动 merge，不做 pull、不合并、不运行测试、禁止 `--force`。**欠账门控**：`status.md` 的 `[Devlog Backlog]` 非空（存在未追赶的 fast 开发记录）时禁止推送，停止并提示用户先执行 `::doc` 追赶；`status.md` 不存在或无该字段时视为无欠账。
- `::pr` 是唯一允许创建 Pull Request（`gh pr create`）的操作，与 `::push` 一样**只能由用户在当前消息中显式输入 `::pr` 触发**，任何自动化流程一律禁止，出现自动 PR 请求时主 Agent 必须拒绝并报告。`::pr` 以 `local.md`「远程配置」表中 `::pr` 行的远程仓库与分支为 head，向用户指定的仓库与分支提 PR；目标仓库或目标分支未明确指定、无 PR 权限（目标仓库不可见或无写权限）、或本地有未 push 的内容（本地领先远程或双方分叉）时，停止执行并告知用户；PR 标题与正文默认按固定四节模板生成（「为什么做」从需求文档或用户 prompt 总结），并强制遵守 `AGENTS.md` 全局语言规范；不 push、不合并、不运行测试、不自动 fork。
- `::pull` 只做快进拉取（`git merge --ff-only`）：远程严格包含本地 HEAD 时拉取，其余关系（含本地严格领先与双方分叉）停止并提示用户手动 merge；不在 loop 阶段链中，其他命令不得在内部调用。
- 三个命令各自读取 `local.md`「远程配置（::pull / ::push / ::pr）」表中本命令对应行的远程仓库与远程分支（三行可以不同）；对应行缺失时停止并向用户询问后写入。

---

## 全局：子 Agent 编排规范

重命令（`::work` / `::ask` / `::lint` / `::dev`）采用「主 Agent 编排 + 子 Agent 执行」模式：

1. 主 Agent 用 LLM 能力直接解析命令参数（`@` 目标、自定义 prompt 等，不用正则）。
2. 主 Agent 将目标解析为具体路径，向子 Agent 注入固定上下文块（`ORIGINAL_COMMAND` / `DATE` / `TIME` / `OUTPUT_FILE` / `TARGETS` 等）。
3. 子 Agent 按对应执行协议执行，产出结构化完成信号（如 `[WORK_DONE]...[/WORK_DONE]`）后立即退出。协议位置：`::ask` / `::lint` / `::dev` 内嵌于 `system/commands/{ask,lint,dev}.md` 的「子 Agent 执行协议」一节；`::work` 的默认通用模板协议为 `system/worker/procedure.md`，专用模板（`-explore` / `-research` / `-algocheck` / `-experiment`）的编排与子 Agent 协议见 `system/worker/templates/`。
4. 主 Agent 汇总完成信号并输出；`::lint` 与 `::dev` 另要求主 Agent 独立校验子 Agent 报告（不直接采信），校验协议见对应命令文件。

各命令的子 Agent 派发方式不同：`::lint` 为后台子 Agent 并行扫描（上限 8，超出分批）；`::dev` 为前台子 Agent 并行开发（上限 3，每个子 Agent 一个独立 git worktree，等该批全部返回后再派下一批）；`::work` / `::ask` 按各自协议派发。


loop 命令中 `::init` / `::req` / `::design` / `::devplan` / `::mergelocal` / `::devlog` / `::doc` / `::ci` 由主 Agent 直接执行（需要与用户交互和批准门槛），不启动子 Agent；`::lint` 与 `::dev` 为例外——`::lint` 的扫描与检查由后台子 Agent 并行执行，`::dev` 的模块开发由前台子 Agent 并行执行；用户确认、修复决策、合并裁决、`status.md` 状态更新与运行日志留主 Agent。

---

## 全局：阶段门禁与手动调用提醒

loop 的固定阶段顺序：`需求分析`（::req + ::design）→ `开发计划`（::devplan）→ `模块开发`（::dev，可与 ::devplan 多轮往返）→ `分支合并`（::mergelocal）→ `代码检查`（::lint）→ `库级测试`（::ci）→ `已完成`。每次 `::init` 启动的 loop 必须走完整条链；默认以 `/goal ::init` 全自动方式连续执行。

**快速开发流**：`::init -fast` 启动的 fast loop 阶段顺序为 `开发计划`（::devplan）→ `模块开发`（::dev，仅模块级测试）→ `分支合并`（::mergelocal）→ `开发日志`（::devlog）→ `已完成`——跳过需求分析、代码检查与库级测试，全局文档欠账记入 `system/devlog/` 与 `[Devlog Backlog]`，由 `::doc` 追赶（`文档追赶` → 末尾一次 `::lint` → 一次 `::ci`）。存在未追赶 devlog 时，新启动的非 fast `::init`（非断点续接场景）自动降级为 `::init -fast` 并提示用户（协议见 `system/commands/init.md` 步骤 1.5）。

**手动调用门禁**：用户手动调用 `::design` / `::devplan` / `::dev` / `::mergelocal` / `::devlog` 时（即非由 loop 流程自然推进），主 Agent 必须先执行以下检查再进入命令自身的执行步骤：

1. 读取 `status.md` 的 `[Current Phase]` 与 `[Phase History]`；
2. 向用户报告：上一阶段是否已完成（依据 `[Phase History]` 的本轮记录）、当前 loop 停在哪一阶段、本次调用是「顺流程推进」「回退重做」还是「跨阶段跳转」；
3. 前置阶段未完成时（如尚无已批准的 devplan 就手动 `::dev`），明确提醒用户缺失的前置阶段与建议命令；非全自动情景下等用户确认后才继续；
4. 调用构成对进行中 loop 的打断时（典型：阶段 ≥ 开发计划时手动 `::design` 重设计），**必须忠实执行断点归档**——归档协议见 `system/commands/design.md` 的「打断检测与归档」一节，禁止跳过归档直接覆盖；
5. `::req` / `::lint` / `::ci` / `::doc` / `::pull` 为豁免命令：可随时手动调用，不做本门禁提醒（各自的前置条件检查仍然有效）。`::push` 与 `::pr` 同样豁免本门禁，但只能由用户在当前消息中显式调用——`/goal` 全自动模式、loop 阶段推进、其他命令内部步骤、后台任务、定时任务与 CI 流水线一律不得触发 `::push` 或 `::pr`。

**从零开始强制批准门禁**：`status.md` 的 `[Repository State]` 为 `从零开始`（含无关的 loop中断恢复按从零处理）时，需求分析阶段的批准门禁在任何情景下都不得跳过——包括 `/goal ::init` 全自动模式：

1. `::req` 生成 `docs/requirements.md` 后、`::design` 生成 `docs/design.md` 与 `docs/interaction.md` 后，必须使用 AskUserQuestion 或同类「询问-等待回答」交互工具**逐文档**取得用户明确批准（`::design` 的两份文档各为一项询问）；
2. 任一文档未获批准时，按用户说明修改该文档（`::design` 还需重新执行一致性检查），然后重新询问，直到批准；
3. 三份文档全部批准后进入 `::devplan`，自 `::devplan` 起恢复常规放行规则（全自动情景批准门槛不阻塞）。

二次开发、继续开发、断点续接与 fast 模式不受本门禁影响。

---

## 全局：不一致采纳优先级

`::lint`、`::ci` 检查或同步文档与代码一致性时（`::doc` 文档追赶同用），发现不一致按以下优先级确定权威方——权威方不动，修正非权威方使其一致：

1. **用户的 prompt**（fast 轮补文档场景：devlog 记录的本轮目的与用户原始要求）；
2. **需求文档**（`docs/requirements.md`，用户批准的需求）；
3. **已经实现的代码**（当前真实行为）；
4. **其他文档**（`docs/design.md`、`docs/interaction.md`、`docs/modules/`、`docs/test.md` 等）。

需要修改代码才能一致时，向用户报告偏差后再修复（全自动情景修复后在报告中注明），不静默改变代码行为。

---

## 全局：写入范围限制

`system/` 是命令系统本体。除以下协议内例外，任何命令（含 `::dev` / `::lint` / `::ci` 的修复动作与子 Agent 执行）均不得新建、修改或删除 `system/` 下的文件；仅当用户明确要求修改命令系统本身时才可变更：

- `system/devlog/`：由 `::devlog`（写入 fast 开发记录）与 `::doc`（删除已追赶记录）按协议维护。

loop 状态文件 `status.md` 位于仓库根目录（不属于 `system/`），由 loop 命令按协议更新；`local.md` 的「::dev Worktree 清单」由 `::dev` / `::mergelocal` 按协议维护，「远程配置（::pull / ::push / ::pr）」表由 `/init` 建库时按用户指定写入、由 `::pull` / `::push` / `::pr` 各自读取对应行。

---

## 命令索引

### 编程 loop 命令

| 命令 | 定义文件 | 说明 |
|---|---|---|
| `::init [-fast] <custom prompt>` | `system/commands/init.md` | 判别仓库状态（四态），启动强制完整循环的开发 loop；可续接上次未完成的 loop（默认 `/goal ::init` 全自动）；从零开始（含无关中断恢复按从零处理）时建立空 `docs/test.md` 骨架供 ::dev/::ci 登记测试；`-fast` 进入快速开发流（已有全局文档时：只读全局文档 → ::devplan → ::dev → ::mergelocal → ::devlog，跳过 ::lint/::ci） |
| `::req [补充需求]` | `system/commands/req.md` | 生成/覆盖需求文档 `docs/requirements.md`（只收录用户侧功能需求、架构选择（用户决策层）与性能等约束，不含设计内容） |
| `::design` | `system/commands/design.md` | 生成/覆盖系统设计 `docs/design.md`（整体设计：架构契约、模块边界、模块间行为）与用户交互设计 `docs/interaction.md`（全部交互行为：逐命令/逐控件的输入输出、边界检查与错误处理 + 模块间交互线协议）（双向一致性检查；loop 被打断时先归档旧设计至 `docs/archive/`） |
| `::devplan` | `system/commands/devplan.md` | 制定开发计划（五段结构 + 模块 checklist），建立模块设计/交互文档（`docs/modules/{模块}_design.md` 与 `_interaction.md`），等待用户批准 |
| `::dev` | `system/commands/dev.md` | 按模块并行开发：主 Agent 为每个待开发模块开立独立 git worktree（`.worktrees/{模块名}`，分支 `dev/{模块名}`）并登记 `local.md` 清单，前台子 Agent 并行执行（最多 3 个）；每个模块固定顺序：更新模块文档 → 按交互文档编写模块测试并登记 `docs/test.md` → 实现业务代码 → 执行本模块测试（只跑本模块测试，全量回归留待 ::ci；中断续接时承接归档清单；fast 模式三份全局文档只读、test.md 不冻结） |
| `::mergelocal` | `system/commands/mergelocal.md` | 分支合并：合并当前本地全部 `dev/*` 分支到主工作区分支并自动处理冲突（文档取并集、代码按模块边界与交互规格裁决、裁决后跑受影响模块测试）；全部合并完成后清理全部 worktree 只保留主工作区，并清空 `local.md` 清单 |
| `::devlog` | `system/commands/devlog.md` | 快速开发流收尾：本轮目的与全部文件 diff（行号）按固定模板写入 `system/devlog/`，登记 `[Devlog Backlog]` |
| `::doc` / `::doc -hard` | `system/commands/doc.md` | 按 devlog 逐条（最旧优先）追赶补齐需求/设计文档，每条完成后删除记录；全部追完后统一执行一次 `::lint`（`-hard` 时用 `::lint -hard`）与一次 `::ci` |
| `::lint` / `::lint -hard` | `system/commands/lint.md` | 代码质量检查与清理 + 文档健康检查（主 Agent 编排 + 后台子 Agent 并行扫描，主 Agent 独立校验与修复；含设计一致性、中断残留专项检查，及 `docs/test.md` 登记与实际测试的双向核验）；`-hard` 为文档深度专项（库级文档只保留当前状态 + 表达精简 + 语言风格 + 测试覆盖度审计——对照全部交互文档（`docs/interaction.md` 与各模块交互文档），未覆盖补测试、冗余删测试），仅用户显式调用，loop 不使用 |
| `::ci` / `::ci test` | `system/commands/ci.md` | 库级测试的编写/修改/执行与文档更新（测试注册与结果写入 `docs/test.md`；整库回归严格按 test.md 登记清单逐条执行；文档同步遇不一致按「不一致采纳优先级」处理）；含 GUI 视觉验收（模型支持视觉且任务含 GUI 时启用：截图 + 模型 rubric 判读 + verdict 门禁，失败修复重拍直到通过） |

### 通用命令

| 命令 | 定义文件 | 说明 |
|---|---|---|
| `::ask <问题>` | `system/commands/ask.md` | 问答并归档到 `qna/YYYY-MM-DD.md` |
| `::work [-模版] [@目标] <prompt>` | `system/commands/work.md` | 上下文感知写作/修改；`-模版` 可选 `-explore`（本库文档再生成 / 外部项目库探索）/ `-research`（三阶段通用调研）/ `-algocheck`（算法正确性检查：库内实现与边界核验 + GitHub 开源实现对比，只报告不修复）/ `-experiment`（实验与数据分析：workreport 工作目录 + 五章最终报告，结果章逐图逐表各配一段解释），模板协议见 `system/worker/templates/` |
| `::push` | `system/commands/push.md` | 远程推送（**只可由用户手动调用**，任何自动流程禁止触发）：checkout `local.md`「远程配置」表 `::push` 行的远程分支 → 本地分支严格包含远程 HEAD 时推送变更；远程含本地缺失提交或双方分叉时停止并告知用户需手动 merge；无 push 权限时停止并告知；`[Devlog Backlog]` 非空（fast 欠账未追赶）时禁止推送，提示先 `::doc`。不 pull、不合并、不运行测试，禁止强推 |
| `::pull` | `system/commands/pull.md` | 远程拉取（快进专用）：checkout `local.md`「远程配置」表 `::pull` 行的远程分支 → 远程严格包含本地 HEAD 时执行 `git merge --ff-only` 拉取；其他情况（本地严格领先或双方分叉）一律停止流程并提示用户需要手动 merge；不自动 merge/rebase |
| `::pr <目标仓库> <目标分支> [标题与说明]` | `system/commands/pr.md` | 创建 Pull Request（**只可由用户手动调用**，任何自动流程禁止触发）：以 `local.md`「远程配置」表 `::pr` 行的仓库与分支为 head 向指定仓库的指定分支提 PR；目标未明确指定、无 PR 权限、或本地有未 push 的内容（本地领先或分叉）时停止并告知用户；PR 正文默认按固定四节模板生成（为什么做 ← 需求文档或用户 prompt），强制遵守全局语言规范。不 push、不合并、不运行测试、不自动 fork |
| `::cls` / `::cls --all` | `system/commands/cls.md` | 清空 loop 状态 / 重置用户数据 |
| `::help` / `::exit` | `system/commands/help.md` | 帮助 / 退出 Agent 模式 |
