# detail-enrich 模块设计文档

> 全局契约引用 docs/design.md §4（契约 19、21 邻接）、§5；本模块为第 3 轮执行单元（详情页改版 + 稀疏记录补提取）。

# 1. 模块职责与边界

- 职责：①详情页条件信息区改为「字段存在性渲染」——凡记录拥有原公告资格条件/学历/经验/薪资等字段即展示（区块标题按核验层级标注口径），消除 16 条来源核验与 3 条关键字段记录的「有数据未展示」；②详情页新增职能标签（job_functions）与招聘类型（recruit_type）展示；③长文本完整渲染核查；④对 9 条稀疏记录与可补的关键字段记录执行补充提取（extract:fields --scan/--apply，人工确认）。
- 数据所有权：`src/app/jobs/[id]/page.tsx` 本轮修改；本轮补提取涉及的批次文件修改。
- 不负责：匹配逻辑（match 模块）、既有批次的其他修改、页面其他区块。

# 2. 内部结构

```text
src/lib/detail-sections.ts    # detailSections 纯函数：详情页区块渲染判定（供页面与测试复用）
src/app/jobs/[id]/page.tsx    # 按 detailSections 判定渲染：条件信息区改版、职能标签、招聘类型徽标
src/data/jobs/                # 补提取确认后的批次修改（如适用）
scripts/tests/detail-enrich.test.ts  # 模块测试（node:assert + tsx）
```

# 3. 内部数据流

改版渲染：`detailSections(job)` 返回详情页各区块的渲染判定清单（key/title/visible），页面按清单逐区渲染。条件信息区 visible = hasConditionInfo(job)（复用既有函数）；区块标题按 verification_level 标注口径（逐字段核验=「原公告资格条件」，其余层级=「已核验条件信息」）；区块内容按字段存在性逐行渲染（原公告原文/学历/经验/薪资，字段存在才渲染行）。方向与职能标签区 visible = platform_disciplines 或 job_functions 非空，职能标签与方向标签同区渲染（样式一致，secondary 色系区分）。招聘类型：recruit_type 存在时标题旁徽标（与列表卡样式一致）。其余区块：职责区（responsibilities 非空）、优先条件区（preferred_skills 非空）、本站说明区（description 非空）、报名窗口区（applicationWindow 判定）、来源核验区（source_evidence 非空）。长文本保持 whitespace-pre-wrap 完整渲染。

补提取：extract:fields --scan --ids <稀疏记录与可补关键字段记录> → 逐条人工核对来源页 → 确认 JSON → --apply 写批次 → 离线审计。核对不到的字段留空并如实报告。

# 4. 内部数据结构

无新增数据结构。

# 5. 内部状态机

不适用。
