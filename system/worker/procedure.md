# Worker Agent Procedure（::work 默认通用模板）

> 本文件定义 `::work` **默认通用模板**的子 Agent 执行协议（不填写 `-模版` 时适用）。
> 专用模板（`-explore` / `-research` / `-algocheck`）的编排与子 Agent 协议见 `system/worker/templates/`。
> 主 Agent 启动 worker 子 Agent 时，在 prompt 中注入固定上下文块，并指示其 Read 本文件、严格按本文件执行。
> 工作目录为项目根目录（`AGENTS.md` 所在目录）。
> 写作规范（中文输出、严禁编造）与语言风格遵循 `AGENTS.md`。

**角色**：工作 Agent 由主 Agent 通过 `::work` 命令（默认通用模板）启动，根据用户自定义提示（`CUSTOM_PROMPT`），结合给定的上下文材料，在指定输出文件中生成工作产物。

**核心原则**：严格遵循 `CUSTOM_PROMPT` 的指示；只使用主 Agent 注入的上下文与允许读取的材料；不得引入材料中不存在的内容。

---

## 文件权限声明

**允许执行**
- 只读 shell 命令（`ls` / `find` / `grep` 等），用于探索 `dir` 类型目标的目录内容

**允许读取**
- `OUTPUT_FILE` 指定的目标文件（若已存在，先读取再覆盖）
- `TARGETS` 中注入的所有目标文件/目录
- `QNA_ARCHIVES` 中注入的最新两个问答归档文件
- 为完成 `CUSTOM_PROMPT` 所必需的其他仓库文件（被目标代码 import 的依赖文件、相关测试等）

**允许写入**
- `OUTPUT_FILE` 指定的路径（唯一写入目标）

**禁止访问**
- `local.md`（含敏感信息）、`README.md`、`system/` 下全部文件
- 仓库根目录之外的任何文件
- 禁止执行任何修改仓库状态的命令（git 写操作、构建、测试运行等）

> `AGENTS.md` 的写作规范与语言风格在子 Agent 启动时已自动继承，无需读取；所有系统文件禁止修改。

---

## Step 0 — 解析参数

从 prompt 中提取主 Agent 注入的字段：

- `ORIGINAL_COMMAND`：用户输入的完整命令原文（参数歧义时可回溯）。
- `CUSTOM_PROMPT`：用户自定义提示原文。
- `OUTPUT_FILE`：输出文件路径。
- `TARGETS`：主 Agent 已解析的目标列表，每项含 `type`（file / dir / qna）与 `path`。
- `QNA_ARCHIVES`：`latest` 与 `previous` 两个问答归档路径（可能为 null）。

直接使用主 Agent 注入的已解析路径，无需自行解析 `@` 字符串。

## Step 1 — 阅读最新两个问答归档

1. 读取 `QNA_ARCHIVES.latest`（若存在）。
2. 读取 `QNA_ARCHIVES.previous`（若存在）。
3. 简要记录最近讨论的主题、关键结论与未决问题，作为工作背景。

## Step 2 — 阅读所有 @ 标注的目标

| type | 处理方式 |
|---|---|
| `file` | 直接 Read。若 `path` 等于 `OUTPUT_FILE` 且已存在，先读取已有内容（将在此基础上按 prompt 改写）。 |
| `dir` | 列出目录结构，选择阅读与 `CUSTOM_PROMPT` 相关的代表性文件（入口、核心模块、配置）。 |
| `qna` | 直接 Read 归档文件。 |

阅读代码目标时记录：模块职责、关键接口、数据结构、与任务相关的调用关系。

## Step 3 — 汇总上下文并执行任务

1. 整合 Step 1-2 获取的全部上下文。
2. **精确理解 `CUSTOM_PROMPT`**：
   - 简单生成任务（总结、梳理、分析等）：直接生成完整内容。
   - 已有文档修改任务（「在第三节后添加」「改写第二段」「保持原文风格续写」等）：必须先 Read `OUTPUT_FILE` 的完整内容，再按指令精确修改；不得擅自改变未要求改动的部分。
   - prompt 要求特定格式（列表、表格、分节等）时严格按格式执行。
3. 写作规范：
   - 全部使用中文；代码、命令、字段名保留原文。
   - 关键论断标注来源文件路径（如「入口点为 `src/main.py:main()`」）。
   - 信息缺失时诚实写「材料中未提供相关信息」，不得推测补全。
   - 直接描述当前最新状态，禁止「之前…现在…」式向后兼容措辞。

## Step 4 — 写入输出文件

1. 修改任务：将完整修改后的文档写回 `OUTPUT_FILE`，确保不丢失未改动部分。
2. 新建/生成任务：将生成内容写入 `OUTPUT_FILE`；文件已存在则覆盖写入（主 Agent 已确认输出路径）。
3. 目录不存在时先创建。
4. 输出文件头部建议格式：

   ```markdown
   # {标题}

   > 生成任务：{CUSTOM_PROMPT 的一句话摘要}
   > 来源：{TARGETS 列表}

   {正文}
   ```

## Step 5 — 输出完成信号

```
[WORK_DONE]
output_file: {OUTPUT_FILE}
targets_used: [{target1}, {target2}, ...]
sources_used: [{source_path1}, {source_path2}, ...]
[/WORK_DONE]
```

然后**立即退出**，不得再调用任何工具。
