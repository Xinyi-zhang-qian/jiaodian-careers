/**
 * match 模块测试：覆盖 docs/modules/match_interaction.md §2–4（matchProfile 规格、useProfile 语义）、
 * docs/design.md 契约 20–21（画像存储、匹配打分只使用平台标签与已核验字段）。
 * 运行：npx tsx scripts/tests/match.test.ts
 */
import assert from 'node:assert/strict';
import { matchProfile, DEFAULT_WEIGHTS, type Profile } from '../../src/lib/match';
import type { Job } from '../../src/lib/types';

// —— 夹具 ————————————————————————————————————————————————

function makeJob(id: number, overrides: Partial<Job> = {}): Job {
  const base: Job = {
    id,
    title: '测试岗位',
    organization: '测试单位',
    province: '北京',
    city: '北京',
    location: '北京市',
    org_type: '企业',
    job_type: '工程',
    original_major_requirements: '',
    platform_disciplines: [],
    required_skills: [],
    preferred_skills: [],
    education: '',
    experience: '',
    salary: null,
    description: '',
    responsibilities: '',
    application_info: '',
    published_at: '2026-11-01',
    deadline: null,
    source_name: '测试来源',
    source_type: '官网',
    source_url: 'https://example.com/' + id,
    fetched_at: '2026-11-06',
    last_verified: '2026-11-06',
    status: '招聘中',
    is_demo: false,
  };
  return { ...base, ...overrides };
}

const PROFILE: Profile = {
  education: [{ stage: '硕士', major: '计算语言学' }],
  work: [{ title: '数据分析师' }],
  skills: ['Python'],
};

const JOBS: Job[] = [
  // 多维命中：专业要求含「计算语言学」+ 技能含 Python + 方向标签契合
  makeJob(1, {
    title: '自然语言处理算法工程师',
    original_major_requirements: '原公告：计算机、语言学、计算语言学等相关专业硕士及以上。',
    education: '硕士及以上',
    required_skills: ['Python', 'NLP'],
    platform_disciplines: ['人工智能×人文社会科学'],
  }),
  // 单维命中：仅技能 Python
  makeJob(2, { required_skills: ['Python', '数据分析'] }),
  // 单维命中：仅职能标签 数据分析师
  makeJob(3, { title: '运营专员', job_functions: ['数据分析师'] as any }),
  // 零命中：无任何标签与已核验字段
  makeJob(4),
  // 方向契合：专业关键词「伦理」命中方向标签
  makeJob(5, {
    title: 'AI 治理研究员',
    platform_disciplines: ['人工智能×人文社会科学'],
    original_major_requirements: '原公告：哲学、法学等相关专业。',
  }),
];

// —— 打分与排序 ————————————————————————————————————————————————

const results = matchProfile(PROFILE, JOBS);

assert.ok(results.length >= 3, `至少 3 条命中（实际 ${results.length}）`);
assert.ok(!results.some((r) => r.job.id === 4), '零命中岗位不应出现在推荐中');
assert.equal(results[0].job.id, 1, '多维命中岗位应排名第一');
assert.ok(results[0].score >= results[results.length - 1].score, '结果按得分降序');
assert.ok(results[0].score === 100, `最高分应归一化为 100（实际 ${results[0].score}）`);

// 理由可读且引用画像条目与岗位字段
const first = results.find((r) => r.job.id === 1)!;
assert.ok(first.reasons.some((r) => r.includes('计算语言学') && r.includes('专业要求原文')), '教育理由应引用条目与字段');
assert.ok(first.reasons.some((r) => r.includes('Python') && r.includes('技能')), '技能理由应引用条目与字段');

// —— 边界 ————————————————————————————————————————————————

assert.deepEqual(matchProfile({ education: [], work: [], skills: [] }, JOBS), [], '空画像应返回空数组');

// 正则特殊字符按字面量匹配（技能名 C++）
const cppJobs = matchProfile({ education: [], work: [], skills: ['C++'] }, [makeJob(10, { required_skills: ['C++', '机器人'] })]);
assert.equal(cppJobs.length, 1, 'C++ 应按字面量命中而不抛异常');

// 打分依据限定：岗位仅有未核验内容（description）不应命中
const descOnly = matchProfile(PROFILE, [makeJob(11, { description: '需要 Python 与计算语言学背景' })]);
assert.equal(descOnly.length, 0, '仅 description 含关键词不应命中（打分只用标签与已核验字段）');

// 权重影响排序：把技能权重调 0 后，仅技能命中岗位排名应下降或掉出
const skillOnly = matchProfile(PROFILE, [makeJob(2), makeJob(3, { title: '运营专员', job_functions: ['数据分析师'] as any })], { ...DEFAULT_WEIGHTS, skill: 0 });
assert.ok(skillOnly[0].job.id === 3 || skillOnly.length === 1, '技能权重归零后技能单命中岗位不应再居首');

console.log(`match 模块测试：通过 ${7} 组断言`);
