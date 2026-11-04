# ::work -explore 模板（项目探索）

> 本文件为 `::work -explore` 的完整协议：「主 Agent 编排」节由主 Agent 执行；「Explorer 子 Agent 协议」节由子 Agent 遵循。
> 由 `system/commands/work.md` 模板分派进入；写作规范与语言风格遵循 `AGENTS.md`。

---

## 主 Agent 编排

`::work -explore [@<文件夹路径> ...] [<补充关注点>]`

探索代码并生成**需求文档、系统设计文档与用户交互设计文档**三份库级文档。本模板不写新文档模板，直接复用 `::req`（`system/commands/req.md`）与 `::design`（`system/commands/design.md`）的协议与输出模板（设计文档的两个模板分别对应 `design.md` 与 `interaction.md`）。

两种形态：

- **`::work -explore`（无参数，对本仓库）**：梳理当前仓库的代码与文档现状，直接生成/覆盖 `docs/requirements.md`、`docs/design.md` 与 `docs/interaction.md`。本形态同时是这三份文档的**自动更新**机制：每次对仓库进行修改后，自动按本协议更新（`docs/design.md` 与 `docs/interaction.md` 必更新，需求有变化时同步 `docs/requirements.md`），无需用户手动触发。二次开发（有代码无文档）场景下由 `::init` 首次自动调用的，也属于本形态。任何工作执行前（不仅新会话）必须先读 `docs/design.md`（若存在）。
- **`::work -explore @<文件夹路径> [...]`**：将每个 `@` 标注的文件夹视为一个独立的外部项目库，深度阅读后在 `workspace/{项目名}/` 下生成**该项目**的 `requirements.md`、`design.md` 与 `interaction.md` 三份文档（项目名取文件夹 basename，空格与特殊字符替换为 `-`）。本仓库自身的 `docs/` 不受影响。补充关注点（可选 custom prompt）作为 `EXTRA_FOCUS` 注入子 Agent；文档的章节结构与深度仍由本文件固定规范。

**权限限制**：
- 无参数形态：可读取一切资料与代码，只写 `docs/requirements.md`、`docs/design.md`、`docs/interaction.md` 与 `system_log.md`。
- `@路径` 形态：严禁修改目标项目库中的任何文件；只写 `workspace/{项目名}/` 下的三份文档与 `system_log.md`。

**示例**：

```
::work -explore
::work -explore @/home/user/some-project
::work -explore @../projectA @../projectB 重点关注插件机制
```

**执行步骤（无参数形态，主 Agent 直接执行）**

1. 按 `::req` 协议生成/覆盖 `docs/requirements.md`：以代码现状为真实行为基准（已实现的写实现状，仅有计划未实施的标注「已计划/未实施」），结合既有文档与 `qna/` 归档。
2. 按 `::design` 协议生成/覆盖 `docs/design.md` 与 `docs/interaction.md`：架构契约、模块划分与职责边界、模块间数据流以代码为准校准；交互文档以代码中真实存在的 CLI/GUI 为准（代码无 GUI 则注明「本项目不提供 GUI」）；两份文档写完后按 `::design` 的「设计文档一致性检查」核对一致性。
3. 二次开发场景下，文档中应显式包含复用分析：哪些模块可直接复用、哪些需要改造、哪些应废弃。
4. 完成后向用户报告三份文档的要点摘要。全自动流程（如 `::init` 二次开发分支）中跳过批准等待，由后续需求分析阶段与用户迭代。

**执行步骤（@路径形态，子 Agent 编排）**

1. 主 Agent 解析并校验全部 `@` 文件夹路径（必须存在且为文件夹）；无效目标向用户报告，有效目标为空则中止。
2. 每个有效目标启动一个 explorer 子 Agent，注入固定上下文块：

   ```
   ORIGINAL_COMMAND: ::work -explore ...
   DATE: YYYY-MM-DD
   TIME: HH:MM:SS
   PROJECT_ROOT: {目标文件夹绝对路径}
   PROJECT_NAME: {规范化项目名}
   OUTPUT_DIR: workspace/{项目名}/
   EXTRA_FOCUS: {补充关注点 或 null}
   ```

   并行调度遵守 `AGENTS.md` 全局并行调用限制，等待该批全部返回后再发起下一批。

3. 子 Agent 执行：explorer 子 Agent 按本文件下文「Explorer 子 Agent 协议」一节执行（阅读项目全貌 → 按需求/设计两份模板成文 → 写入 `OUTPUT_DIR` → 输出 `[EXPLORE_DONE]` 信号）。
4. 主 Agent 汇总各项目的完成信号与无效目标清单。

**日志摘要**：`形态: {本库/外部项目库} | 文档写入 [{路径1}, ...] | 无效目标: [{...} 或 无]`

---

## Explorer 子 Agent 协议

> 主 Agent 启动 explorer 子 Agent 时，在 prompt 中注入固定上下文块，并指示其 Read 本文件、严格按本节执行。
> 工作目录为当前仓库根目录（`AGENTS.md` 所在目录）。

**角色**：项目探索 Agent 由主 Agent 通过 `::work -explore @<文件夹>` 命令启动，深度阅读 `PROJECT_ROOT` 指定的外部项目库，为其生成**需求文档、系统设计文档与用户交互设计文档**三份库级文档，写入当前仓库的 `OUTPUT_DIR`（`workspace/{项目名}/`）。

**核心原则**：以项目当前真实状态为基准（代码为准）；已实现 → 写实现状；仅有计划未实施 → 明确标注「已计划/未实施」；严禁编造代码中不存在的内容。

### 文件权限声明

**允许执行**
- 只读 shell 命令（`ls` / `find` / `grep` / `wc` 等），用于目录扫描与规模统计

**允许读取**
- `PROJECT_ROOT` 下的**一切**文件（README、配置、源码、测试、文档、脚本等）
- 当前仓库的 `system/commands/req.md` 与 `system/commands/design.md`（仅读取其中的「输出文档模板」各节作为成文模板，以及 `design.md` 的「规格深度与裁剪规则」节作为深度口径——按真实实现成文，未知项诚实标注「项目未提供相关信息」，不得为满足规格门槛编造代码中不存在的功能）
- `OUTPUT_DIR` 下已存在的同名文档（覆盖前无需保留任何内容）

**允许写入**
- `OUTPUT_DIR` 下的 `requirements.md`、`design.md` 与 `interaction.md`（仅此三个写入目标）

**禁止访问/修改**
- `PROJECT_ROOT` 之外的读取应限于理解项目所必需的系统级信息（如已安装依赖版本）
- **严禁修改 `PROJECT_ROOT` 下的任何文件**（含格式化、重命名、删除、创建）
- 除上述两个模板文件外，当前仓库的系统文件（`AGENTS.md`、`local.md`、`system/` 其他文件）与本命令无关，不得读写

### Step 0 — 解析参数

从 prompt 中提取主 Agent 注入的字段：

- `ORIGINAL_COMMAND`：用户输入的完整命令原文。
- `DATE` / `TIME`：执行时间戳。
- `PROJECT_ROOT`：目标项目库的根目录绝对路径。
- `PROJECT_NAME`：规范化项目名。
- `OUTPUT_DIR`：输出目录（`workspace/{PROJECT_NAME}/`）。
- `EXTRA_FOCUS`：补充关注点（可能为 null）。非 null 时在 Step 2 阅读与 Step 3 成文中对该主题给予额外深度，但不改变文档结构。

### Step 1 — 项目全貌扫描

1. 列出 `PROJECT_ROOT` 的目录结构（忽略 `.git/`、`node_modules/`、`__pycache__/`、`*.egg-info/`、虚拟环境目录等噪声目录）。
2. 统计项目规模：主要语言、源码文件数、入口点位置。
3. 识别项目类型（应用 / 库 / 脚本集 / 文档库等），据此裁剪后续文档章节。

### Step 2 — 深度阅读

按以下优先级阅读（大文件可先读关键段落，但核心模块必须读通）：

| 优先级 | 信息源 | 提供的内容 |
|---|---|---|
| 1 | `README*` / 文档目录 | 项目定位、安装、使用方式（用户视角） |
| 2 | 配置与依赖清单（`pyproject.toml` / `requirements*.txt` / `package.json` / `Cargo.toml` / `CMakeLists.txt` 等） | 依赖与版本、构建方式、入口点声明 |
| 3 | 入口代码与核心模块源码 | 系统的真实行为（以代码为准校准文档） |
| 4 | 测试目录 | 验证方式、预期行为边界 |
| 5 | `AGENTS.md` / `docs/` / `plans/` 等开发文档（若存在） | 设计意图、决策背景 |

阅读时记录：项目定位与需求（从代码行为反推）、模块职责划分、模块间调用关系、关键数据结构、对外接口（CLI / API / 文件产出）、**可复用资产清单**（哪些模块可直接复用、哪些需要改造、哪些应废弃——二次开发场景重点关注）。

### Step 3 — 按模板成文（三份文档）

读取当前仓库 `system/commands/req.md` 的「输出文档模板」节与 `system/commands/design.md` 的「输出文档模板一/二」节，分别以它们为骨架撰写：

1. `{OUTPUT_DIR}/requirements.md`：该项目的软件需求规格说明（从代码与文档反推需求；用户角色、功能需求、架构选择（用户决策层）、性能约束、验收目标）。
2. `{OUTPUT_DIR}/design.md`：该项目的软件总体设计说明（架构决策与契约、模块划分与职责边界、模块间行为与数据流、测试架构概览、架构验收标准）。
3. `{OUTPUT_DIR}/interaction.md`：该项目的用户交互设计说明（以代码中真实存在的 CLI/GUI 为准，逐命令/逐控件含预期输入、预期输出、边界检查与错误处理；无 GUI 则按模板注明「本项目不提供 GUI」）。

写作要求：
- 三份文档头部注明：`> 项目路径：{PROJECT_ROOT}`、`> 生成时间：{DATE} {TIME}（::work -explore 生成，重复执行时整体覆盖）`。
- 全部使用中文；代码、命令、字段名保留原文。
- 关键论断标注来源文件路径（如「入口点为 `src/main.py:main()`」）。
- 按项目类型裁剪章节：某章无内容可写时保留章节标题并注明原因（探索产物的「开发轮次规划」「承接被中断的上轮开发」两章（仅存在于设计文档模板）注明「不适用：本文档为代码现状梳理」）；禁止为凑齐章节编造内容。
- 信息缺失时诚实写「项目未提供相关信息」，不得推测补全。
- 篇幅以「足够支撑继续开发」为准，不设上限，但避免逐行复述源码。

### Step 4 — 覆盖写入输出文件

1. 将三份文档分别写入 `{OUTPUT_DIR}/requirements.md`、`{OUTPUT_DIR}/design.md` 与 `{OUTPUT_DIR}/interaction.md`；目录不存在时先创建。
2. 若文件已存在，**整体覆盖**（不续写、不保留旧内容）。

### Step 5 — 输出完成信号

```
[EXPLORE_DONE]
output_dir: {OUTPUT_DIR}
files: [requirements.md, design.md, interaction.md]
project_root: {PROJECT_ROOT}
summary: {一句话项目摘要（类型、主要语言、规模）}
[/EXPLORE_DONE]
```

然后**立即退出**，不得再调用任何工具。
