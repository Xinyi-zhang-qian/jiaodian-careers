/**
 * detail-enrich 模块测试：覆盖 docs/interaction.md §7（详情页第 3 轮改版规格）、
 * docs/modules/detail-enrich_interaction.md §2（detailSections 接口规格与详情页断言）、
 * docs/design.md §4 契约 19。
 * 运行：npx tsx scripts/tests/detail-enrich.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detailSections } from '../../src/lib/detail-sections';
import type { Job } from '../../src/lib/types';

// —— 测试夹具 ————————————————————————————————————————————————

// 构造一条最小合法 Job 记录，overrides 覆盖用例关注的字段。
function makeJob(id: number, overrides: Partial<Job> = {}): Job {
  const base: Job = {
    id,
    title: '测试岗位',
    organization: '测试单位',
    province: '北京',
    city: '北京',
    location: '北京',
    org_type: '高校',
    job_type: '科研',
    original_major_requirements: '',
    platform_disciplines: [],
    required_skills: [],
    preferred_skills: [],
    education: '',
    experience: '不限',
    salary: null,
    description: '',
    responsibilities: '',
    application_info: '',
    published_at: '2026-10-01',
    deadline: null,
    source_name: '测试来源',
    source_type: '官网',
    source_url: 'https://example.com/source',
    fetched_at: '2026-10-01',
    last_verified: '2026-10-01',
    status: '招聘中',
    is_demo: false,
  };
  return Object.assign(base, overrides);
}

// 五项条件字段全空的记录（条件信息区不渲染的边界）。
const noConditionJob = makeJob(1);

// —— 极简断言框架 ———————————————————————————————————————————

let passed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed += 1;
    console.log(`通过 ${name}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    failures.push(`${name}：${message}`);
    console.log(`失败 ${name}`);
  }
}

// —— detailSections：条件信息区按字段存在性渲染（模块交互文档 §2.1） ——

function findSection(job: Job, key: string) {
  const sections = detailSections(job);
  const section = sections.find((s) => s.key === key);
  assert.ok(section, `返回清单应含 key 为 ${key} 的区块`);
  return section;
}

test('来源核验记录含 education 时条件信息区可见且标题为「已核验条件信息」', () => {
  const job = makeJob(2, { verification_level: '来源核验', education: '硕士及以上' });
  const condition = findSection(job, 'condition');
  assert.equal(condition.visible, true);
  assert.equal(condition.title, '已核验条件信息');
});

test('来源核验记录含 original_major_requirements 时条件信息区可见且标题为「已核验条件信息」', () => {
  const job = makeJob(3, { verification_level: '来源核验', original_major_requirements: '计算机、软件工程等相关专业' });
  const condition = findSection(job, 'condition');
  assert.equal(condition.visible, true);
  assert.equal(condition.title, '已核验条件信息');
});

test('关键字段核验记录含 salary 时条件信息区可见', () => {
  const job = makeJob(4, { verification_level: '关键字段核验', salary: '25-40 万/年' });
  const condition = findSection(job, 'condition');
  assert.equal(condition.visible, true);
  assert.equal(condition.title, '已核验条件信息');
});

test('逐字段核验记录条件信息区标题为「原公告资格条件」', () => {
  const job = makeJob(5, { verification_level: '逐字段核验', education: '博士' });
  const condition = findSection(job, 'condition');
  assert.equal(condition.visible, true);
  assert.equal(condition.title, '原公告资格条件');
});

test('无任何条件字段的记录条件信息区不可见', () => {
  const condition = findSection(noConditionJob, 'condition');
  assert.equal(condition.visible, false);
});

test('无核验层级记录拥有条件字段时标题为「已核验条件信息」', () => {
  const job = makeJob(6, { education: '本科及以上' });
  const condition = findSection(job, 'condition');
  assert.equal(condition.visible, true);
  assert.equal(condition.title, '已核验条件信息');
});

// —— detailSections：其余区块判定（模块交互文档 §2.1） ————————————

test('job_functions 非空时方向与职能标签区可见', () => {
  const job = makeJob(7, { job_functions: ['产品经理'] });
  assert.equal(findSection(job, 'tags').visible, true);
});

test('platform_disciplines 非空时方向与职能标签区可见', () => {
  const job = makeJob(8, { platform_disciplines: ['人工智能 × 教育'] });
  assert.equal(findSection(job, 'tags').visible, true);
});

test('方向与职能标签区对空标签记录不可见', () => {
  assert.equal(findSection(noConditionJob, 'tags').visible, false);
});

test('responsibilities 非空时职责区可见，空时不可见', () => {
  const job = makeJob(9, { responsibilities: '1. 开展前沿研究；\n2. 指导研究生。' });
  assert.equal(findSection(job, 'responsibilities').visible, true);
  assert.equal(findSection(noConditionJob, 'responsibilities').visible, false);
});

test('preferred_skills 非空时优先条件区可见，空时不可见', () => {
  const job = makeJob(10, { preferred_skills: ['有大模型落地经验者优先'] });
  assert.equal(findSection(job, 'preferred').visible, true);
  assert.equal(findSection(noConditionJob, 'preferred').visible, false);
});

test('description 非空时本站说明区可见，空时不可见', () => {
  const job = makeJob(11, { description: '本条为平台整理的岗位说明。' });
  assert.equal(findSection(job, 'description').visible, true);
  assert.equal(findSection(noConditionJob, 'description').visible, false);
});

test('source_evidence 非空时来源核验区可见，空时不可见', () => {
  const job = makeJob(12, { source_evidence: ['岗位名称：算法工程师'] });
  assert.equal(findSection(job, 'evidence').visible, true);
  assert.equal(findSection(noConditionJob, 'evidence').visible, false);
});

test('返回清单区块顺序固定且与页面渲染顺序一致', () => {
  const job = makeJob(13, {
    verification_level: '来源核验',
    education: '博士',
    responsibilities: '负责建模',
    preferred_skills: ['有实习经历'],
    description: '平台说明',
    deadline: '2026-12-31',
    source_evidence: ['岗位名称：算法工程师'],
    platform_disciplines: ['人工智能 × 教育'],
  });
  assert.deepEqual(
    detailSections(job).map((s) => s.key),
    ['condition', 'tags', 'responsibilities', 'preferred', 'description', 'application', 'evidence'],
  );
});

test('报名窗口区按 applicationWindow 口径判定', () => {
  const withDeadline = makeJob(14, { deadline: '2026-12-31' });
  assert.equal(findSection(withDeadline, 'application').visible, true);
  assert.equal(findSection(noConditionJob, 'application').visible, false);
});

// —— 详情页展示接线（源码结构断言，模块交互文档 §2 详情页断言 1–5） ——

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const pageSource = readFileSync(path.join(repoRoot, 'src/app/jobs/[id]/page.tsx'), 'utf8');
const sectionsSource = readFileSync(path.join(repoRoot, 'src/lib/detail-sections.ts'), 'utf8');

test('详情页条件信息区经 detailSections 判定渲染，不再按层级门槛单独渲染', () => {
  // 页面从 detail-sections 导入判定清单并按 visible 渲染
  assert.match(pageSource, /detailSections/);
  assert.match(pageSource, /\.visible/);
  // 旧版「仅逐字段核验渲染条件区块」的层级门槛写法不再出现在页面中
  assert.doesNotMatch(pageSource, /verification_level === '逐字段核验' && <section/);
  // 区块标题来自判定清单（层级口径），页面不再硬编码两种标题
  assert.match(sectionsSource, /原公告资格条件/);
  assert.match(sectionsSource, /已核验条件信息/);
});

test('详情页条件信息区按字段存在性逐行渲染（薪资行与经验行）', () => {
  // 条件区块 JSX（conditionSection?.visible 起至 tagsSection?.visible 止）内薪资行与原公告原文行按字段存在性渲染
  const conditionStart = pageSource.indexOf('conditionSection?.visible');
  const tagsStart = pageSource.indexOf('tagsSection?.visible');
  assert.ok(conditionStart !== -1 && tagsStart !== -1 && conditionStart < tagsStart, '页面应按判定清单渲染条件信息区');
  const conditionBlock = pageSource.slice(conditionStart, tagsStart);
  assert.match(conditionBlock, /job\.salary &&/, '条件区块内应存在薪资行按字段存在性渲染');
  assert.match(conditionBlock, /job\.original_major_requirements &&/, '原公告原文行按字段存在性渲染');
});

test('职能标签与方向标签同区渲染且用 secondary 色系区分', () => {
  // 页面渲染 job_functions 标签组，样式为 secondary 色系
  assert.match(pageSource, /job\.job_functions/);
  assert.match(pageSource, /bg-secondary\/10 text-secondary/);
});

test('招聘类型在标题旁以既有校招/社招徽标样式展示', () => {
  // 与列表卡（src/components/jobs/job-card.tsx）一致的 recruit_type 徽标配色
  assert.match(pageSource, /job\.recruit_type/);
  assert.match(pageSource, /bg-blue-100 text-blue-700/);
  assert.match(pageSource, /bg-green-100 text-green-700/);
});

test('长文本字段保持 whitespace-pre-wrap 完整渲染', () => {
  // 职责与本站说明的原文渲染不截断
  assert.match(pageSource, /whitespace-pre-wrap/);
});

// —— 汇总 ——————————————————————————————————————————————————

console.log(`\n共 ${passed + failures.length} 项断言，通过 ${passed}，失败 ${failures.length}`);
if (failures.length > 0) {
  for (const failure of failures) console.error(`  失败明细：${failure}`);
  process.exitCode = 1;
}
