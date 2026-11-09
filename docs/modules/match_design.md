# match 模块设计文档

> 全局契约引用 docs/design.md §4（契约 20、21）、§5；用户交互规格引用 docs/interaction.md §4（Header 导航）、§5a（/match 页逐控件规格）。本模块为第 3 轮新增（match-engine + match-ui 一个开发单元）。

# 1. 模块职责与边界

- 职责：①匹配引擎——画像↔岗位打分纯函数与逐条理由生成（权重集中定义）；②画像管理——三类条目（教育经历/工作经历/技能特长）的增删编辑与 localStorage 持久化；③/match 页——画像编辑器、推荐列表（复用 JobCard + 理由标签）、组合筛选、空画像引导态、清空。
- 数据所有权：`src/lib/match.ts`（打分算法、权重常量与 Profile/MatchResult 类型）、`src/lib/use-profile.ts`（localStorage `jiaodian-profile` 读写）、`src/app/match/**`、`src/components/match/**`；Header 导航「岗位匹配」链接一行。
- 不负责：批次数据（detail-enrich）、既有页面逻辑、未核验字段的任何使用（打分依据限定见 docs/design.md §4 契约 21）。

# 2. 内部结构

```text
src/lib/match.ts              # matchProfile(profile, jobs, weights?) -> MatchResult[]；MATCH_WEIGHTS 权重常量；理由生成
src/lib/use-profile.ts        # useProfile() hook：读/写/增/删/清空 localStorage；导出画像增删纯函数与解析函数（供测试与复用）
src/app/match/page.tsx        # /match 页（客户端组件）：画像编辑器 + 推荐列表 + 组合筛选
src/components/match/profile-editor.tsx   # 三组条目编辑器（含教育阶段下拉与自定义阶段输入）
src/components/match/recommend-list.tsx   # 推荐列表（匹配度 + 理由标签 + JobCard）
src/components/layout/header.tsx          # 导航首位加「岗位匹配」（一行）
```

模块间依赖方向：page → profile-editor / recommend-list / use-profile / match / data（getJobs 取全量目录）→ utils（REGIONS / ORG_TYPES / DISCIPLINES 枚举常量）。match.ts 不依赖 use-profile 与任何组件；use-profile 仅依赖 match.ts 的 Profile 类型。

# 3. 内部数据流

画像编辑 → useProfile 更新状态并同步写 localStorage → useMemo 触发 matchProfile 重算（纯本地、无网络）→ 组合筛选收敛 → 推荐列表渲染。

打分维度与权重（集中常量 `MATCH_WEIGHTS`，可调；教育/工作为高、技能/方向为中，和为 100）：

| 维度 | 权重 | 匹配对象 | 命中判定（全部为字面量包含，不构造正则） |
| --- | --- | --- | --- |
| 教育经历 | 35 | original_major_requirements 原文包含专业名 + 学历字段对照 | 专业名非空且岗位原文（小写化）包含专业名 → 命中；命中强度按学历对照：画像阶段秩 ≥ 岗位学历秩 → 1.0，低于 → 0.5，任一侧不可判定（自定义阶段或岗位 education 无本科/硕士/博士字样）→ 0.75 |
| 工作经历 | 30 | 岗位 title 与 job_functions | 岗位 title（小写化）包含经历岗位名 → 强度 1.0；job_functions 与经历岗位名双向包含 → 强度 0.5（同一经历可同时产生两类命中） |
| 技能特长 | 20 | required_skills / preferred_skills | 与岗位技能标签大小写不敏感的双向包含或精确相等 → 命中；required 强度 1.0、preferred 强度 0.5 |
| 方向契合 | 15 | platform_disciplines | 画像专业名（小写化）包含 DISCIPLINES 条目的 keywords 关键词 → 映射到该平台方向；岗位 platform_disciplines 含该方向 name → 命中，强度 1.0；一个专业可映射多个方向 |

得分归一化：每个维度的命中强度求和后封顶 2，维度贡献 = 权重 × min(强度和, 2) / 2（单条命中得该维度权重一半，两条及以上封顶该维度权重）；总分 = round(各维度贡献之和 / 权重总和 × 100)，范围 0–100。注入 weights 时与默认权重合并后按实际权重总和归一化。

理由生成：每条命中产出一行可读理由（格式「{画像条目} ↔ {岗位字段}」），按教育→工作→技能→方向顺序排列：

- `{阶段}·{专业} ↔ 专业要求原文`
- `{经历岗位名} ↔ 岗位名称`、`{经历岗位名} ↔ 职能标签`
- `{技能} ↔ 技能标签`（required_skills）、`{技能} ↔ 优先技能标签`（preferred_skills）
- `{专业} ↔ 平台方向标签`

结果排序：score 降序 → reasons 条数降序 → job.id 升序（稳定）；零命中岗位不进结果。空画像 → 空数组。纯函数不抛异常。

组合筛选（页面内 useMemo，不新增公共接口）：地区下拉命中语义与 `filterJobs` 一致（province 包含地区名；「其他地区」为不在六省市内的记录）；单位类型为精确枚举匹配；非枚举值按无筛选处理。

# 4. 内部数据结构

- `ProfileEducation`：`{ stage: string, major: string }`（均必填；stage 为「本科/硕士/博士」枚举或自定义文本，major 为专业名称；与契约 20 一致）。
- `ProfileWork`：`{ title: string }`（必填）。
- `Profile`：`{ education: ProfileEducation[], work: ProfileWork[], skills: string[] }`（契约 20 结构；定义于 match.ts，use-profile 引用）。
- `MatchResult`：`{ job: Job, score: number, reasons: string[] }`（score 为 0–100 整数）。
- `MatchWeights`：`{ education: number, work: number, skill: number, discipline: number }`；默认常量 `MATCH_WEIGHTS = { education: 35, work: 30, skill: 20, discipline: 15 }`。

画像增删语义（use-profile 导出的纯函数与 hook 共用）：

- 添加前 trim；trim 后为空的输入忽略（返回原画像）；与既有条目小写化后完全相同的条目不重复添加。
- 删除按索引；索引越界静默返回原画像。
- clearAll 返回空画像。
- localStorage 读取：window 守卫（无 window 返回空画像）；JSON 解析失败或结构不合法按字段级归一化回退（非数组字段置空数组、非字符串成员丢弃）；写入失败静默（与收藏同语义）。

# 5. 内部状态机

不适用（无状态组件 + localStorage 持久化）。
