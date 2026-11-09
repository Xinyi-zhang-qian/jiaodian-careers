// 用户画像匹配引擎（match 模块，第 3 轮）。
// 打分为纯函数：只使用岗位的平台标签（方向/职能/技能）与已核验字段（标题、专业要求原文），
// 不使用任何推测内容（docs/design.md 契约 21）。权重集中定义于此，可调。
import type { Job } from './types';
import { DISCIPLINES } from './utils';

export interface EducationEntry {
  stage: string;
  major: string;
}

export interface WorkEntry {
  title: string;
}

export interface Profile {
  education: EducationEntry[];
  work: WorkEntry[];
  skills: string[];
}

export interface MatchResult {
  job: Job;
  /** 0–100 归一化得分（最高分岗位为 100）。 */
  score: number;
  /** 逐条可读理由，每条引用画像条目与命中的岗位字段。 */
  reasons: string[];
}

export interface MatchWeights {
  education: number;
  work: number;
  skill: number;
  discipline: number;
}

export const DEFAULT_WEIGHTS: MatchWeights = {
  education: 30,
  work: 25,
  skill: 25,
  discipline: 20,
};

// 学历阶段对照：画像阶段与岗位学历字段的包含关系（硕士可命中要求「硕士」「硕士及以上」，博士同理）。
const STAGE_ALIASES: Record<string, string[]> = {
  本科: ['本科'],
  硕士: ['硕士', '研究生'],
  博士: ['博士', '博士后'],
};

function includesAny(haystack: string, needles: string[]): boolean {
  return needles.some((needle) => needle && haystack.includes(needle));
}

/** 专业/技能关键词在岗位方向标签上的契合判定：专业或技能名命中 DISCIPLINES 关键词 → 对应方向。 */
function matchedDisciplines(texts: string[], job: Job): string[] {
  const hits = new Set<string>();
  for (const discipline of DISCIPLINES) {
    if (!job.platform_disciplines.includes(discipline.name)) continue;
    const keywordHit = texts.some((text) =>
      discipline.keywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase())),
    );
    if (keywordHit) hits.add(discipline.name);
  }
  return [...hits];
}

export function matchProfile(
  profile: Profile,
  jobs: Job[],
  weights: MatchWeights = DEFAULT_WEIGHTS,
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const job of jobs) {
    const reasons: string[] = [];
    let raw = 0;

    // 教育经历：专业名命中专业要求原文；阶段与岗位学历字段对照加权。
    for (const entry of profile.education) {
      const major = entry.major.trim();
      if (!major) continue;
      if (job.original_major_requirements.includes(major)) {
        raw += weights.education;
        reasons.push(`${entry.stage}·${major} ↔ 专业要求原文`);
      } else {
        // 专业要求未直提时，若岗位学历字段与阶段对照且方向标签与专业契合，给方向契合分。
        const aliases = STAGE_ALIASES[entry.stage] ?? [entry.stage];
        if (job.education && includesAny(job.education, aliases)) {
          raw += Math.round(weights.education / 2);
          reasons.push(`${entry.stage}·${major} ↔ 学历要求（${job.education.slice(0, 20)}）`);
        }
      }
      const disciplineHits = matchedDisciplines([major], job);
      for (const name of disciplineHits) {
        raw += weights.discipline;
        reasons.push(`${entry.stage}·${major} ↔ 方向标签「${name}」`);
      }
    }

    // 工作经历：岗位名命中岗位标题或平台职能标签。
    for (const entry of profile.work) {
      const title = entry.title.trim();
      if (!title) continue;
      if (job.title.includes(title)) {
        raw += weights.work;
        reasons.push(`工作经历·${title} ↔ 岗位标题`);
      } else if (job.job_functions?.includes(title)) {
        raw += weights.work;
        reasons.push(`工作经历·${title} ↔ 职能标签`);
      } else if (job.required_skills.some((skill) => skill.includes(title) || title.includes(skill))) {
        raw += Math.round(weights.work / 2);
        reasons.push(`工作经历·${title} ↔ 技能标签`);
      }
    }

    // 技能特长：与岗位技能标签双向包含匹配（字面量，不受正则特殊字符影响）。
    for (const skill of profile.skills) {
      const name = skill.trim();
      if (!name) continue;
      if (job.required_skills.some((s) => s.includes(name) || name.includes(s))) {
        raw += weights.skill;
        reasons.push(`技能 ${name} ↔ 岗位技能标签`);
      } else if (job.preferred_skills.some((s) => s.includes(name) || name.includes(s))) {
        raw += Math.round(weights.skill / 2);
        reasons.push(`技能 ${name} ↔ 优先条件`);
      }
    }

    if (reasons.length === 0) continue; // 零命中岗位不进推荐
    results.push({ job, score: raw, reasons });
  }

  // 归一化到 0–100：最高分岗位为 100，其余按比例。
  const maxRaw = Math.max(...results.map((r) => r.score), 1);
  for (const result of results) {
    result.score = Math.round((result.score / maxRaw) * 100);
  }
  results.sort((a, b) => b.score - a.score || a.job.id - b.job.id);
  return results;
}
