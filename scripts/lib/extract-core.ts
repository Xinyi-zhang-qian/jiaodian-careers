// source-tools 字段抽取核心：在来源页规范化文本（recheck-core normalizeHtml 产物，无空白字符）
// 上按「标签＋冒号」分区启发式抽取候选字段。抽取规则集中在本文件，纯函数、可独立测试。
// 模块规格见 docs/modules/source-tools_interaction.md §2。
import type { Job } from '../../src/lib/types';

/** 单个候选字段：value 为分区提取值，evidence 为可在规范化文本中 includes 命中的原样切片。 */
export interface FieldCandidate {
  value: string;
  evidence: string;
}

/** extractCandidates 返回结构；页面内容为空时 inaccessible 说明原因。 */
export interface ExtractResult {
  candidates: Record<string, FieldCandidate>;
  inaccessible?: string;
}

/** 候选键与触发标签（长词在前）。分区起点要求标签后紧跟冒号，短词别名不会在长词标签处误命中。 */
const LABEL_RULES: { key: string; labels: string[] }[] = [
  { key: 'education', labels: ['学历要求', '报考学历', '学历条件', '学历'] },
  { key: 'salary', labels: ['薪资待遇', '薪酬待遇', '薪资福利', '薪酬福利', '薪资', '薪酬', '待遇'] },
  { key: 'responsibilities', labels: ['岗位职责', '工作职责', '主要职责', '职责描述', '工作内容'] },
  { key: 'original_major_requirements', labels: ['专业要求', '招聘专业', '所学专业', '专业方向', '专业条件'] },
  { key: 'recruit_count', labels: ['招聘人数', '招聘名额', '招收人数', '招录人数'] },
  { key: 'application_schedule', labels: ['报名安排', '报名时间', '截止时间', '报名截止'] },
  { key: 'contact', labels: ['联系方式', '联系邮箱', '联系电话', '联系人', '咨询方式'] },
  { key: 'application_info', labels: ['报名方式', '报名办法', '投递方式', '应聘方式', '申请方式'] },
];

/** 可写入批次文件的候选键（apply 允许清单成员）：记录对应字段已有值时跳过抽取。 */
const WRITABLE_KEYS: readonly string[] = [
  'education',
  'salary',
  'responsibilities',
  'original_major_requirements',
  'application_info',
];

const VALUE_MAX_LENGTH = 300;
const EVIDENCE_MIN_LENGTH = 10;
const EVIDENCE_MAX_LENGTH = 80;
const COLONS = new Set(['：', ':']);

/** 全部标签平铺，供分区终点检测使用（任何「标签＋冒号」的出现都终止当前分区）。 */
const ALL_LABELS: string[] = LABEL_RULES.flatMap((rule) => rule.labels);

/** 记录字段是否已有非空值（字符串看去除空白后长度，数组看长度，null/undefined 视为空）。 */
function jobFieldHasValue(job: Job, key: string): boolean {
  const value = (job as unknown as Record<string, unknown>)[key];
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return value !== null && value !== undefined;
}

/** 查找 labels 中任一标签后紧跟冒号的首次出现；返回标签起点与分区起点（冒号之后）。 */
function findSectionStart(text: string, labels: string[]): { labelStart: number; valueStart: number } | null {
  let best: { labelStart: number; valueStart: number } | null = null;
  for (const label of labels) {
    let from = 0;
    for (;;) {
      const index = text.indexOf(label, from);
      if (index === -1) break;
      const after = text[index + label.length];
      if (after !== undefined && COLONS.has(after)) {
        if (best === null || index < best.labelStart) {
          best = { labelStart: index, valueStart: index + label.length + 1 };
        }
        break;
      }
      from = index + 1;
    }
  }
  return best;
}

/** 分区终点：valueStart 之后任一「标签＋冒号」出现的最小位置，且不超过 300 字符上限。 */
function findSectionEnd(text: string, valueStart: number): number {
  let end = Math.min(text.length, valueStart + VALUE_MAX_LENGTH);
  for (const label of ALL_LABELS) {
    let from = valueStart;
    for (;;) {
      const index = text.indexOf(label, from);
      if (index === -1 || index >= end) break;
      const after = text[index + label.length];
      if (after !== undefined && COLONS.has(after)) {
        end = index;
        break;
      }
      from = index + 1;
    }
  }
  return end;
}

/**
 * 从规范化文本中抽取候选字段。
 * 规格要点：可写入组键在记录已有值时跳过；value 为空不进候选；
 * evidence 为自标签起点的原样切片（不足 10 字符向后扩展），命中校验失败时舍弃该键。
 */
export function extractCandidates(job: Job, normalizedHtml: string): ExtractResult {
  const text = (normalizedHtml ?? '').trim();
  if (!text) {
    return { candidates: {}, inaccessible: '页面内容为空' };
  }

  const candidates: Record<string, FieldCandidate> = {};
  for (const rule of LABEL_RULES) {
    if (WRITABLE_KEYS.includes(rule.key) && jobFieldHasValue(job, rule.key)) continue;
    const start = findSectionStart(text, rule.labels);
    if (start === null) continue;
    const end = findSectionEnd(text, start.valueStart);
    const value = text.slice(start.valueStart, end);
    if (!value) continue;

    const sectionLength = end - start.labelStart;
    const wantLength = Math.min(EVIDENCE_MAX_LENGTH, Math.max(EVIDENCE_MIN_LENGTH, sectionLength));
    let evidence = text.slice(start.labelStart, Math.min(text.length, start.labelStart + wantLength));
    if (evidence.length < EVIDENCE_MIN_LENGTH) {
      // 标签贴近文本末尾时取文本末尾 10 字符，保证证据片段满足最短长度且仍可命中。
      evidence = text.slice(Math.max(0, text.length - EVIDENCE_MIN_LENGTH));
    }
    if (!text.includes(evidence)) continue; // 宁可少提取不提取假证据
    candidates[rule.key] = { value, evidence };
  }
  return { candidates };
}
