# ::work

> 命令索引见 `system/command_reference.md`。本文件为 `::work` 的完整执行协议：模板分派规则 + 默认通用模板的编排协议。

---

## `::work [-模版] [@target1 @target2 ...] <custom prompt>`

基于 `@` 标注的目标（代码文件、文档、计划、问答归档）与自定义提示完成上下文感知的工作任务（写作、分析、文档修改等），输出到指定文件。支持 `-模版` 参数激活专用模板；不填写 `-模版` 时为默认通用模板（协议见本文件下文「默认通用模板」节）。

**`-模版` 可选值**：

| `-模版` | 模板协议文件 | 说明 |
|---|---|---|
| `-explore` | `system/worker/templates/explore.md` | 项目探索：无参数时基于代码重新生成本库 `docs/` 三份全局文档（需求/系统设计/用户交互设计）；`@路径` 时探索外部项目库，在 `workspace/{项目名}/` 生成该项目的需求、设计与交互文档 |
| `-research` | `system/worker/templates/research.md` | 通用调研（检索 fan-out → 资料归档 → 阅读 → 调研报告），产出到 `workspace/调研-YYYY-MM-DD-<主题>/` |
| `-algocheck` | `system/worker/templates/algocheck.md` | 算法正确性检查：核验算法在本库的实现位置与适用边界，仅在 GitHub 搜索可比开源实现做源码级对比（无可比实现时跳过并诚实留痕），产出检查报告到 `workspace/`；只检查与报告，不修复 |
| `-experiment` | `system/worker/templates/experiment.md` | 实验与数据分析：建立 `workspace/workreport_{时间戳}_{标题}/` 工作目录（data/script/result/temp/doc），设计并执行实验或数据分析，产出英文结果图与固定五章结构的中文最终报告（结果章含「逐图逐表解释」小节：每张结果表、每个同类型图组各配一段解释） |

**模板分派规则**（主 Agent 执行）：

1. 解析命令时提取可选 `-模版` 标记；若存在，验证为上表值之一，无效则报错中止并列出可选值。
2. 含有效 `-模版` 时：主 Agent Read 对应模板协议文件，严格按其中的编排协议执行。该模板的参数格式、输出路径规则、编排步骤、日志摘要以模板文件为权威源，本文件下文规则不再适用。
3. 无 `-模版` 时：按本文件下文「默认通用模板」节执行，子 Agent 协议为 `system/worker/procedure.md`。

**模板命令示例**：

```
::work -explore                                  # 基于代码重新生成本库 docs/ 三份全局文档
::work -explore @/home/user/AffordanceLLM        # 探索外部项目库
::work -explore @/path/projectA @/path/projectB 重点关注插件机制
::work -research 调研过去五年脑机接口在注意力解码上的进展
::work -research @docs/design.md 围绕本系统架构调研可用的插件机制方案
::work -algocheck 检查最短路径算法在零权边与不可达节点下的正确性
::work -algocheck @src/finance/ 检查金额分摊算法的总额守恒与舍入规则
::work -experiment 对比三种平滑参数对解码准确率的影响
::work -experiment @data/baseline.csv 分析近一年观测数据的季节分布
```

---

## 默认通用模板

**参数格式**（由主 Agent 使用 LLM 能力直接解析）：
- `@target`：可选，可重复。支持仓库相对路径形式：
  - `@<文件路径>`：任意源码或文档文件（如 `@src/main.py`、`@docs/design.md`）。
  - `@<目录路径>`：目录整体作为上下文（子 Agent 自行选择阅读其中有代表性的文件）。
  - `@qna/YYYY-MM-DD`、`@plans/...`、`@docs/...`：对应文档文件。
  - 最后一个 `@` 的 `workspace/` 下 `.md` 路径可作为输出目标。
- `<custom prompt>`：用户自定义工作指令，可包含复杂要求（例如在文档特定位置插入、改写某节、保持原有风格等）。

**输出路径确定规则**（由主 Agent 基于 LLM 理解后注入子 Agent）：

1. 若 prompt 中明确指定了输出文件路径（自然语言「写入 ...」或 `--out <path>`），使用该路径。
2. 否则，若 `@` 目标中包含 `workspace/` 下的 `.md` 文件路径，将**最后一个**该路径作为输出目标（覆盖写入）。
3. 否则，自动生成 `workspace/work_YYYY-MM-DD_HHMMSS.md`（`workspace/` 不存在时创建）。

**示例**：

```
::work @docs/requirements.md 请梳理出第一阶段涉及的所有接口清单
::work @src/acquisition/ 请为 RingBuffer 模块写一份使用说明
::work @workspace/notes/todo.md 请把今天讨论的三项任务整理进这份笔记
::work @docs/design.md --out workspace/api-summary.md 请汇总所有对外接口
```

**执行步骤**

**步骤 1 — 主 Agent 用 LLM 解析命令**：提取 `@targets`、自定义 prompt、输出文件路径，确定 `DATE` / `TIME`。

**步骤 2 — 主 Agent 解析目标为具体路径**：逐一确认路径存在；记录解析失败的目标并向用户报告；若有效目标为空且任务明显依赖上下文，中止执行。

**步骤 3 — 启动 worker 子 Agent**，注入固定上下文块：

```
ORIGINAL_COMMAND: ::work ...
DATE: YYYY-MM-DD
TIME: HH:MM:SS
OUTPUT_FILE: workspace/...md

CUSTOM_PROMPT: <用户自定义提示原文>

TARGETS:
  - type: file
    path: <仓库相对路径>
  - type: dir
    path: <仓库相对路径>
  - type: qna
    path: qna/YYYY-MM-DD.md
  ...

QNA_ARCHIVES:
  latest: qna/YYYY-MM-DD.md (或 null)
  previous: qna/YYYY-MM-DD.md (或 null)
```

**子 Agent 执行**：协议见 `system/worker/procedure.md`（阅读 QNA 归档 → 阅读目标 → 执行工作任务 → 写入 `OUTPUT_FILE` → 输出 `[WORK_DONE]` 信号）。

**步骤 4 — 主 Agent 汇总输出**：输出完成信号中的 `output_file` 与引用的目标列表。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录。默认通用模板：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 工作产物写入 {output_file} | 引用目标: [{target1}, {target2}, ...]
````

专用模板（`-explore` / `-research` / `-algocheck` / `-experiment`）的日志摘要以对应模板协议文件中的「日志摘要」字段为准。
