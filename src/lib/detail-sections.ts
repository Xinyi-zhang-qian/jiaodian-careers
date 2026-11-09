// 详情页区块渲染判定纯函数（detail-enrich 模块，第 3 轮改版）。
// 把「详情页各区块是否渲染、区块标题口径」从页面组件抽出为纯函数，供页面与模块测试复用。
// 判定口径依据 docs/interaction.md §7 与 docs/modules/detail-enrich_interaction.md §2.1：
// 条件信息区按「字段存在性」渲染（hasConditionInfo），区块标题按核验层级标注口径——
// 逐字段核验=「原公告资格条件」（内容为公告原文转述），其余层级=「已核验条件信息」（平台核验转述）。
import type { Job } from './types';
import { hasConditionInfo, applicationWindow } from './data';
import { getListingKind } from './utils';

export interface DetailSection {
  /** 区块标识，顺序固定：condition → tags → responsibilities → preferred → description → application → evidence。 */
  key: string;
  /** 区块标题；条件信息区按层级口径给出，其余区块为页面既有标题。 */
  title: string;
  /** 是否渲染该区块。 */
  visible: boolean;
}

export function detailSections(job: Job): DetailSection[] {
  // 条件信息区：任一条件字段（原公告资格条件、学历、薪资、职责、报名方式）非空即渲染；
  // 区块标题按 verification_level 标注口径（逐字段核验为公告原文口径，其余为平台核验口径）。
  const conditionTitle = job.verification_level === '逐字段核验' ? '原公告资格条件' : '已核验条件信息';
  // 方向与职能标签区：方向、职能或技能标签任一非空即渲染（职能标签为第 3 轮新增组）。
  const tagsVisible = job.platform_disciplines.length > 0
    || (job.job_functions?.length ?? 0) > 0
    || job.required_skills.length > 0;
  return [
    { key: 'condition', title: conditionTitle, visible: hasConditionInfo(job) },
    { key: 'tags', title: '技能与方向标签', visible: tagsVisible },
    { key: 'responsibilities', title: '原公告岗位职责（按原文列项）', visible: Boolean(job.responsibilities) },
    { key: 'preferred', title: '优先条件', visible: job.preferred_skills.length > 0 },
    { key: 'description', title: '本站说明（非公告原文）', visible: Boolean(job.description) },
    { key: 'application', title: '报名窗口', visible: applicationWindow(job, getListingKind(job.title)).visible },
    { key: 'evidence', title: '原页核验锚点', visible: (job.source_evidence?.length ?? 0) > 0 },
  ];
}
