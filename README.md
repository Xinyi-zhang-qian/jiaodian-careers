# 交点 Careers

面向人文、社会科学与理工科交叉人才，整理重点城市的科研、公共部门与产业机会。

项目当前只展示已逐字段对照来源全文的岗位记录。未保存足够原文证据的历史岗位与实习线索已下架并进入重新核验。

**在线访问：[https://jiaodian-careers.onrender.com](https://jiaodian-careers.onrender.com)**

## 功能

- 岗位列表：按地区、城市、单位类型、岗位方向、学历、交叉方向、状态和关键词筛选
- 岗位详情：专业要求、职责、来源链接、信息获取时间与核验时间
- 交叉方向浏览与本地收藏
- 机器人与 AI 岗位方向分析：比较 VLA、仿真、感知、控制、数据评测等七类方向
- AI4S、医疗 × AI、生物学 × AI、人文科技内容与数据、具身智能、科技伦理与仿真算法实习专题（数据正在重新核验）
- 市场观察：人才趋势和机器人岗位方向样本；未逐字段核验的线索不展示专业、职责、学历、经验或薪资
- 人文社科岗位：科学技术哲学、科学技术史、哲学教学科研与学术编辑等方向
- 静态网站导出，可部署到静态托管服务

## Render 部署

仓库根目录包含 `render.yaml`，可在 Render 控制台通过 **New > Blueprint** 连接本仓库并直接部署。配置如下：

- 分支：`main`
- 运行类型：Static Site
- 构建命令：`npm ci && npm run build`
- 发布目录：`out`
- 自动部署：每次推送到 `main` 后自动触发

第三方招聘平台的职位可能随时下架或变更；平台快照只作求职线索，申请前请打开原页面核对状态、薪资与要求。

## 本地运行

```bash
npm ci
npm run audit:jobs
npm run dev
```

打开 http://localhost:3000。

更新机器人市场样本时运行：

```bash
npm run collect:robotics
```

脚本会检查来源页面可访问性，按单位、岗位名称和城市去重，并生成页面数据以及位于 `public/data/` 的 JSON、CSV。未逐字段核验的线索只保留方向分析所需的基本字段，不输出人工补写的任职条件或薪资。若只需用本地来源重建数据而不访问网页，可运行 `npm run collect:robotics:offline`。

## 构建静态站点

```bash
npm run build
```

构建完成后，静态站点文件位于 `out/`。岗位详情页会在构建时按岗位记录逐一生成；搜索、筛选和收藏在浏览器中运行，不需要数据库或常驻服务器。

## 数据与目录

- 已核验岗位数据：`src/data/verified-jobs.ts`
- 待重新核验的历史候选数据：`src/data/real-jobs.ts`（不供前台读取）
- 原文证据校验脚本：`scripts/audit-verified-jobs.ts`
- 招聘平台快照和市场趋势：`src/data/platform-sources.ts`
- 机器人市场采集脚本：`scripts/collect-robotics-market.ts`
- 机器人市场生成数据：`src/data/generated/robotics-market.json`
- 机器人市场分析与分类逻辑：`src/lib/robotics-market.ts`
- 交叉领域实习线索：`src/data/internship-listings.ts`
- 机器人与 AI 分析数据：`src/data/robotics-ai-analysis.ts`
- 页面：`src/app/`
- 组件：`src/components/`
- 类型与查询：`src/lib/`

新增岗位必须保存来源页标题和可机器复核的原文证据片段，通过 `npm run audit:jobs`后才能进入前台数据。平台分析标签必须与公告原文分开标注；不得根据机构、研究方向或常见要求自行补写专业、学历、职责、薪资或优先条件。

Render 构建阶段使用 `audit:jobs:offline` 检查证据结构，避免招聘单位网站屏蔽云服务器时阻断发布；完整的 `audit:jobs` 会实际访问来源页并核对标题、发布日期和原文片段，必须在提交数据前运行。
