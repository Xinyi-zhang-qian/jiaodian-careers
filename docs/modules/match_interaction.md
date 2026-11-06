# match 模块交互文档

> 用户交互规格见 docs/interaction.md §5a（/match 页逐控件规格），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md §5a）：三组条目编辑器（添加/删除）、清空画像、推荐列表、组合筛选。
- 对外公共接口：`matchProfile(profile, jobs)`、`useProfile()`。

# 2. matchProfile 规格

- 签名：`matchProfile(profile: Profile, jobs: Job[]): MatchResult[]`（调用方：/match 页）。
- 预期输入：画像（可为空）；全量岗位目录。
- 预期输出：按得分降序、仅含至少一个命中维度的岗位；每条含可读理由数组（每条理由引用画像条目与岗位字段名）。
- 边界检查：空画像 → 空数组；专业/技能含正则特殊字符按字面量匹配；岗位字段为空数组/空串时该维度跳过。
- 错误处理：纯函数不抛异常。

# 3. useProfile 规格

- 签名：`useProfile(): { profile, addEducation, removeEducation, addWork, removeWork, addSkill, removeSkill, clearAll }`。
- 预期输入：编辑器事件。
- 预期输出：状态更新并同步写入 localStorage（键 `jiaodian-profile`）；SSR/预渲染环境安全（window 守卫，与 use-favorites 同模式）。
- 边界检查：localStorage 解析失败 → 空画像；阶段字段空 → 添加禁用（UI 层拦截）。
- 错误处理：写失败静默（与收藏同语义）。

# 4. 界面断言（与 docs/interaction.md §5a 对应）

1. 三组条目添加/删除后刷新页面保持（localStorage）；清空后回引导态。
2. 填写典型画像（如 硕士·计算语言学 + 技能 Python + 工作经历 数据分析师）后：推荐列表非空、按分降序、每条带理由且理由引用所填条目。
3. 打分只用平台标签与 title/original_major_requirements：对无任何标签与已核验字段的记录不出现在推荐中。
4. 组合筛选（地区/单位类型）在打分结果上收敛。
5. 权重调整只改 src/lib/match.ts 常量即生效（测试以固定夹具断言相对顺序）。
