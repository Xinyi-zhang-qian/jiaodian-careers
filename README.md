# 交点 Careers

面向人文、社会科学与理工科交叉人才，整理重点城市的科研、公共部门与产业机会。

项目内含 213 条岗位记录、26 条交叉领域实习线索、一页机器人与 AI 岗位方向分析，以及一页招聘市场观察。

## 功能

- 岗位列表：按地区、城市、单位类型、岗位方向、学历、交叉方向、状态和关键词筛选
- 岗位详情：专业要求、职责、来源链接、信息获取时间与核验时间
- 交叉方向浏览与本地收藏
- 机器人与 AI 岗位方向分析：比较 VLA、仿真、感知、控制、数据评测等七类方向
- AI4S、医疗 × AI、生物学 × AI、具身智能、科技伦理与仿真算法实习专题（附来源和核验提示）
- 市场观察：BOSS直聘、猎聘等平台的职位快照，智联招聘报告数据及多个平台的实时检索入口
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
npm run dev
```

打开 http://localhost:3000。

## 构建静态站点

```bash
npm run build
```

构建完成后，静态站点文件位于 `out/`。岗位详情页会在构建时按岗位记录逐一生成；搜索、筛选和收藏在浏览器中运行，不需要数据库或常驻服务器。

## 免费发布并获得公开网址

建议使用 [EdgeOne Makers 静态网站托管](https://pages.edgeone.ai/zh/use-cases/static-website)：支持静态文件、HTTPS 和平台提供的免费域名。中国境内用户需要注册并登录后才能取得公开访问链接。

1. 登录 EdgeOne Makers 控制台，打开静态网站托管 / Pages Drop。
2. 上传本项目 `npm run build` 生成的 `out/` 文件夹。
3. 选择平台免费域名并发布；发布后把生成的网址复制出来。
4. 用手机流量或其他中国大陆网络打开首页、`/jobs/`、`/market/`、`/internships/` 和一条岗位详情，确认访问正常。

本项目没有自定义域名，因此会使用托管平台分配的域名。平台域名和免费额度由服务商管理；上线后应从大陆网络实际检查一次。

> EdgeOne Pages 主项目的默认链接有中国大陆访问规则：部分默认链接是 3 小时预览地址。要长期使用该产品的自定义域名，可能需要备案。本项目优先选择 Makers 的静态托管免费域名，避免把临时预览链接当作长期网址。详见 [EdgeOne Pages 域名规则](https://edgeone.cloud.tencent.com/pages/document/175191784523485184) 与 [Makers 静态托管说明](https://pages.edgeone.ai/zh/use-cases/static-website)。

## 数据与目录

- 岗位数据：`src/data/real-jobs.ts`
- 招聘平台快照和市场趋势：`src/data/platform-sources.ts`
- 交叉领域实习线索：`src/data/internship-listings.ts`
- 机器人与 AI 分析数据：`src/data/robotics-ai-analysis.ts`
- 页面：`src/app/`
- 组件：`src/components/`
- 类型与查询：`src/lib/`

每条岗位记录都应保留来源链接。新增平台信息时，请注明采集日期和第三方来源，不要把平台页面快照描述成官方公告，也不要在无法确认时标成“招聘中”。
