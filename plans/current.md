# 当前计划 — 用户画像匹配推荐与详情页信息充实（第 3 轮）

创建日期：2026-11-06
状态：待用户批准

## 1. 核心功能

（继承自需求 V4.0）新增岗位匹配推荐：用户在 /match 页输入不同阶段的专业、工作经历岗位、技能特长（三类条目可动态增删、本地保存），系统在浏览器本地按已核验信息打分排序并给出逐条匹配理由。详情页按字段存在性全量展示（16 条来源核验与 3 条关键字段的已提取字段变为可见），新增职能标签与招聘类型展示，并对 9 条稀疏记录补充提取。

## 2. 接口与测试

- 求职者接口：/match 页（画像三组编辑器 + 推荐列表 + 组合筛选 + 清空）；Header 导航新增「岗位匹配」；详情页条件信息区改版（字段存在性渲染）+ 职能标签 + 招聘类型徽标。
- 维护者接口：无新命令（补提取用既有 extract:fields --scan/--apply）。
- 拟新增测试（登记 docs/test.md）：match（打分排序、理由生成、画像存储 hook、空画像引导、未核验字段不参与打分）、detail-enrich（条件区块字段存在性渲染断言、职能标签/招聘类型渲染）、integration 扩展（/match 静态导出与详情页新区块抽查）。

## 3. 模块划分

| 模块 | 性质 | 模块文档 |
| --- | --- | --- |
| match | 新增（match-engine + match-ui 一个开发单元） | docs/modules/match_{design,interaction}.md |
| detail-enrich | 执行（详情页改版 + 补提取） | docs/modules/detail-enrich_{design,interaction}.md |

不动的模块：source-tools、data-refresh、site-shell（仅 Header 加一个链接）、robotics-market、legacy-cleanup。

耦合关系：match 与 detail-enrich 文件不相交（match：src/lib/match.ts、src/lib/use-profile.ts、src/app/match/**、src/components/match/**；detail-enrich：src/app/jobs/[id]/page.tsx、批次文件），可并行。Header 链接由 match 模块顺带修改（src/components/layout/header.tsx 一行）。

## 4. 模块间接口与数据流（diff）

- 画像：use-profile（localStorage `jiaodian-profile`）→ match-engine 纯函数打分 → /match 渲染。
- 详情页：jobsCatalog 字段存在性 → 条件信息区/职能标签/招聘类型渲染。
- 补提取：extract:fields --scan → 确认 → --apply 写批次 → 离线审计。

## 5. 模块内数据流

见各模块设计文档 §3。

## 修改清单

### 代码
- `src/lib/match.ts`（新建：打分与理由纯函数）、`src/lib/use-profile.ts`（新建：画像 hook）
- `src/app/match/page.tsx`、`src/components/match/*`（新建：画像编辑器与推荐列表）
- `src/components/layout/header.tsx`：导航加「岗位匹配」
- `src/app/jobs/[id]/page.tsx`：条件信息区改版、职能标签、招聘类型徽标
- `src/data/jobs/`：稀疏记录补提取的批次修改（detail-enrich）
- `scripts/tests/match.test.ts`（新建）、既有 integration 扩展

### 文档
- `docs/modules/match_*`、`docs/modules/detail-enrich_*`（本轮建立）
- `docs/test.md`：新增登记与结果
- `README.md`：/match 功能说明
- `docs/requirements.md`、`docs/design.md`、`docs/interaction.md`：本轮已更新（批准版）

## Checklist

- [ ] match：匹配引擎（打分/理由/权重）+ /match 页（画像编辑器、推荐列表、组合筛选、清空）+ 本地持久化 + 模块测试
- [ ] detail-enrich：详情页字段存在性渲染 + 职能标签与招聘类型 + 稀疏记录补提取（9 条）+ 审计通过
- [ ] 模块间级和整库级的整合测试
