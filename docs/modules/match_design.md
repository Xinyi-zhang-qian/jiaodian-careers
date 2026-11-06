# match 模块设计文档

> 全局契约引用 docs/design.md §4（契约 20、21）、§5；本模块为第 3 轮新增（match-engine + match-ui 一个开发单元）。

# 1. 模块职责与边界

- 职责：①匹配引擎——画像↔岗位打分纯函数与逐条理由生成（权重集中定义）；②画像管理——三类条目（教育经历/工作经历/技能特长）的增删编辑与 localStorage 持久化；③/match 页——画像编辑器、推荐列表（复用 JobCard + 理由标签）、组合筛选、空画像引导态、清空。
- 数据所有权：`src/lib/match.ts`（打分算法与权重）、`src/lib/use-profile.ts`（localStorage `jiaodian-profile` 读写）、`src/app/match/**`、`src/components/match/**`；Header 导航「岗位匹配」链接一行。
- 不负责：批次数据（detail-enrich）、既有页面逻辑、未核验字段的任何使用。

# 2. 内部结构

```text
src/lib/match.ts              # matchProfile(profile, jobs) -> MatchResult[]；权重常量；理由生成
src/lib/use-profile.ts        # useProfile() hook：读/写/增/删/清空 localStorage
src/app/match/page.tsx        # /match 页（客户端组件）
src/components/match/profile-editor.tsx   # 三组条目编辑器
src/components/match/recommend-list.tsx   # 推荐列表（JobCard + 理由标签）
src/components/layout/header.tsx          # 导航加「岗位匹配」（一行）
```

# 3. 内部数据流

画像编辑 → useProfile 更新 localStorage → useMemo 触发 matchProfile 重算（纯本地、无网络）→ 推荐列表渲染。打分维度与权重（集中常量，可调）：

| 维度 | 匹配对象 | 权重基准 |
| --- | --- | --- |
| 教育经历 | 岗位 original_major_requirements 原文包含专业名（阶段与学历字段对照加权） | 高 |
| 工作经历 | 岗位 title 与 job_functions 包含岗位名关键词 | 高 |
| 技能特长 | 岗位 required_skills/preferred_skills 精确或包含匹配 | 中 |
| 方向契合 | 画像专业映射的平台方向（DISCIPLINES 关键词）命中 platform_disciplines | 中 |

理由生成：每个命中的维度产出一行理由（「{画像条目} ↔ {岗位字段}」）；得分为加权和（0–100 归一化）；零命中岗位不进推荐列表。

# 4. 内部数据结构

- Profile：`{ education: [{ stage: string, major: string }], work: [{ title: string }], skills: string[] }`（与契约 20 一致）。
- MatchResult：`{ job: Job, score: number, reasons: string[] }`。

# 5. 内部状态机

不适用（无状态组件 + localStorage 持久化）。
