# ::ask

> 命令索引见 `system/command_reference.md`。本文件为 `::ask` 的完整执行协议。

---

## `::ask [@target1 @target2 ...]? <question>`

问答命令。回答问题并归档至 `qna/YYYY-MM-DD.md`。`::ask` 仅用于问答与归档：除写入问答归档外，**不得执行任何脚本、命令或文件修改**来回答问题；需要引用代码/数据时只做读取和说明。

**参数格式**（由主 Agent 使用 LLM 能力直接解析）：
- `@target`：可选，可重复。支持仓库相对路径形式：`@<文件或目录路径>`（如 `@src/main.py`、`@docs/design.md`）、`@qna/YYYY-MM-DD`（指定问答归档）、`@plans/...`、`@docs/...`。
- `<question>`：问题文本。

**示例**：

```
::ask 当前系统的模块划分依据是什么？
::ask @docs/design.md Decoder 模块的在线离线统一设计是怎么实现的？
::ask @qna/2026-08-29 昨天关于发布流程的结论是什么？
```

**归档文件**：
- 路径：`qna/YYYY-MM-DD.md`（目录不存在时创建）。
- 同一日期的多个问题追加到同一文件；当日第一条问答应参考前一日的问答文件。
- 文件结构：

```markdown
# QNA YYYY-MM-DD

## [HH:MM:SS] 问题原文

**相关材料**:
- {路径1}
- {路径2}

### 回答

{答案正文}

---
```

**执行步骤**

**步骤 1 — 主 Agent 用 LLM 解析命令**：提取 `@targets` 与问题文本，确定 `DATE` / `TIME` 与 `QNA_FILE`。

**步骤 2 — 主 Agent 解析目标为具体路径**：逐一确认路径存在；记录无效目标并向用户报告。

**步骤 3 — 启动 asker 子 Agent**，注入固定上下文块：

```
ORIGINAL_COMMAND: ::ask ...
DATE: YYYY-MM-DD
TIME: HH:MM:SS
QNA_FILE: qna/YYYY-MM-DD.md
QUESTION: <问题原文>

TARGETS:
  - type: file
    path: <仓库相对路径>
  ...

QNA_ARCHIVES:
  latest: qna/YYYY-MM-DD.md (或 null)
  previous: qna/YYYY-MM-DD.md (或 null)
```

**子 Agent 执行**：asker 子 Agent 按本文件下文「子 Agent 执行协议（asker）」一节执行（读取历史问答 → 加载上下文 → 生成答案 → 追加归档 → 输出 `[ASK_DONE]` 信号）。

问题简单且无 `@` 目标时，主 Agent 可直接回答并自行归档，不启动子 Agent。

**步骤 4 — 主 Agent 汇总输出**：输出答案正文与归档路径。

---

## 子 Agent 执行协议（asker）

> 主 Agent 启动 asker 子 Agent 时，在 prompt 中注入固定上下文块，并指示其 Read 本文件、严格按本节执行。
> 工作目录为项目根目录（`AGENTS.md` 所在目录）。
> 写作规范（中文输出、严禁编造）与语言风格遵循 `AGENTS.md`。

**角色**：问答 Agent 由主 Agent 通过 `::ask` 命令启动，回答用户问题（`QUESTION`），并把问答追加到归档文件（`QNA_FILE`）。

**核心原则**：`::ask` 仅用于问答与归档——除写入 `QNA_FILE` 外，不得执行任何脚本、构建、测试或对仓库的任何修改；需要引用代码/数据时只做读取和说明。答案必须基于实际读取到的材料，严禁编造。

### 文件权限声明

**允许执行**
- 只读 shell 命令（`ls` / `find` / `grep` 等），用于定位相关文件

**允许读取**
- `TARGETS` 中注入的所有目标文件
- `QNA_ARCHIVES` 中注入的最新两个问答归档文件
- `QNA_FILE`（若已存在，读取以追加）
- 为回答问题所必需的其他仓库文件（源码、文档、配置）

**允许写入**
- `QNA_FILE` 指定的路径（唯一写入目标，追加模式）

**禁止访问/修改**
- `local.md`（含敏感信息）
- 禁止执行任何修改仓库状态的命令（git 写操作、构建、测试运行、包安装等）
- 除 `QNA_FILE` 外禁止写入任何文件

### Step 0 — 解析参数

从 prompt 中提取主 Agent 注入的字段：

- `ORIGINAL_COMMAND`：用户输入的完整命令原文。
- `DATE` / `TIME`：执行时间戳。
- `QNA_FILE`：问答归档路径（`qna/YYYY-MM-DD.md`）。
- `QUESTION`：问题原文。
- `TARGETS`：主 Agent 已解析的目标列表，每项含 `type` / `path`。
- `QNA_ARCHIVES`：`latest` 与 `previous` 两个问答归档路径（可能为 null）。

### Step 1 — 阅读历史问答

读取 `QNA_ARCHIVES.latest` 与 `QNA_ARCHIVES.previous`（若存在），记录与当前问题相关的已有结论，避免重复回答、保持结论一致；若新结论与历史问答冲突，在答案中明确指出并说明依据。

### Step 2 — 加载上下文

1. Read `TARGETS` 中的全部目标文件。
2. 若问题涉及代码行为，阅读相关源码与测试，以代码为准回答。
3. 材料不足以回答的部分，诚实写「现有材料未提供相关信息」，不得推测补全。

### Step 3 — 生成答案并追加归档

1. 组织答案：中文；代码、命令、字段名保留原文；关键论断标注来源文件路径。
2. 追加到 `QNA_FILE`（文件不存在时先创建，首行 `# QNA YYYY-MM-DD`），格式：

   ```markdown
   ## [HH:MM:SS] {问题原文}

   **相关材料**:
   - {路径1}
   - {路径2}

   ### 回答

   {答案正文}

   ---
   ```

### Step 4 — 输出完成信号

```
[ASK_DONE]
qna_file: {QNA_FILE}
answer_summary: {一句话答案摘要}
materials_used: [{path1}, {path2}, ...]
[/ASK_DONE]
```

然后**立即退出**，不得再调用任何工具。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 归档至 qna/YYYY-MM-DD.md | 相关材料: [{target1}, ... 或 无]
````
