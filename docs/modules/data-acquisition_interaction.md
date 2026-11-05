# data-acquisition 模块交互文档（第 2 轮执行）

> 本模块无用户界面交互；交互对象为来源网页（读取）与批次文件（写入）。第 2 轮规格要点：

# 1. 交互面总览

- 输入：来源网页（只读）；extract:fields --scan 候选 JSON（辅助）。
- 输出：`src/data/jobs/public-sector-2026-11.ts`、`src/data/jobs/research-institutes-2026-11.ts`（第 2 轮第一批）；`src/data/jobs/enterprise-bigtech-2026-11.ts`、`src/data/jobs/public-sector-bjsh-2026-11.ts`（第 2 轮增量批次）；workspace/acquisition/ 底稿。

# 2. 批次文件规格

- 签名：`const records: JobWithWindow[] = [...]; export default records;`（文件头注释：采集日期、来源范围、单位类型构成）。
- 必填字段与证据要求与第 1 轮一致（title、organization、province、city、location、org_type、job_type、source_url、source_name、source_type、published_at、status、verification_level、source_title、source_evidence）。
- 事业单位记录：org_type「事业单位」，application_opens_at 或 deadline 至少其一有值或 application_info 含报名方式原文；报名起止时间原文有则必录，原文只写「长期有效」「招满为止」或未给出起止时间时不填 deadline，把原文写进 application_info；来源 source_type 优先「政府」或「官网」，官方渠道不可核验时改用转载来源（source_type「其他」、source_name 注明「转载」）。
- 科研院所/新型研究机构：org_type「科研院所」；新型研究机构若无法归入既有五枚举，用「科研院所」并在 description 注明「新型研发机构」（平台标注）。
- 城市具体到市；公告级条目 condition 字段留空并依赖层级提示；id 从 3001 起。

# 2a. 增量批次规格（第 2 轮第二批：大厂综合岗位与京沪事业单位增补）

- 签名与文件头注释要求与 §2 一致；id 从 3101 起手工段（3101、3102……），两批次互不重复、不与 2001/3001 段冲突；fetched_at 与 last_verified 取采集当日。
- `src/data/jobs/enterprise-bigtech-2026-11.ts`（大厂综合岗位）：
  - 数量 ≥12 条；org_type「企业」；来源为企业官网招聘系统或官方发布渠道，转载渠道（公众号、高校就业网等）注明 source_type「其他」；
  - 机构范围：实际录入为字节跳动、小米、阿里巴巴、百度、京东、京东方、荣耀、网易、美团、中兴通讯、腾讯音乐（腾讯集团与华为的候选岗位因智联反爬、招聘页已结束等未能核验，宁缺毋滥放弃，明细见 workspace/acquisition/sources-2.md），可含阿里巴巴、美团、百度、京东等大厂补充；城市不限，北京、上海优先；
  - 职能覆盖：项目经理、产品经理、AI／机器人、AI4S、AI 伦理五类中的至少四类（按 job_functions 标注；AI4S 岗位如「AI for Science／科学计算／医疗 AI 算法」，AI 伦理如「AI 伦理／治理／合规／安全」岗）；
  - 核验层级：逐字段核验（source_evidence ≥3 段且 source_url 为 HTTPS）。
- `src/data/jobs/public-sector-bjsh-2026-11.ts`（北京、上海事业单位增补）：
  - 数量 ≥6 条；org_type「事业单位」；province/city 全部为北京或上海；
  - 来源为人社局、区人社局、事业单位官网的现行公开招聘公告（source_type 优先「政府」或「官网」）；
  - 每条含报名安排：application_opens_at / deadline 原文有则必录，报名方式写入 application_info（原文只写「长期有效」「招满为止」时不填 deadline，把原文写入 application_info）；
  - 不得与第 1 轮已采集公告重复（合并时由主 Agent 做去重核对）。

# 3. 自检断言（模块测试）

1. 两个批次可被 tsx 导入；schema 自查全部通过（必填、枚举、日期、待核实纯净、职能枚举、逐字段证据 ≥3 段）。
2. 数量：两批次合计 ≥20 条，其中 org_type 事业单位 ≥8 条。
3. 事业单位断言：每条含报名窗口字段或 application_info 报名原文。
4. 地域断言：北京、上海记录合计占比不低于一半（重点地域要求）。
5. 全部记录在线回源：source_title、published_at、全部证据片段逐字命中。
