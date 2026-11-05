# data-acquisition 模块交互文档（第 2 轮执行）

> 本模块无用户界面交互；交互对象为来源网页（读取）与批次文件（写入）。第 2 轮规格要点：

# 1. 交互面总览

- 输入：来源网页（只读）；extract:fields --scan 候选 JSON（辅助）。
- 输出：`src/data/jobs/public-sector-2026-11.ts`、`src/data/jobs/research-institutes-2026-11.ts`；workspace/acquisition/ 底稿。

# 2. 批次文件规格

- 签名：`const records: JobWithWindow[] = [...]; export default records;`（文件头注释：采集日期、来源范围、单位类型构成）。
- 必填字段与证据要求与第 1 轮一致（title、organization、province、city、location、org_type、job_type、source_url、source_name、source_type、published_at、status、verification_level、source_title、source_evidence）。
- 事业单位记录：org_type「事业单位」，application_opens_at 或 deadline 至少其一有值或 application_info 含报名方式原文；来源 source_type 优先「政府」或「官网」。
- 科研院所/新型研究机构：org_type「科研院所」；新型研究机构若无法归入既有五枚举，用「科研院所」并在 description 注明「新型研发机构」（平台标注）。
- 城市具体到市；公告级条目 condition 字段留空并依赖层级提示；id 从 3001 起。

# 3. 自检断言（模块测试）

1. 两个批次可被 tsx 导入；schema 自查全部通过（必填、枚举、日期、待核实纯净、职能枚举、逐字段证据 ≥3 段）。
2. 数量：两批次合计 ≥20 条，其中 org_type 事业单位 ≥8 条。
3. 事业单位断言：每条含报名窗口字段或 application_info 报名原文。
4. 地域断言：北京、上海记录合计占比不低于一半（重点地域要求）。
5. 全部记录在线回源：source_title、published_at、全部证据片段逐字命中。
