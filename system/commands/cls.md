# ::cls

> 命令索引见 `system/command_reference.md`。本文件为 `::cls` 的完整执行协议。

---

## `::cls` / `::cls --all`

`::cls`：仅重置 `status.md` —— `[Repository State]`、`[Current Phase]`、`[Phase History]`、`[Loop Cycle]`、`[Fast Baseline]` 与 `[Devlog Backlog]` 恢复为初始值（「（暂未设置）」/「（无）」），`[Project Goal]` 保留（属项目目标，不随 loop 状态清空）。`local.md` 不被本命令修改（其中的「远程配置」表与 worktree 清单保持原值）。注意：`system/devlog/` 下已存在的记录文件不随 `::cls` 删除——status 清空后 `::doc` 会以实际文件为准重建待追赶队列。

`::cls --all`：清空全部 loop 用户数据，将仓库还原为「只有系统文件与业务代码」的干净状态。执行前**必须向用户展示将删除的内容清单并获得明确确认**。

步骤：
1. `status.md` 重置为初始模板（`[Project Goal]` 保留，其余字段「（暂未设置）」/「（无）」）。
2. 清理遗留 worktree：`git worktree list` 中除主工作区外的全部 worktree 逐一 `git worktree remove`（有未提交变更时先向用户报告再处置），删除全部本地 `dev/*` 分支，清空 `local.md` 的「::dev Worktree 清单」为 `（无）`。
3. 删除 `docs/` 下全部内容（含 `docs/modules/`）。
4. 删除 `qna/` 下全部问答归档。
5. 删除 `plans/` 下全部计划（含 `current.md` 与日期归档）。
6. 删除 `workspace/` 下全部工作产物。
7. 删除 `system/devlog/` 下全部 fast 开发记录（未追赶的文档欠账一并丢弃，确认清单中须单独列出）。
8. 重建上述空目录。
9. **不**删除：系统文件（`AGENTS.md`、`local.md`、`README.md`、`system/` 其余部分）、业务源码、`.gitignore`、git 历史；`system_log.md` 保留并继续追加。
10. 输出重置摘要（各项删除的文件数）。

---

## 运行日志

本命令执行完毕后，必须向仓库根目录 `system_log.md` 追加一条记录：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 已清空 Repository State 与 Current Phase
````

`::cls --all` 时摘要为：

````markdown
## [YYYY-MM-DD HH:MM:SS] {命令原文}
- 已清空全部 loop 用户数据 | 删除: docs {N} 个文件, qna {N}, plans {N}, workspace {N}, devlog {N}
````
