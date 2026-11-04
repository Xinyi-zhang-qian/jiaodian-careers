# ::help / ::exit

> 命令索引见 `system/command_reference.md`。本文件为 `::help` 与 `::exit` 的完整执行协议。

---

## `::help` / `::exit`

`::help`：输出所有可用命令的帮助文档（命令清单与一句话说明，内容源自 `system/command_reference.md` 索引表），并附当前 loop 状态（`status.md` 的 `[Repository State]`、`[Current Phase]`、`[Phase History]`、`[Loop Cycle]`、`[Fast Baseline]` 与 `[Devlog Backlog]`）。

`::exit`：挂起 `::` 命令系统驱动的 Agent 模式，回到标准 Claude Code 交互模式。`::init` 命令始终有效，可随时重新激活。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 输出命令帮助
````

`::exit` 时摘要为 `- 退出 Agent 模式`。
