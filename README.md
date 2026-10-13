# 交点 Careers

面向人文、社会科学与理工科交叉人才，发现重点城市（北京 / 上海 / 浙江 / 江苏等）的科研与产业机会。

一个基于 Next.js 16（App Router + Turbopack）的招聘岗位信息站，内置 **200 条**真实招聘数据，覆盖：

- 高校、科研院所、事业单位、企业（含外企、央企国企）
- 交叉方向：人工智能×人文社会科学、数据科学×社会科学、计算机×心理学／认知科学、医学／生命科学×计算机、法学／公共管理×技术、工程×材料／能源、哲学×社会科学 等
- 科学技术哲学 / 科学技术史、AI4S、系统生物学×AI、AI 机器人、人文-AI 交叉等岗位

## 功能

- 岗位列表（分页、筛选：地区 / 城市 / 单位类型 / 岗位类型 / 学历 / 交叉方向 / 状态 / 关键词）
- 岗位详情页（专业要求、交叉方向、职责、来源链接）
- 交叉方向页、收藏（本地 localStorage）
- 每条岗位均标注来源类型与原始链接

## 本地运行

    npm install
    npm run dev

打开 http://localhost:3000

生产构建：

    npm run build
    npm run start

## 部署（让别人能访问）

推荐使用 **Vercel**（Next.js 官方平台，免费）：

1. 把本项目推送到 GitHub 仓库
2. 打开 vercel.com，用 GitHub 登录
3. Add New → Project → 选择该仓库，框架自动识别为 Next.js
4. 点 Deploy，完成后即可获得公开网址

也可部署到 **Netlify** 或任意支持 Node.js 的平台（构建命令 npm run build，启动命令 npm run start）。

## 数据说明

- 数据在 src/data/real-jobs.ts，纯内存数据，无需数据库
- 新增岗位只需按现有结构追加对象即可
- 岗位信息来自招聘单位官网、人社部门公告等公开渠道，使用时请自行核对最新有效性

## 目录结构

    src/
      app/          页面（首页 /jobs /jobs/[id] /directions /favorites）
      components/   岗位卡片、布局
      data/         岗位数据
      lib/          类型、数据查询、工具函数
