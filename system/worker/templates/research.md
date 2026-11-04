# ::work -research 模板（通用调研）— 主 Agent 编排

> 本文件为 `::work -research` 的主 Agent 编排协议；各子 Agent 协议在同目录独立文件中（见下表），由主 Agent 在派发时指示子 Agent 自行 Read。
> 由 `system/commands/work.md` 模板分派进入；写作规范与语言风格遵循 `AGENTS.md`。

---

## 模板目标

根据用户的调研目的（`CUSTOM_PROMPT`），经三个阶段产出一份调研报告：

1. **阶段 1 检索调研**：按主题拆分检索方向，fan-out 派发搜索子 Agent 并行探索网络资料（WebSearch / WebFetch）与本库资料，整理为相关类别；主 Agent 合并去重后产出检索草稿（含资料空白分析与资料获取计划）。
2. **阶段 2 资料归档**：主 Agent 按获取计划将关键资料落盘到 `workspace/调研-YYYY-MM-DD-<主题>/` 的类别子目录（文件下载 / 网页摘要 / 本库资料引用或复制）；产出资料报告（成功/失败/原因）。
3. **阶段 3 阅读与报告**：阅读前两阶段获得的直接相关资料，派遣最终报告子 Agent 生成调研报告。

**全程约束**：任何并行派发遵守 `AGENTS.md` 全局并行调用限制，每批全部返回后再发下一批。

**子 Agent 协议分派表**：

| 子 Agent 角色 | 协议文件 | 完成信号 |
|---|---|---|
| 搜索（阶段 1） | `system/worker/templates/research_searcher.md` | `[RESEARCH_SEARCH_DONE]` |
| 阅读（阶段 3a） | `system/worker/templates/research_reader.md` | `[RESEARCH_READ_DONE]` |
| 报告（阶段 3b） | `system/worker/templates/research_reporter.md` | `[WORK_DONE]` |

---

## 参数

- `CUSTOM_PROMPT`：**必填**。用户的调研目的 / 调研问题。缺失时报错中止（`-research` 模板必须有明确调研目的）。
- `@targets`：可选。种子上下文，复用 `::work` 目标形式（`@<文件路径>` / `@<目录路径>` / `@qna/YYYY-MM-DD` 等仓库相对路径），在阶段 1 拆方向与检索时作为线索。

## 阶段 0 — 准备

1. 从 `CUSTOM_PROMPT` 提炼 `<主题>`：简短中文主题词（不超过 20 字），去除文件系统非法字符（`/ \ : * ? " < > |`）。
2. 确定 `RESEARCH_DIR = workspace/调研-{YYYY-MM-DD}-{主题}/`。已存在则沿用并在已有产物基础上续跑（不清空）；不存在则创建。
3. 解析 `@targets` 为具体路径，逐一确认存在；记录无效目标并向用户报告。
4. **拆分检索方向**：按调研目的拆为 4-10 个检索方向（例如核心概念与原理、关键方法或实现方案、应用与实证、综述/对比资料、相邻领域交叉等维度），为每方向明确检索关键词（按主题需要，中英文均可）与预期资料类型（官方文档 / 论文 / 技术博客 / 源码仓库 / 标准规范等）。

## 阶段 1 — 检索调研（fan-out）

1. 每个检索方向派发 1 个搜索子 Agent（即每方向典型 1 个、总数 4-10 个），分批并行派发。
2. 子 Agent prompt 注入：

```
ORIGINAL_COMMAND: ::work -research ...
CUSTOM_PROMPT: <用户调研目的原文>
DIRECTION: {检索方向说明与关键词}
SEED_TARGETS: [{种子上下文路径列表，可为空}]
启动指令：Read system/worker/templates/research_searcher.md 并按其协议执行
```

3. 全部返回后，主 Agent 合并各方向草稿：
   - **跨稿去重**：按 URL / 标题 归并，同一条目只保留一份（合并各方向的相关性理由）。
   - **归类**：每条资料归入一个类别；类别集合由主 Agent 按调研目的归纳（3-8 个），类别名作为阶段 2 的子目录名。
   - 产出**资料空白分析**（哪些子方向检索结果稀薄、哪些关键资料无法确认存在）与**资料获取计划**：逐条给出标题、来源链接、获取方式预判（`curl` 下载 / WebFetch 网页摘要 / 本库引用或复制）、优先级建议。
4. 写入 `{RESEARCH_DIR}/调研草稿.md`，结构：

```markdown
# 检索调研草稿：{主题}

> 调研目的：{CUSTOM_PROMPT 原文}
> 日期：{YYYY-MM-DD}

## 检索方向
{方向清单与关键词}

## 分类资料列表
### {类别 1}
- 《{标题}》 | URL | 来源类型 | 核实级别 | 相关性理由 | 获取方式预判 | [本库已有: {路径}]
### {类别 2}
...

## 排除与审计说明
{不收录的类别明示、无法核实即不收录、排除清单留痕、同名/误配风险标注}

## 资料空白分析
...

## 资料获取计划
{逐条：标题 / 来源链接 / 获取方式预判 / 优先级}
```

## 阶段 2 — 资料归档（主 Agent 直接执行）

1. 按资料获取计划逐条处理，并行分批执行：
   - **文件下载**：`curl -L --fail -o "{RESEARCH_DIR}/{类别}/{文件名}" "{URL}"`（PDF、附件等；文件名按内容推断并去非法字符）。
   - **网页摘要**：WebFetch 提取页面要点，以 md 落盘 `{RESEARCH_DIR}/{类别}/{标题}.md`，头部注明来源 URL 与提取日期。
   - **本库已有**：直接记录引用路径，或 `cp` 复制到 `{RESEARCH_DIR}/{类别}/`。
   - 目录不存在时先创建；获取不设时间限制，失败如实记录。
2. 写入 `{RESEARCH_DIR}/资料报告.md`，结构：

```markdown
# 资料报告：{主题}

> 调研目录：{RESEARCH_DIR}
> 日期：{YYYY-MM-DD}

## 成功归档（{N} 条）
- 《{标题}》 | 类别: {类别} | 路径: {RESEARCH_DIR}/{类别}/{文件名} | 方式: {下载 / 网页摘要}

## 引用本库（{M} 条）
- 《{标题}》 | 类别: {类别} | 引用自: {仓库内路径}（或已复制）

## 获取失败（{K} 条）
- 《{标题}》 | 原因: {链接失效 / 需要登录或付费墙 / 反爬阻挡 / 低置信不采用} | {补充说明与人工获取建议}

## 统计
成功 {N} | 引用本库 {M} | 失败 {K}
```

## 阶段 3 — 阅读与报告

**3a 阅读 fan-out**：

1. 从已就位资料（归档成功 + 引用本库）中筛选与调研目的**直接相关**者（依据阶段 1 相关性理由与摘要），每个阅读子 Agent 负责一篇，分批并行派发。
2. 子 Agent prompt 注入：

```
ORIGINAL_COMMAND: ::work -research ...
CUSTOM_PROMPT: <用户调研目的原文>
TARGET_FILE: {RESEARCH_DIR}/{类别}/{文件名}（或本库引用路径）
RESEARCH_DIR: {RESEARCH_DIR}
启动指令：Read system/worker/templates/research_reader.md 并按其协议执行
```

3. 笔记写入 `{RESEARCH_DIR}/阅读笔记/{标题}.md`。

**3b 最终调研报告**：

1. 派遣 1 个最终报告子 Agent，注入：

```
ORIGINAL_COMMAND: ::work -research ...
CUSTOM_PROMPT: <用户调研目的原文>
RESEARCH_DIR: {RESEARCH_DIR}
DATE: YYYY-MM-DD
启动指令：Read system/worker/templates/research_reporter.md 并按其协议执行
```

2. 产物：`{RESEARCH_DIR}/调研报告.md`（结构固定，见 `research_reporter.md`）。
3. 返回后主 Agent 向用户汇总输出：报告路径、调研结论一段话摘要、统计（检索命中 / 归档成功 / 引用本库 / 失败 / 阅读篇数）。

## 日志摘要

`调研报告写入 {RESEARCH_DIR}/调研报告.md | 检索命中 {N} | 归档成功 {N} | 引用本库 {M} | 失败 {K}`
