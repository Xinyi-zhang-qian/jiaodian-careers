# ::dev

> 命令索引见 `system/command_reference.md`。本文件为 `::dev` 的完整执行协议。

---

## `::dev [模块名]`

模块开发命令。采用「**主 Agent 编排 + 前台子 Agent 并行执行**」模式：主 Agent 为每个待开发模块开立一个独立的 git worktree，派发前台子 Agent 在 worktree 内完成该模块的全部开发工作；每个模块在子 Agent 内按固定顺序执行：**更新模块文档 → 按交互文档编写模块测试 → 实现业务代码 → 执行本模块测试 → 在该 worktree 分支内提交**。本命令只运行各模块自身的模块测试，**全量回归（整库测试）留待 `::ci`**，本命令与子 Agent 均不得运行全量回归。

**参数格式**：
- `[模块名]`：可选。指定只开发某个模块（派 1 个子 Agent）；缺省时按 `plans/current.md` 的 checklist 推进所有未完成模块。

**前置条件**：`plans/current.md` 存在已批准的 devplan（含模块 checklist）；`docs/modules/` 中对应模块的设计与交互文档已建立；当前目录为 git 仓库（`::init` 基础设施自检已保障）。

**手动调用检查（门禁）**：本命令由用户手动调用时，先执行 `system/command_reference.md` 的「阶段门禁与手动调用提醒」：读 `status.md` 的 `[Current Phase]` 与 `[Phase History]`，向用户报告上一阶段（开发计划）的完成情况——devplan 是否已批准、checklist 已完成/未完成项各多少、本次调用是继续推进还是回退重做；无已批准 devplan 时提醒用户先执行 `::devplan`（全自动情景除外）。若用户意图是改变整体设计，提醒其改走 `::design` 以忠实执行打断归档。

**执行步骤（主 Agent 逐步执行，不得跳步）**

**步骤 1 — 确定待办模块清单**：从 `plans/current.md` checklist 取全部未完成模块（或参数指定的模块）。全部完成（不含最后的整合测试项）→ 转到步骤 6。中断续接场景（`docs/archive/` 存在中断记录）：先读最近一次 `interruption.md`，已完成模块直接复用不重做（不派子 Agent），半成品模块从清单记录的状态继续（把清单中的剩余工作注入对应子 Agent 的 prompt）。

**步骤 2 — 开立 worktree 并登记**：对每个待办模块，以主工作区当前 HEAD 为基线开立独立 worktree 与分支：

```bash
git worktree add .worktrees/{模块名} -b dev/{模块名}
```

（`.worktrees/` 必须已列入 `.gitignore`，缺失时补充；同名分支已存在时先核对其内容，属上次未完成残留的在其上继续开发，属已合并残留的删除后重建。）每开立一个，立即在 `local.md` 的「::dev Worktree 清单」登记一行：`- .worktrees/{模块名} | 分支 dev/{模块名} | 模块 {模块名} | 状态 进行中`。

**步骤 3 — 分批派发前台子 Agent**：把待办模块按**每批最多 3 个**分批；同一批的子 Agent 在同一响应内并行派发（前台方式：等待该批全部返回后再派发下一批）。每个子 Agent 注入固定上下文块（`ORIGINAL_COMMAND` / `DATE` / `TIME` / `MODULE_NAME` / `WORKTREE_PATH` / `BRANCH_NAME` / `FAST_MODE`），指示其 Read 本文件「子 Agent 执行协议（dev worker）」一节严格执行；派发时完整注入 `AGENTS.md` 的「全局语言风格」与「仓库约定」两节。

**步骤 4 — 主 Agent 核验（子 Agent 报告不算数）**：该批全部返回后，对每个完成信号独立核实：

1. `git -C {WORKTREE_PATH} log --oneline -3` 确认该分支存在子 Agent 的提交；
2. 抽读完成信号中声明的测试输出与改动文件，必要时在 worktree 内复跑该模块测试；
3. 子 Agent 失败、半成品或核验不通过：主 Agent 进入该 worktree 亲自接手完成，或修正后重派一个子 Agent；
4. 核验通过：勾选 `plans/current.md` 该模块 checklist 项，把 `local.md` 清单中该行状态改为 `已完成`。

**步骤 5 — 循环**：还有未派发或未完成的模块 → 回到步骤 3 派发下一批；全部模块完成 → 步骤 6。

**步骤 6 — 收尾**：向用户汇总（每模块：分支、实现文件、测试结果、文档更新清单）；更新 `status.md`：`[Current Phase]` 置为 `分支合并`，并向 `[Phase History]` 本轮行追加 `模块开发（{YYYY-MM-DD HH:MM}）`；提示执行 `::mergelocal`（标准 loop 与 fast loop 均如此——fast loop 中 `::mergelocal` 完成后由 `::mergelocal` 指向 `::devlog`）。主工作区的文档与实现一致性核对在 `::mergelocal` 合并全部完成后进行（由 `::mergelocal` 的裁决与 `::lint` 的文档同步核验覆盖），本命令不直接在主工作区做一致性修改。

**规则**：
- 前台并行上限 3：同一响应内最多并行派发 3 个 dev 子 Agent，超出分批，等该批全部返回后再派下一批。
- 每个模块的固定顺序在子 Agent 内不得颠倒：先更新模块文档，再按交互文档写测试，最后写业务代码。
- 测试未通过的模块不得标记完成。
- 每个子 Agent 只运行本模块的测试；全量回归是 `::ci` 的职责，本命令任何环节都不得触发全量回归。
- 子 Agent 的写入范围仅限自己的 worktree；`status.md`、`system_log.md`、`plans/current.md`、`local.md` 与 `system/` 下文件由主 Agent 维护，子 Agent 一律不得修改——见「子 Agent 执行协议（dev worker）」的权限声明。
- 主 Agent 在 `::dev` 期间不改动主工作区的业务代码与文档（避免与各分支产生无谓分叉）；主工作区的状态与日志变更在收尾时提交。
- 发现需要新增计划外模块/功能时，停下并提示用户回到 `::devplan`。
- 多个子 Agent 并行修改 `docs/test.md`（各自登记本模块小节）与全局文档产生的分歧是预期内的，由 `::mergelocal` 统一合并与裁决；子 Agent 只改 `docs/test.md` 的本模块小节与「最近一轮结果」中本模块记录，不触碰其他模块的小节。

---

## 子 Agent 执行协议（dev worker）

> 主 Agent 启动 dev worker 子 Agent 时，在 prompt 中注入固定上下文块，并指示其 Read 本文件、严格按本节执行。
> 工作目录为注入的 `WORKTREE_PATH`（该模块的独立 git worktree），不是主工作区。
> 写作规范（中文输出、严禁编造）与语言风格遵循 `AGENTS.md`（主 Agent 派发时已完整注入「全局语言风格」与「仓库约定」两节）。

**角色**：dev worker 子 Agent 由主 Agent 通过 `::dev` 命令以前台方式启动，在独立 worktree 内完成一个模块（`MODULE_NAME`）的一轮完整开发循环，并在自己的分支（`BRANCH_NAME`）上提交。

**核心原则**：只开发 `MODULE_NAME` 一个模块；只写入自己的 worktree；测试先行；只运行本模块测试；完成时在分支内提交。

### 文件权限声明

**允许执行**
- shell 命令（构建、测试运行、`git status` / `git diff` / `git add` / `git commit` 等），范围限于 `WORKTREE_PATH` 内

**允许读取**
- worktree 内的全部文件（`docs/`、源码、测试、`system/commands/` 协议文件等）
- 中断续接场景：worktree 内 `docs/archive/` 下最近一次的 `interruption.md`

**允许写入**
- `WORKTREE_PATH` 内的业务源码、测试、`docs/`（含 `docs/modules/` 本模块双文档、`docs/test.md` 本模块小节与「最近一轮结果」、非 fast 模式下的三份全局文档）
- 该 worktree 分支上的 git commit（中文提交信息）

**禁止访问/修改**
- 主工作区与其他模块 worktree 下的任何文件（一切读写都在 `WORKTREE_PATH` 内进行）
- `status.md`、`system_log.md`、`plans/current.md`、`local.md`（均由主 Agent 维护；checklist 勾选归主 Agent）
- `system/` 下的任何文件（命令系统本体）
- 禁止 `git push`、`git checkout` / `git switch` 切换分支、禁止对主仓库执行 worktree 内提交之外的任何 git 写操作；fast 模式（`FAST_MODE=yes`）下三份全局文档（`docs/requirements.md`、`docs/design.md`、`docs/interaction.md`）只读
- 禁止运行全量回归（整库测试）；只运行本模块的测试

### Step 0 — 解析参数

从 prompt 中提取主 Agent 注入的字段：

- `ORIGINAL_COMMAND`：用户输入的完整命令原文。
- `DATE` / `TIME`：当前日期与时间。
- `MODULE_NAME`：本 worker 负责的模块名。
- `WORKTREE_PATH`：本 worker 的工作目录（如 `.worktrees/{模块名}`）。
- `BRANCH_NAME`：本 worker 的提交分支（如 `dev/{模块名}`）。
- `FAST_MODE`：`yes` / `no`。

### Step 1 — 更新模块文档（最优先，先于一切测试与代码）

把本模块本轮变更的目标状态先落进文档（写作规范见上文「模块文档规范」）：
- `docs/modules/{模块}_design.md` 与 `docs/modules/{模块}_interaction.md`：更新模块内部设计（内部结构、内部数据流、数据结构）与逐接口交互规格到本轮目标状态；
- `docs/interaction.md`：本模块承载的用户交互（CLI 命令、GUI 控件）或模块间交互线有变化时，同步更新对应交互规格；`docs/design.md` / `docs/requirements.md`：变更影响架构契约、模块边界或需求时同步更新。**fast 模式例外**（`FAST_MODE=yes`）：三份全局文档只读——交互规格变化写入模块交互文档，与全局文档的偏差不处理，由主 Agent 在 `::devlog` 阶段记入「文档偏差备忘」。`docs/test.md` 不在冻结之列。

### Step 2 — 编写模块测试（测试先行）

根据交互文档中本模块的交互规格（`docs/interaction.md` 的用户交互与模块间交互线、`docs/modules/{模块}_interaction.md` 的模块内部接口）与更新后的模块设计文档，编写或修改本次变更的模块测试，并按上文「测试文档规范」把每条测试登记到 `docs/test.md` 的本模块小节——先登记，再写测试代码。**只改 `docs/test.md` 的本模块小节**（与「最近一轮结果」中本模块记录），不触碰其他模块的小节。**测试必须先于业务代码写就**。

### Step 3 — 实现业务代码

按更新后的模块文档实现，使测试通过。实现遵循：
- 公共接口与模块文档签名级一致；
- 只实现计划内的功能，不多做；
- 模块内部高内聚，跨模块只经设计文档定义的 Port/DTO/Event 交互。

### Step 4 — 执行本模块测试

只运行**本模块**的测试；失败则修复实现后重跑，全部通过才继续；将本轮结果（日期、范围、通过数/失败数、失败明细）更新到 `docs/test.md` 的「最近一轮结果」节（本模块记录）。**禁止运行其他模块的测试与全量回归**（全量回归是 `::ci` 的职责）。

### Step 5 — 分支内提交

在 `WORKTREE_PATH` 内执行 `git add -A` 并以中文提交信息提交（首行格式：`::dev {模块名} {一句话摘要}`）。提交前用 `git status --porcelain` 确认暂存内容只含本模块相关变更；发现误改禁改文件（`status.md` 等）时先恢复再提交。

### Step 6 — 输出完成信号

```
[DEV_DONE]
module: {模块名}
branch: {BRANCH_NAME}
worktree: {WORKTREE_PATH}
commit: {commit hash 前 12 位}
tests: {通过N/共M}
docs_updated: [{文件清单}]
notes: {偏差点/未决项，无则写「无」}
[/DEV_DONE]
```

然后**立即退出**，不得再调用任何工具。

---

## 模块文档规范

每个模块两份文档（`::devplan` 建立、`::dev` 每轮最先更新），承载全局文档不展开的模块内部事务。全局文档已定义的内容（架构契约、返回协议与错误分类、用户交互规格、模块间交互线协议、模块职责边界）只引用不重复。两份模板的写法参考全局 `docs/design.md` 与 `docs/interaction.md`，但按模块范围裁剪——不写文档体系分工、开发轮次规划、承接章节等全局内容。

### 模块设计文档（`docs/modules/{模块}_design.md`）

```markdown
# {模块名} 模块设计文档

# 1. 模块职责与边界
一句话业务闭环；数据所有权；不负责什么。
（与 docs/design.md 模块划分章一致；全局契约引用，不重复展开。）

# 2. 内部结构
组件/类/文件划分与各自职责（目录树）。

# 3. 内部数据流
输入 → 处理链 → 输出；关键处理步骤与失败点（处理顺序显式写出）。

# 4. 内部数据结构
本模块拥有的数据结构字段定义（类型 / 必填 / 默认值 / 合法范围 / 空值语义；
跨字段约束单独列出）。

# 5. 内部状态机（如适用）
模块内部状态与迁移；跨模块业务对象的状态机归 docs/design.md，此处不重复。
```

### 模块交互文档（`docs/modules/{模块}_interaction.md`）

```markdown
# {模块名} 模块交互文档

# 1. 交互面总览
本模块全部交互点清单：对外公共接口（供其他模块调用）、内部关键接口。
（本模块承载的用户交互与模块间交互线已在 docs/interaction.md 定义到
命令/控件/帧级，此处只列名称并引用，不重复。）

# 2. ~ N. 逐接口交互规格
每个接口一份规格表：
| 项目 | 内容 |
| 签名 | {名称与签名；调用方} |
| 预期输入 | {每个参数：类型 / 必填 / 默认值 / 范围；校验与拦截点} |
| 预期输出 | {返回值 / 副作用；成功时的行为} |
| 边界检查 | {空值、极值、非法输入的行为} |
| 错误处理 | {各失败情形的错误码/异常与对外结果} |
```

写作要求：深度标准与全局文档相同（实现者不必猜测本模块公共行为，测试者能写出明确断言）；与全局文档冲突或发现其缺失时停下并在完成信号 `notes` 中说明，由主 Agent 提示回到 `::design`，不在模块文档悄悄另定契约。

---

## 测试文档规范

全部测试集中注册于全局测试文档 `docs/test.md`（单一归属；不再设模块级测试文档与独立的库级测试文档）。文件结构：

```markdown
# 测试文档

> 全部测试必须依据交互文档设计：用户交互与模块间交互依据 `docs/interaction.md`，
> 模块内部接口依据 `docs/modules/{模块}_interaction.md`；
> 每条测试的预期行为（输入/输出/边界检查/错误处理）必须能回溯到某条交互规格。

## 全局测试
### {测试名称}
- 如何运行：{运行命令或入口}
- 测试内容：{一句或一段完整的话：依据哪条交互规格、验证什么预期行为}
（本节放库级测试：模块间集成、端到端、契约、视觉验收等）

## 模块 {模块名} 测试
### {测试名称}
- 如何运行：{运行命令或入口}
- 测试内容：{一句或一段完整的话}
（每个模块一节；本节只放该模块的模块内测试）

## 最近一轮结果
{日期、范围（模块名 / 整库）、通过/失败统计、失败明细与处置；
::dev 更新本模块记录，::ci 更新整库记录}
```

约束：
- 每条测试在编写或修改时同步登记/更新到 `docs/test.md` 对应小节——先登记，再写测试代码；
- 测试内容描述须为完整句子，写清依据的交互规格与验证点，不写「测试某功能正常」类空话；
- 覆盖义务：全部交互规格——`docs/interaction.md` 的逐命令/逐控件规格与模块间交互线、`docs/modules/` 各模块交互文档的逐接口规格——都应至少有一条测试覆盖；覆盖完整性由 `::lint -hard` 的测试覆盖度审计核查（未覆盖补测试、冗余删测试）；
- 测试条目不含状态字段，通过状态只记录在「最近一轮结果」节；
- 并行开发时各子 Agent 只改 `docs/test.md` 的本模块小节与「最近一轮结果」中本模块记录，分歧由 `::mergelocal` 合并；
- fast 模式中 `docs/test.md` 不属于只读冻结的全局文档，随测试编写直接修改。

---

## README 维护规范

`README.md` 的维护规则由本命令定义；任何命令或日常交互中更新 `README.md` 时都遵循本规范。

- `AGENTS.md` 仅保留模型工作所必须的信息；面向使用者的信息（如何安装依赖、如何运行仓库中的程序、目录结构等）统一放入 `README.md`。
- 每轮交互完成后检查 `README.md` 是否需要更新；如运行方式、依赖、功能等发生变化，自动修改 `README.md`。
- 更新时直接描述当前最新状态并删除过时的旧信息，禁止使用「之前…现在…」「旧版…新版…」等向后兼容的措辞（对应 `::lint` 的「过时表述」检查）。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录，并按 `system/command_reference.md`「全局：本地提交规范」在主工作区完成一次本地提交（`status.md`、checklist 勾选与日志变更）。

每批子 Agent 核验通过时：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 批次完成 | 模块: [{模块名}×N（分支 dev/{模块名}）] | 测试 {通过N/共M} | worktree: [.worktrees/{...}]
````

全部模块完成时摘要为 `- 全部模块完成 | 子Agent: {派发N/成功M} | 进入分支合并阶段`。
