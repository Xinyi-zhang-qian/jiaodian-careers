# match 模块交互文档

> 用户交互规格见 docs/interaction.md §4（Header 导航）与 §5a（/match 页逐控件规格），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md §5a）：三组条目编辑器（添加/删除）、清空画像、推荐列表、组合筛选；引用 §4：Header 导航首位「岗位匹配」链接。
- 对外公共接口：`matchProfile(profile, jobs, weights?)`、`useProfile()`；辅助导出（供测试与复用）：`MATCH_WEIGHTS`、`Profile`/`MatchResult`/`MatchWeights` 类型、`parseStoredProfile`、`readStoredProfile` 与六个画像增删纯函数。

# 2. matchProfile 规格

- 签名：`matchProfile(profile: Profile, jobs: Job[], weights?: Partial<MatchWeights>): MatchResult[]`（调用方：/match 页；weights 注入供测试与调权）。
- 预期输入：画像（可为空画像）；全量岗位目录；可选权重（与 MATCH_WEIGHTS 逐字段合并）。
- 预期输出：按得分降序（同分按理由条数降序、job.id 升序）、仅含至少一个命中维度的岗位；每条含 score（0–100 整数）与可读理由数组（每条理由引用画像条目与岗位字段名，格式「{画像条目} ↔ {岗位字段}」，见设计文档 §3）。
- 边界检查：空画像 → 空数组；专业/技能含正则特殊字符（如「C++」）按字面量匹配不报错（全部包含匹配用字符串 API，不构造正则）；岗位字段为空数组/空串/缺省（job_functions 缺省按空数组）时该维度跳过；无平台标签且 title 与 original_major_requirements 均为空的记录不出现在结果中。
- 错误处理：纯函数不抛异常。

# 3. useProfile 规格

- 签名：`useProfile(): { profile, addEducation(stage, major), removeEducation(index), addWork(title), removeWork(index), addSkill(skill), removeSkill(index), clearAll() }`（调用方：/match 页与画像编辑器）。
- 预期输入：编辑器事件（stage 为「本科/硕士/博士」或自定义文本，major/title/skill 为文本）。
- 预期输出：状态更新并经 useEffect 同步写入 localStorage（键 `jiaodian-profile`，契约 20 结构）；增删语义：输入 trim 后为空忽略、与既有条目小写化后重复的不重复添加、删除索引越界静默、clearAll 回空画像。
- 边界检查：SSR/预渲染环境安全（window 守卫，与 use-favorites 同模式）；localStorage 解析失败或结构不合法 → 空画像（字段级归一化）；阶段或专业为空 → 添加禁用（UI 层拦截）。
- 错误处理：写失败静默（与收藏同语义）。

# 4. 界面断言（与 docs/interaction.md §5a 对应）

1. 三组条目添加/删除后刷新页面保持（localStorage 持久化）；清空确认后回引导态；添加按钮在必填输入为空时禁用（教育经历：阶段选「自定义」时须再填自定义阶段文本与专业名）。
2. 填写典型画像（如 硕士·计算语言学 + 技能 Python + 工作经历 数据分析师）后：推荐列表非空、按分降序、每条带匹配度与理由标签且理由引用所填条目。
3. 打分只用平台标签与 title/original_major_requirements：对无任何标签与已核验字段的记录不出现在推荐中。
4. 组合筛选（地区/单位类型下拉，枚举来自 utils 常量）在打分结果上收敛；非枚举值按无筛选处理。
5. 权重调整只改 src/lib/match.ts 常量即生效（测试以固定夹具断言相对顺序，并经 weights 注入验证权重改变可翻转相对顺序）。
