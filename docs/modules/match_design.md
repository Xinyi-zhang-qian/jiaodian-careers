# match 模块设计文档

> 全局契约引用 docs/design.md §4（契约 20、21）、§5；用户交互规格引用 docs/interaction.md §4（Header 导航）、§5a（/match 页逐控件规格）。本模块为第 3 轮新增（match-engine + match-ui 一个开发单元）。

# 1. 模块职责与边界

- 职责：①匹配引擎——画像↔岗位打分纯函数与逐条理由生成（权重集中定义（DEFAULT_WEIGHTS））；②画像管理——三类条目（教育经历/工作经历/技能特长）的增删编辑与 localStorage 持久化；③/match 页——画像编辑器、推荐列表（复用 JobCard + 理由标签）、组合筛选、空画像引导态、清空。
- 数据所有权：`src/lib/match.ts`（打分算法、权重常量与 Profile/MatchResult 类型）、`src/lib/use-profile.ts`（localStorage `jiaodian-profile` 读写）、`src/app/match/**`、`src/components/match/**`；Header 导航「岗位匹配」链接一行。
- 不负责：批次数据（detail-enrich）、既有页面逻辑、未核验字段的任何使用（打分依据限定见 docs/design.md §4 契约 21）。

# 2. 内部结构

```text
src/lib/match.ts              # matchProfile(profile, jobs, weights?) -> MatchResult[]；MATCH_WEIGHTS 权重常量；理由生成
src/lib/use-profile.ts        # useProfile() hook：读/写/增/删/清空 localStorage；仅导出 useProfile hook（画像增删经 hook 方法完成）
src/app/match/page.tsx        # /match 页（客户端组件）：画像编辑器 + 推荐列表 + 组合筛选
src/components/match/profile-editor.tsx   # 三组条目编辑器（含教育阶段下拉与自定义阶段输入）
src/components/match/recommend-list.tsx   # 推荐列表（匹配度 + 理由标签 + JobCard）
src/components/layout/header.tsx          # 导航首位加「岗位匹配」（一行）
```

模块间依赖方向：page → profile-editor / recommend-list / use-profile / match / data（getJobs 取全量目录）→ utils（REGIONS / ORG_TYPES / DISCIPLINES 枚举常量）。match.ts 不依赖 use-profile 与任何组件；use-profile 仅依赖 match.ts 的 Profile 类型。

# 3. 内部数据流

画像编辑 → useProfile 更新状态并同步写 localStorage → useMemo 触发 matchProfile 重算（纯本地、无网络）→ 组合筛选收敛 → 推荐列表渲染。

打分维度与权重（集中常量 `DEFAULT_WEIGHTS`，可调；教育/工作为高、技能/方向为中，和为 100）：

| 维度 | 权重 | 匹配对象 | 命中判定（全部为字面量包含，不构造正则） |
| --- | --- | --- | --- |
| 教育经历 | 35 | original_major_requirements 原文包含专业名 + 学历字段对照 | 专业名非空且岗位原文包含专业名 → 命中；专业名命中专业要求原文 → 全额；未直提时岗位学历字段与画像阶段别名（本科/硕士/博士）相符 → 半额。

理由生成：每条命中产出一行可读理由（格式「{画像条目} ↔ {岗位字段}」），按教育→工作→技能→方向顺序排列：

- `{阶段}·{专业} ↔ 专业要求原文`
- `工作经历·{岗位名} ↔ 岗位标题`、`{经历岗位名} ↔ 职能标签`
- `{技能} ↔ 技能标签`（required_skills）、`{技能} ↔ 优先技能标签`（preferred_skills）
- `{阶段}·{专业} ↔ 方向标签「{方向名}」`

结果排序：score 降序 → job.id 升序（稳定）；零命中岗位不进结果。空画像 → 空数组。纯函数不抛异常。

组合筛选（页面内 useMemo，不新增公共接口）：地区下拉命中语义与 `filterJobs` 一致（province 包含地区名；「其他地区」为不在六省市内的记录）；单位类型为精确枚举匹配；非枚举值按无筛选处理。

# 4. 内部数据结构

- `ProfileEducation`：`{ stage: string, major: string }`（均必填；stage 为「本科/硕士/博士」枚举或自定义文本，major 为专业名称；与契约 20 一致）。
- `ProfileWork`：`{ title: string }`（必填）。
- `Profile`：`{ education: ProfileEducation[], work: ProfileWork[], skills: string[] }`（契约 20 结构；定义于 match.ts，use-profile 引用）。
- `MatchResult`：`{ job: Job, score: number, reasons: string[] }`（score 为 0–100 整数）。
- `MatchWeights`：`{ education: number, work: number, skill: number, discipline: number }`；默认常量 `DEFAULT_WEIGHTS = { education: 30, work: 25, skill: 25, discipline: 20 }`（和为 100）。

画像增删语义（use-profile 导出的纯函数与 hook 共用）：

- 空输入由编辑器层禁用拦截（添加按钮 disabled）；删除按索引执行、越界静默；clearAll 回空画像。
- 删除按索引；索引越界静默返回原画像。
- clearAll 返回空画像。
- localStorage 读取：window 守卫（无 window 返回空画像）；JSON 解析失败或结构不合法按空画像处理（契约 20）；写入失败静默（与收藏同语义）。

# 5. 内部状态机

不适用（无状态组件 + localStorage 持久化）。
