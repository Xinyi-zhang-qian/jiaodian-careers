# 交点 Careers

面向人文、社会科学与理工科交叉人才的招聘信息静态站点。项目整理北京、上海等重点城市的科研、公共部门与产业机会，每条岗位记录都标注核验层级、保留来源链接与原文证据，使岗位的持续增补、复核与下架成为可重复的流程。

**在线访问：[https://jiaodian-careers.onrender.com](https://jiaodian-careers.onrender.com)**

## 功能清单

- 首页：关键词与地区、城市组合搜索；三级核验摘要（逐字段 / 来源 / 关键字段）；交叉方向与跨学科职能入口；最新精选岗位
- 岗位列表（/jobs）：按地区、城市、单位类型、岗位类型、岗位职能、学历、主学科、第二学科/技能、招聘状态与关键词筛选；最新发布、核验时间、截止日期三种排序与分页；「即将截止」岗位显示红色徽标
- 岗位详情（/jobs/[id]）：核验层级提示、报名窗口（报名开始、截止与方式）、原页核验锚点（来源标题与原文证据逐条展示）、来源页外链
- 交叉方向（/directions）：11 个「主学科 × 次学科」方向卡与岗位计数
- 收藏（/favorites）：浏览器本地收藏（localStorage），无需登录
- 实习岗位（/internships）：按方向分组的实习线索与回源复核说明
- 方向分析（/analysis）：机器人与 AI 等七类方向的岗位比较、核心技能与作品集建议
- 市场观察（/market、/market/robotics）：人才趋势摘要与机器人岗位样本统计（统计页支持 JSON/CSV 下载）

第三方招聘平台的职位可能随时下架或变更；申请前请打开原页面核对状态、薪资与要求。

## 本地运行

```bash
npm ci
npm run dev      # 开发服务器，http://localhost:3000
npm run build    # 构建静态站点（prebuild 自动执行 offline 审计门禁）
npm run test     # 聚合运行 scripts/tests/ 下全部断言脚本
```

更新机器人市场样本时运行 `npm run collect:robotics`（离线重建用 `npm run collect:robotics:offline`），脚本会检查来源页面可访问性，按单位、岗位名称和城市去重，并生成页面数据以及 `public/data/` 下的 JSON、CSV。

## 数据增补指引

新增岗位一律经增补脚本录入（手工编辑批次文件不被禁止，但同样必须通过审计门禁）：

```bash
npm run add:jobs -- <json路径> --batch <批次名>
```

JSON 文件为记录数组，每条记录必填字段：`title`、`organization`、`province`、`city`、`org_type`、`job_type`、`source_url`、`source_name`、`source_type`、`published_at`、`status`、`verification_level`、`source_title`、`source_evidence`。

核验层级照实标注，层级决定展示范围：「逐字段核验」表示全部条件字段逐项对照来源原文（证据片段 ≥3 段）；「来源核验」表示已确认来源页中的单位与岗位名称，条件字段以原文为准；「关键字段核验」表示岗位名称、单位、地区与来源链接已纳入核验索引。核对不到原文的字段一律留空，禁止按机构类型或常见待遇推测补写；报名起止时间只取公告原文。

复核历史遗留或隔离数据时运行：

```bash
npm run recheck:legacy
```

脚本对隔离的历史数据清单逐条回源访问，按「可升级 / 需人工复核 / 建议下架 / 未核验」分类，报告与逐条明细写入 `workspace/legacy-recheck/`（本地工作产物，不入库）。2026-11-04 已完成首轮全量复核与处置（见批次文件头注释）；清单文件已清理完毕时脚本按 0 条处理并如实报告。支持 `--offline`、`--ids id1,id2` 与 `--limit N`。

充实现有记录的条件字段或核实来源现状时运行：

```bash
npm run extract:fields -- --scan [--ids id1,id2] [--limit N]   # 抓取来源页，抽取候选条件字段与证据片段到 workspace/extract/（只读，不写库）
npm run extract:fields -- --apply <确认json>                    # 把人工确认的字段与证据写入批次文件，末尾自动执行 offline 审计
npm run refresh:sources [--ids id1,id2] [--limit N]             # 在线分类来源现状「现行有效/内容失配/来源过期」到 workspace/source-refresh/
```

scan 产出的候选字段供人工逐条确认后生成 apply 输入 JSON（记录 id → 字段值 + `_evidence` 证据片段，可选 `_level` 声明层级升级）；apply 逐条在线复核证据命中，未命中的记录整条拒绝、不做部分写入；「待核实」记录写入条件字段时自动升为「关键字段核验」。refresh:sources 的分类结果供后续处置（刷新来源或删除）参考，处置本身在批次文件中留痕。两类命令的本地产物均写入 `workspace/` 下，不入库。

运行测试套件：

```bash
npm run test
```

聚合执行 `scripts/tests/` 下的全部断言脚本，任一失败即退出码 1。

核验层级与证据要求：

- 逐字段核验：薪资、学历、专业、职责等条件逐项对照来源原文，`source_evidence` 至少提供 3 段能在来源页逐字命中的原文片段；
- 来源核验：已确认原公告中的单位与岗位名称；
- 关键字段核验：岗位名称、单位、地区和来源链接已纳入核验索引；
- 核对不到的字段一律留空，禁止根据机构背景、研究方向或常见要求补写专业、学历、职责、薪资或优先条件；
- 报名起止时间只取公告原文：`application_opens_at` 与 `deadline` 均为 `YYYY-MM-DD`；原文写明「长期有效」「招满为止」时不填截止日期，以报名方式原文承载。

录入脚本会校验结构与枚举、自动分配全目录唯一 ID、写入 `src/data/jobs/` 下的批次文件并自动执行 offline 审计。`npm run audit:jobs` 为在线回源核验门禁：实际访问来源页核对标题、发布日期与证据片段，任一证据未命中即以退出码 1 结束，提交数据前必须通过；构建阶段自动执行 offline 模式检查证据结构。

平台分析标签（学科方向、岗位职能、技能）必须与公告原文分开标注，不得混入 `original_major_requirements`、`source_title`、`source_evidence` 等原文引用字段。

## 目录结构

- `src/data/jobs/`：规范岗位数据源，按批次组织，`index.ts` 聚合导出 `jobsCatalog`（前台唯一数据入口）
- `src/lib/`：类型定义、岗位查询与枚举常量
- `src/app/`、`src/components/`：页面路由与界面组件
- `scripts/`：数据审计（audit-verified-jobs）、增补录入（add-jobs）、遗留复核（recheck-legacy）、机器人市场采集（collect-robotics-market）与模块测试（tests/）
- `public/data/`：机器人市场可下载数据（JSON、CSV）
- `docs/`：需求、设计、交互与测试文档体系

## 部署

站点以静态形式部署在 Render（仓库根目录 `render.yaml`）：

- 运行类型：Static Site
- 构建命令：`npm ci && npm run build`
- 发布目录：`out`
- 推送到 `main` 分支后自动部署；一切远程推送经命令系统 `::push` 触发，offline 审计未通过时构建中止、不会发布
