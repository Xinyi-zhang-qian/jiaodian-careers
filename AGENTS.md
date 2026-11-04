# AGENTS.md

> 模板版本：v4.2（来自 BIT-CIBR-EBCI/AgenticLoopTemplates，安装于本仓库根目录）

## 目的

本仓库（jiaodian-careers，交点 Careers）是面向人文、社会科学与理工科交叉人才的招聘信息网站：聚合重点城市（北京、上海等）的科研机构、事业单位与企业岗位，区分「已核验（逐字段）/ 已核验（来源）/ 已核验（关键字段）」三级核验层级，为每条岗位保留可机器复核的来源证据（标题、发布日期、原文片段），支持按地区、单位类型、岗位方向、学历等筛选、本地收藏、交叉方向浏览与机器人/AI 岗位方向分析，构建为静态站点部署（Render）。技术栈：Next.js 16 + React 19 + Tailwind CSS 4，数据层为 TypeScript 数据文件 + 核验脚本（`npm run audit:jobs`），无数据库服务。

本仓库同时安装了 AgenticLoop 命令系统（`system/` 目录），开发过程通过 `::` 命令驱动。

## :: 命令系统

本仓库通过 `::` 命令系统驱动开发与文档维护。命令系统完全由 Markdown 协议文件构成，无代码层注册。

- **启动链**：会话启动时静默读取 `system/command_reference.md` 与 `status.md`。
- **调度规则**：执行 `::` 命令时，按 `system/command_reference.md` 命令索引表定位对应 `system/commands/{name}.md` 并 Read 完整协议，严格按协议执行。命令参数（`@` 目标、自定义 prompt 等）由主 Agent 使用 LLM 能力直接解析。
- **运行日志**：每次执行任意 `::` 命令完毕后，**必须**向根目录 `system_log.md` 追加一条运行日志。格式与命令索引见 `system/command_reference.md`；结果摘要模板见各命令协议文件末尾的「运行日志」一节。
- **协议唯一权威**：各命令的行为细则（参数、权限、步骤、产出模板）以 `system/commands/{name}.md` 为唯一权威来源。
- **子 Agent 编排**：单次响应最多 8 个并行子 Agent，超出分批。`::dev` 为例外：最多 3 个前台并行子 Agent，每个子 Agent 使用一个独立 git worktree（协议见 `system/commands/dev.md`）。
- **命令结束必提交**：每次执行任意 `::` 命令完毕后，**必须**在本地完成一次 git commit（中文提交信息），规范见 `system/command_reference.md`「全局：本地提交规范」。

## 编程 loop 流程

```text
::init <custom prompt>          判别仓库状态，启动开发 loop
   ▼
需求分析                         ::req + ::design
   ▼
开发计划                         ::devplan
   ▼                            （::devplan / ::dev 可多轮往返）
模块开发                         ::dev（前台子 Agent 并行，各自独立 worktree）
   ▼
分支合并                         ::mergelocal（合并全部 dev 分支、处理冲突、清理 worktree）
   ▼
代码检查                         ::lint
   ▼
库级测试                         ::ci
```

快速开发流（`::init -fast`）：开发计划（`::devplan`）→ 模块开发（`::dev`）→ 分支合并（`::mergelocal`）→ 开发日志（`::devlog`），跳过需求分析、代码检查与库级测试。

- **阶段规范**：强制完整循环、fast 流规则与欠账追赶、打断归档等阶段级规范，统一定义于 `system/command_reference.md`「阶段门禁与手动调用提醒」。
- **批准门槛（手动门控）**：门控按调用形态二分——以 `/goal ::init <设想>` 发起为全自动情景，批准门槛不阻塞；裸 `::init` 发起或逐命令手动推进为非全自动情景，必须在以下门槛处停下并等待用户确认，不得自行放行：
  1. **入口确认**（`::init` 步骤 4）：四态判别后、进入分支前——从零开始 / 二次开发 / 无关的 loop 中断恢复：进入需求分析前确认；fast 模式：进入 `::devplan` 前确认；断点续接：报告当前轮次、本轮已完成阶段、下一步动作与中断归档后，等待用户指示。
  2. **需求批准**：`::req` 生成 `docs/requirements.md` 后输出要点并询问用户是否批准；未批准时按用户意见覆盖重生成，直到批准。
  3. **设计批准**：`::design` 生成的 `docs/design.md` 与 `docs/interaction.md` 均获批准才算通过；用户提出修改时调整、重新覆盖写入并重新执行一致性检查，直到两份均获批准。
  4. **计划批准**：`::devplan` 向用户展示计划（重点展示 diff 部分）后等待批准；更新计划或开始执行前，先向用户询问具体细节，确认后再继续。
  5. **修复确认**：`::lint` 汇总展示问题清单后，等用户确认才执行修复。
  6. **例外升级**：`::mergelocal` 遇冲突双方语义互斥、按文档规格与测试均无法裁决时停下请示；`::ci` 遇需要改接口设计的测试失败时停下报告。
  - **从零开始强制批准门禁**：`status.md` 的 `[Repository State]` 为 `从零开始`（含无关的 loop 中断恢复按从零处理）时，`::req` 与 `::design` 的批准门禁在任何情景（含 `/goal` 全自动）都不得跳过——必须使用 AskUserQuestion 或同类「询问-等待回答」交互工具逐文档取得用户明确批准（`::design` 的两份文档各作为一项询问）；未批准时按说明修改后重新询问，直到三份文档全部批准；自 `::devplan` 起恢复常规放行。
  - **手动调用门禁**：用户手动调用 `::design` / `::devplan` / `::dev` / `::mergelocal` / `::devlog` 时，先读 `status.md` 的 `[Current Phase]` 与 `[Phase History]`，向用户报告上一阶段完成情况与本次调用性质（顺流程推进 / 回退重做 / 跨阶段跳转）；前置阶段未完成时提醒用户，非全自动情景下等确认后才继续。`::req` / `::lint` / `::ci` / `::doc` / `::pull` 豁免本门禁。详细协议见 `system/command_reference.md`「阶段门禁与手动调用提醒」。
  - **手动专用命令**：`::push` 与 `::pr` 在任何情景（含 `/goal` 全自动模式与 loop 各阶段）都只能由用户在当前消息中显式调用，自动流程中出现时必须拒绝并报告。
- **断点续接**：loop 的阶段与轮次进度记录在 `status.md`，各 loop 命令在进入与完成时更新；再次执行 `::init` 可从未完成的阶段继续。
- **loop 打断**：loop 越过需求分析后被需求变更打断时，旧设计文档与开发计划归档至 `docs/archive/` 并附中断清单，新设计承接已完成成果（归档协议见 `system/commands/design.md`）；需求分析阶段被打断不归档，直接覆盖重做。

## 全局语言风格 本节内容在派发任何子agent时应当完整注入

在任何时刻输出任何文字，包括代码注释，中间输出，都需要遵循以下的语言风格规则：

- **避免防御性表述**：不为尚未发生的误解反复辩解，不主动罗列用户未问且不影响决策的限制、免责声明或「我不会做什么」，不滥用「并不是……而是……」预设立场。风险、限制或不确定性确实影响判断时，简短说明具体原因及影响；不得隐瞒问题或夸大确定性。
- **避免黑话和空话**：优先写清楚谁做什么、解决什么问题、结果是什么。不要用「赋能、抓手、闭环、对齐、沉淀、底层逻辑」等商业黑话，或学术词汇包装简单意思。不自创概念，不堆叠抽象名词，删去不增加信息的客套、铺垫、重复总结和自我评价。
- **解释必要的专业术语**：能用日常语言准确表达时，直接使用日常语言。必须使用专业术语、缩写或外文词时，首次出现应就地说明它是什么、在当前问题中有什么作用；仅列出英文全称不算解释。用读者熟悉的词解释，参照本仓库的整体目的，可以认为读者已经了解相关领域的基础术语。解释时必要时给出具体例子，不用更多陌生术语解释一个陌生术语。
- **图表解释原则**：在任何时刻输出一张表格或说明一张实验的结果图时，必须首先采用完整的一段话来描述这张表格或图片的意义和解读方法，然后详尽地解释表格的每一行、图例和标题中的每一项非常识性内容。
- **句子语法完整**：输出的任何句子必须是符合正常汉语的完整成分句，不能随意减少成分。能使用简单句则不适用复杂的嵌套句式。修改时复杂句式应尝试进行拆分。
- **简写和译文规范**：不发明晦涩代号（几个字母数字组合或者奇怪的中文名字）。中文里非专业名词不用英文外文名词按意思选最贴切的译法。中文里非专业名词不用英文。
- **其他规范细节**：解释不省略理解所必需的中间步骤，允许进行复杂的解释，但在保证信息充分的前提下尽可能简洁。在语境中容易造成歧义的词，写清楚主体和客体。

## 仓库约定 本节内容在派发任何子agent时应当完整注入

1. **中文输出**：所有交互均使用中文进行输出。
2. **中文提交信息**：Git commit message 使用中文编写。
3. **命令结束必提交**：每个 `::` 命令执行完毕后必须在本地提交一次 git commit（中文提交信息），规范见 `system/command_reference.md`「全局：本地提交规范」。
4. **推送统一经 `::push`、PR 统一经 `::pr`，均仅限手动**：任何将本地提交同步到 GitHub 的操作（`git push` 等）只能由 `::push` 命令执行；创建 Pull Request（`gh pr create` 等）只能由 `::pr` 命令执行。两个命令都**只能由用户在当前消息中显式调用**，`/goal` 全自动模式、开发 loop 的任何阶段、其他命令的内部步骤、后台任务、定时任务与 CI 流水线一律不得调用或触发，自动流程中出现 push 或 PR 请求必须拒绝并报告。`::push` 另受欠账门控：`status.md` 的 `[Devlog Backlog]` 非空（存在未追赶的 fast 开发记录）时禁止推送，须先执行 `::doc` 追赶。
5. **操作日志**：在仓库根目录维护 `system_log.md`（append-only），汇总记录所有执行过的操作；`::` 命令的运行日志格式见 `system/command_reference.md`。
6. **新会话启动前必读**：若当前为新的 SESSION，开始工作前必须先读取 `system_log.md`、`README.md`、`status.md`、`plans/current.md`、`docs/requirements.md`、`docs/design.md` 与 `docs/interaction.md`（若存在）以及 `qna/` 中最近两天的问答文件，以掌握项目上下文与历史操作。
7. **敏感信息隔离**：`local.md` 存放本机密钥与环境配置，必须加入 `.gitignore`，禁止提交；`AGENTS.md` 中不得写入任何真实凭据。
8. **worktree 登记**：`::dev` 为并行子 Agent 打开的每个 git worktree 必须登记到 `local.md` 的「::dev Worktree 清单」（路径、分支、模块、状态）；子 Agent 完成时更新状态；`::mergelocal` 清理完成后清空清单。worktree 统一放在 `.worktrees/` 下，该目录必须列入 `.gitignore`。
9. **系统文件保护**：`system/` 是命令系统本体，**开发过程中禁止新建、修改或删除 `system/` 下的任何文件**，命令协议中或用户明确要求修改命令系统本身时除外。

## GitHub 互动（gh 标准流程）

与 GitHub 的所有互动**一律使用 `gh` CLI**，凭据存放在 `local.md`。标准流程：

1. **确认认证**：`gh auth status`；若未认证，从 `local.md` 读取 PAT 并执行 `echo <PAT> | gh auth login --with-token`。
2. **克隆仓库**：`gh repo clone <owner>/<repo>`（私有仓库无需手动拼 Token URL）。
3. **查看/管理**：Issue 用 `gh issue list/create`，PR 用 `gh pr list/create`，仓库信息用 `gh repo view`。
4. **提交与推送**：本地修改后 `git add` + `git commit`（中文提交信息）；推送与拉取通过 `::push` / `::pull` 执行——二者各自读取 `local.md`「远程配置（::pull / ::push / ::pr）」表中本命令对应行的远程仓库与远程分支（三行可以不同），只做快进转发（push 要求本地严格包含远程 HEAD，pull 要求远程严格包含本地 HEAD），不满足时停止并交由用户手动 merge；`::push` 只允许用户手动调用，任何自动化流程不得触发，且 `[Devlog Backlog]` 非空时禁止推送。创建 Pull Request 通过 `::pr` 执行——以「远程配置」表 `::pr` 行的仓库与分支为 head 向用户指定的仓库与分支发起，目标未明确指定、无 PR 权限或本地有未推送内容时停止并告知；PR 正文默认按固定四节模板生成（「为什么做」从需求文档或用户 prompt 总结）并强制遵守全局语言规范；`::pr` 与 `::push` 一样只允许用户手动调用。协议见 `system/commands/push.md`、`system/commands/pull.md` 与 `system/commands/pr.md`。

## 数据可信规范（本项目特有，派发子 Agent 时必须注入）

本站的生命线是数据真实性。所有涉及岗位数据的开发工作必须遵守：

1. **三级核验层级**照实标注：「已核验（逐字段）」「已核验（来源）」「已核验（关键字段）」；核对不到原文的字段不得填写，更不得依据机构类型、常见待遇或推测补写专业、学历、职责、薪资或优先条件。
2. **来源证据**：每条岗位记录必须保存来源页标题与可机器复核的原文片段，经 `npm run audit:jobs` 通过后才能进入前台数据；无法实际访问来源页时可用 `audit:jobs:offline` 只做结构检查，但不得据此宣称「已核验（逐字段）」。
3. **失效来源**：已下架、失效或只剩拟聘用公示的来源不再作为可投递岗位展示，转入历史或删除，按用户要求处理。
4. **分析标签与原文分离**：方向归类、市场分析等推断性标签必须与公告原文分开存储与标注。

---

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
