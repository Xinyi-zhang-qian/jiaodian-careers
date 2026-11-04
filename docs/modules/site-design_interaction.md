# site-design 模块交互文档

> 用户交互规格见 docs/interaction.md §4、§5（全局框架与首页），此处只定义模块内部接口与断言。

# 1. 交互面总览

- 用户交互（引用 docs/interaction.md）：首页职能快捷入口卡（新增）、核验摘要卡（强化）、Header/Footer（保持）。
- 内部关键接口：首页对 `getJobs` 的只读调用（jobs-ui 所有，本模块桩策略同前）。

# 2. 首页职能入口规格

- 预期输入：JOB_FUNCTIONS 枚举 + getJobs({ job_function, limit: 1 }).total 计数。
- 预期输出：计数 >0 的职能渲染为卡片（职能名 + 岗位数），点击跳转 `/jobs?function={枚举值}`；计数为 0 的职能不渲染。
- 边界检查：枚举读取失败（合并前桩阶段）→ 降级为不渲染该区块，不抛异常。
- 错误处理：无服务端依赖。

# 3. README 断言

1. README 含「数据增补指引」节：写明 add:jobs 命令用法、JSON 记录必填字段、核验层级与证据要求、audit 门禁。
2. README 不再出现 update.sh 与「Vercel」过时表述（现部署为 Render）。
3. README 的运行命令与 package.json scripts 一致。

# 4. 界面断言

1. 首页出现职能快捷入口且有岗位的职能计数正确（与 /jobs?function= 筛选结果一致）。
2. 全站核验徽标颜色符合 docs/interaction.md §3 色彩协议（逐字段绿/来源蓝/关键字段琥珀/待核实黄/即将截止红）。
3. 首页核验摘要数字与 jobsCatalog 实际层级分布一致。
