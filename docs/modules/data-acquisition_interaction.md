# data-acquisition 模块交互文档

> 本模块无用户界面交互；交互对象为来源网页（读取）与批次文件（写入）。规格要点：

# 1. 交互面总览

- 输入：来源网页（WebFetch/浏览器访问，只读）。
- 输出：`src/data/jobs/{批次名}.ts` 批次文件；`workspace/acquisition/` 底稿。

# 2. 批次文件规格

- 签名：`const records: JobWithWindow[] = [...]; export default records;`（文件头注释：采集日期、来源范围、执行者）。
- 预期输入：经核对来源页取得的字段值。
- 预期输出：每条记录满足——必填字段齐全（title、organization、province、city、location、org_type、job_type、source_url、source_name、source_type、published_at、status、verification_level、source_title、source_evidence）；`source_evidence` 片段为来源页可复核原文；`is_demo: false`；`fetched_at`/`last_verified` 为采集当日。
- 边界检查：同一来源多岗位 → 逐岗位一条记录（公告级条目除外）；公告级条目（招聘公告/招聘项目）的 condition 字段留空并依赖层级提示；城市必须具体到市（「多地」禁止——模糊线索不录入）。
- 错误处理：任何字段核对不到 → 该字段留空或该条放弃，禁止推测补写。

# 3. 自检断言（模块测试）

1. 批次文件可被 tsx 导入且记录数 ≥ 目标数（按批次）。
2. 每条记录 schema 自查通过（复用 data-foundation 校验口径的本地实现：必填字段、枚举、日期格式、待核实纯净、职能枚举）。
3. 每条「逐字段核验」记录 source_evidence ≥3 段；每条记录 source_url 为可访问来源（采集时已实际访问）。
4. 北京、上海批次各 ≥10 条；跨学科批次 ≥10 条且 job_functions 标注正确；事业单位记录含报名窗口字段或 application_info 原文时间说明。
