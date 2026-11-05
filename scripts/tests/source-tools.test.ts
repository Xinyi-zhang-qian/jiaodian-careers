// source-tools 模块测试
// 依据 docs/modules/source-tools_interaction.md §2-§4 与 docs/interaction.md §11。
// 运行：npx tsx scripts/tests/source-tools.test.ts
// 全部网络行为使用注入的 fetch 假实现，不发真实请求；apply 写库行为通过临时目录注入隔离。
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { normalizeHtml } from '../lib/recheck-core';
import { extractCandidates } from '../lib/extract-core';
import { applyConfirmed, selectScanTargets } from '../extract-fields';
import { classifyRefresh, selectRefreshTargets } from '../refresh-sources';
import type { Job } from '../../src/lib/types';

let passed = 0;
const failures: string[] = [];
const cases: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  cases.push(name);
  try {
    await fn();
    passed += 1;
    console.log(`  通过 | ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`  失败 | ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

// —— 夹具：来源页 HTML（标签分区，「标签＋冒号」写在 strong 标签内，规范化后保留冒号）——
// 薪资中的 en dash 经 normalizeHtml 统一为半角连字符；标题与 h1 重复出现供分类锚点命中。
const SOURCE_HTML = `<html><head><title>××研究院2026年公开招聘公告</title></head><body>
<article>
<h1>××研究院2026年公开招聘公告</h1>
<p><strong>招聘岗位：</strong>算法工程师（具身智能方向）。</p>
<p><strong>招聘人数：</strong>5人。</p>
<p><strong>学历要求：</strong>博士研究生学历，人工智能、计算机等相关专业毕业。</p>
<p><strong>薪资待遇：</strong>年薪30–50万元（税前），缴纳五险一金。</p>
<p><strong>岗位职责：</strong>负责具身智能算法研发与大模型训练，承担课题申报。</p>
<p><strong>专业要求：</strong>计算机科学与技术、人工智能、软件工程等相关专业。</p>
<p><strong>报名方式：</strong>登录研究院招聘系统在线投递简历。</p>
<p><strong>报名时间：</strong>2026-11-01 至 2026-11-30。</p>
<p><strong>联系方式：</strong>hr@example.ac.cn。</p>
</article>
</body></html>`;
const NORMALIZED_SOURCE = normalizeHtml(SOURCE_HTML);

// —— 夹具：分类用页面 ——
const EXPIRED_HTML = '<html><body><div>跳转提示</div><div>操作失败！ 该信息已过期！</div><div>页面自动跳转 等待时间：3</div></body></html>';
const MISS_HTML = '<html><body><p>今日校园通知：图书馆开放时间调整。</p></body></html>';
const PAUSED_HTML = '<html><body><h1>××研究院2026年公开招聘公告</h1><p>××研究院面向社会公开招聘。</p><p>该职位已暂停招聘，投递了该职位的人还查看了以下职位。</p></body></html>';

// —— 夹具：Job 记录 ——
function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    id: 7001,
    title: '算法工程师（具身智能方向）',
    organization: '××研究院',
    province: '北京',
    city: '北京',
    location: '北京市',
    org_type: '科研院所',
    job_type: '科研',
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
    source_name: '××研究院官网',
    source_type: '官网',
    source_url: 'https://fixture.example.com/announcement-1',
    fetched_at: '2026-11-01',
    last_verified: '2026-11-01',
    status: '状态待核实',
    is_demo: false,
    verification_level: '待核实',
    source_title: '××研究院2026年公开招聘公告',
    ...overrides,
  };
}

// —— 夹具：注入的 fetch 假实现（按 URL 配置页面或状态码）——
type FakePage = string | { status: number; body: string };

function fetchByUrl(pages: Record<string, FakePage>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const page = pages[url];
    if (page === undefined) throw new Error(`测试假 fetch 未配置 URL：${url}`);
    if (typeof page === 'string') return new Response(page, { status: 200 });
    return new Response(page.body, { status: page.status });
  }) as typeof fetch;
}

// —— 夹具：apply 用的临时批次目录（每例独立，避免用例间文件状态串扰）——
const FIXTURE_BATCH = `// 批次：fixture-a（source-tools 模块测试夹具，不入库）
// 采集日期：2026-11-01；来源范围：模块测试注入（fixture.example.com）
import type { Job } from '../../../src/lib/types';

const records: Job[] = [
  {
    id: 9001,
    title: '测试岗位一（待核实空白记录）',
    organization: '测试研究院',
    province: '北京', city: '北京', location: '北京市',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: '2026-11-01', deadline: null,
    source_name: '测试研究院官网', source_type: '官网',
    source_url: 'https://fixture.example.com/job-9001',
    fetched_at: '2026-11-01', last_verified: '2026-11-01',
    status: '状态待核实', is_demo: false,
    verification_level: '待核实',
    source_title: '测试研究院2026年公开招聘公告',
  },
  {
    id: 9002,
    title: '测试岗位二（来源核验记录）',
    organization: '测试研究院',
    province: '北京', city: '北京', location: '北京市',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: '2026-11-01', deadline: null,
    source_name: '测试研究院官网', source_type: '官网',
    source_url: 'https://fixture.example.com/job-9002',
    fetched_at: '2026-11-01', last_verified: '2026-11-01',
    status: '招聘中', is_demo: false,
    verification_level: '来源核验',
    source_evidence: ['既有证据片段甲'],
  },
  {
    id: 9003,
    title: '测试岗位三（关键字段核验记录）',
    organization: '测试研究院',
    province: '北京', city: '北京', location: '北京市',
    org_type: '科研院所', job_type: '科研',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: '2026-11-01', deadline: null,
    source_name: '测试研究院官网', source_type: '官网',
    source_url: 'https://fixture.example.com/job-9003',
    fetched_at: '2026-11-01', last_verified: '2026-11-01',
    status: '招聘中', is_demo: false,
    verification_level: '关键字段核验',
    source_evidence: ['既有证据片段乙'],
  },
];

export default records;
`;

// 与 FIXTURE_BATCH 对应的内存目录（applyConfirmed 以 catalog 查记录、以文件文本定位替换区间）
function makeFixtureCatalog(): Job[] {
  return [
    makeJob({
      id: 9001,
      title: '测试岗位一（待核实空白记录）',
      organization: '测试研究院',
      source_url: 'https://fixture.example.com/job-9001',
      status: '状态待核实',
      verification_level: '待核实',
      source_title: '测试研究院2026年公开招聘公告',
    }),
    makeJob({
      id: 9002,
      title: '测试岗位二（来源核验记录）',
      organization: '测试研究院',
      source_url: 'https://fixture.example.com/job-9002',
      status: '招聘中',
      verification_level: '来源核验',
      source_evidence: ['既有证据片段甲'],
    }),
    makeJob({
      id: 9003,
      title: '测试岗位三（关键字段核验记录）',
      organization: '测试研究院',
      source_url: 'https://fixture.example.com/job-9003',
      status: '招聘中',
      verification_level: '关键字段核验',
      source_evidence: ['既有证据片段乙'],
    }),
  ];
}

const PAGE_9002 = '<html><body><h1>测试岗位二</h1><p>测试研究院面向社会招聘测试岗位二。</p><p>既有证据片段甲，另有其他内容。</p></body></html>';
const PAGE_9003 = '<html><body><h1>测试岗位三</h1><p>岗位职责：负责数据平台建设与维护，支持课题研究。</p></body></html>';

function makeFixtureJobsDir(): string {
  const jobsDir = path.join(mkdtempSync(path.join(os.tmpdir(), 'source-tools-apply-')), 'jobs');
  mkdirSync(jobsDir, { recursive: true });
  writeFileSync(path.join(jobsDir, 'fixture-a.ts'), FIXTURE_BATCH, 'utf8');
  return jobsDir;
}

const APPLY_EVIDENCE_EDUCATION = '学历要求：博士研究生学历，人工智能、计算机等相关专业毕业。';
const APPLY_EVIDENCE_SALARY = '薪资待遇：年薪30-50万元（税前），缴纳五险一金。';
const APPLY_EVIDENCE_RESPONSIBILITIES = '岗位职责：负责数据平台建设与维护，支持课题研究。';

async function main() {

await test('extractCandidates：标签分区抽取候选字段且证据可命中', () => {
  const result = extractCandidates(makeJob(), NORMALIZED_SOURCE);
  assert.equal(result.inaccessible, undefined);
  const c = result.candidates;
  assert.equal(c.education?.value, '博士研究生学历，人工智能、计算机等相关专业毕业。');
  assert.equal(c.salary?.value, '年薪30-50万元（税前），缴纳五险一金。');
  assert.equal(c.responsibilities?.value, '负责具身智能算法研发与大模型训练，承担课题申报。');
  assert.equal(c.original_major_requirements?.value, '计算机科学与技术、人工智能、软件工程等相关专业。');
  assert.equal(c.application_info?.value, '登录研究院招聘系统在线投递简历。');
  assert.equal(c.recruit_count?.value, '5人。');
  assert.equal(c.application_schedule?.value, '2026-11-01至2026-11-30。');
  assert.equal(c.contact?.value, 'hr@example.ac.cn。');
  for (const [key, candidate] of Object.entries(c)) {
    assert.ok(candidate.evidence.length >= 10, `${key} 证据片段应 ≥10 字符，实际 ${candidate.evidence.length}`);
    assert.ok(
      NORMALIZED_SOURCE.includes(candidate.evidence),
      `${key} 证据片段应能在规范化文本中命中：${candidate.evidence}`,
    );
  }
  assert.ok(c.education!.evidence.startsWith('学历要求：'));
  assert.ok(c.salary!.evidence.startsWith('薪资待遇：'));
  assert.ok(c.responsibilities!.evidence.startsWith('岗位职责：'));
  assert.ok(c.recruit_count!.evidence.startsWith('招聘人数：'));
  assert.ok(c.application_schedule!.evidence.startsWith('报名时间：'));
  assert.ok(c.contact!.evidence.startsWith('联系方式：'));
});

await test('extractCandidates：空页面返回 inaccessible，无标签页面返回空候选', () => {
  const empty = extractCandidates(makeJob(), '');
  assert.equal(empty.inaccessible, '页面内容为空');
  assert.deepEqual(empty.candidates, {});
  const blank = extractCandidates(makeJob(), normalizeHtml('<html><body><p>   </p></body></html>'));
  assert.equal(blank.inaccessible, '页面内容为空');
  const noLabel = extractCandidates(makeJob(), normalizeHtml(MISS_HTML));
  assert.deepEqual(noLabel.candidates, {});
  assert.equal(noLabel.inaccessible, undefined);
});

await test('extractCandidates：已有值的可写入字段跳过抽取', () => {
  const result = extractCandidates(makeJob({ education: '博士', salary: '面议' }), NORMALIZED_SOURCE);
  assert.equal(result.candidates.education, undefined);
  assert.equal(result.candidates.salary, undefined);
  assert.ok(result.candidates.responsibilities, '其余可写入键照常抽取');
  assert.ok(result.candidates.original_major_requirements, '其余可写入键照常抽取');
  assert.ok(result.candidates.recruit_count, '参考信息键不受已有值影响');
});

await test('applyConfirmed：记录不存在拒绝且不写库', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const before = readFileSync(batchPath, 'utf8');
  const result = await applyConfirmed(
    { '9999': { education: '博士', _evidence: { education: APPLY_EVIDENCE_EDUCATION } } },
    makeFixtureCatalog(),
    { jobsDir, fetchImpl: fetchByUrl({}), today: '2026-11-05' },
  );
  assert.deepEqual(result.applied, []);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].id, '9999');
  assert.ok(result.rejected[0].reason.includes('记录不存在'), `reason 实际为：${result.rejected[0].reason}`);
  assert.equal(readFileSync(batchPath, 'utf8'), before, '批次文件应字节级保持不变');
});

await test('applyConfirmed：证据不命中整条拒绝且不写库', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const before = readFileSync(batchPath, 'utf8');
  const result = await applyConfirmed(
    {
      '9002': {
        education: '硕士及以上',
        _evidence: { education: '这是一段绝不会出现在来源页里的证据片段文字' },
      },
    },
    makeFixtureCatalog(),
    { jobsDir, fetchImpl: fetchByUrl({ 'https://fixture.example.com/job-9002': PAGE_9002 }), today: '2026-11-05' },
  );
  assert.deepEqual(result.applied, []);
  assert.equal(result.rejected.length, 1);
  assert.ok(
    result.rejected[0].reason.includes('证据片段未在来源页命中'),
    `reason 实际为：${result.rejected[0].reason}`,
  );
  assert.equal(readFileSync(batchPath, 'utf8'), before, '整条拒绝不得产生任何写入');
});

await test('applyConfirmed：允许清单外字段与缺证据片段拒绝', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const before = readFileSync(batchPath, 'utf8');
  const result = await applyConfirmed(
    {
      '9002': {
        nonsense_field: '任意值',
        _evidence: { nonsense_field: '证据片段内容不影响字段清单校验结果' },
      },
      '9003': { description: '职责说明文字' },
    },
    makeFixtureCatalog(),
    { jobsDir, fetchImpl: fetchByUrl({}), today: '2026-11-05' },
  );
  assert.deepEqual(result.applied, []);
  assert.equal(result.rejected.length, 2);
  const reasons = result.rejected.map((item) => item.reason).join('；');
  assert.ok(reasons.includes('字段不在允许清单'), `reason 实际为：${reasons}`);
  assert.ok(reasons.includes('证据片段'), `reason 实际为：${reasons}`);
  assert.equal(readFileSync(batchPath, 'utf8'), before);
});

await test('applyConfirmed：_level 非升级请求（同级与降级）拒绝', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const before = readFileSync(batchPath, 'utf8');
  const result = await applyConfirmed(
    {
      '9003': {
        description: '职责说明文字',
        _evidence: { description: APPLY_EVIDENCE_RESPONSIBILITIES },
        _level: '关键字段核验',
      },
      '9002': {
        description: '职责说明文字',
        _evidence: { description: APPLY_EVIDENCE_RESPONSIBILITIES },
        _level: '待核实',
      },
    },
    makeFixtureCatalog(),
    { jobsDir, fetchImpl: fetchByUrl({}), today: '2026-11-05' },
  );
  assert.deepEqual(result.applied, []);
  assert.equal(result.rejected.length, 2);
  for (const item of result.rejected) {
    assert.ok(item.reason.includes('_level 非升级请求'), `reason 实际为：${item.reason}`);
  }
  assert.equal(readFileSync(batchPath, 'utf8'), before);
});

await test('applyConfirmed：合法确认写入批次（待核实自动升级 + 字段值/证据/last_verified）', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const result = await applyConfirmed(
    {
      '9001': {
        education: '博士研究生学历',
        salary: '年薪30-50万元（税前）',
        _evidence: {
          education: APPLY_EVIDENCE_EDUCATION,
          salary: APPLY_EVIDENCE_SALARY,
        },
      },
      '9999': { education: '博士', _evidence: { education: APPLY_EVIDENCE_EDUCATION } },
    },
    makeFixtureCatalog(),
    {
      jobsDir,
      fetchImpl: fetchByUrl({ 'https://fixture.example.com/job-9001': SOURCE_HTML }),
      today: '2026-11-05',
    },
  );
  assert.deepEqual(result.applied, [9001]);
  assert.equal(result.rejected.length, 1);
  assert.equal(result.rejected[0].id, '9999');

  const after = readFileSync(batchPath, 'utf8');
  assert.ok(after.includes('{"id":9001,'), '记录 9001 应替换为单行 JSON');
  assert.ok(!after.includes('{"id":9002'), '记录 9002 应保持原有排版');
  assert.ok(after.includes('"education":"博士研究生学历"'), '字段值应写入记录');
  assert.ok(after.includes('"salary":"年薪30-50万元（税前）"'), '字段值应写入记录');
  assert.ok(
    after.includes('"source_evidence":["学历要求：博士研究生学历，人工智能、计算机等相关专业毕业。","薪资待遇：年薪30-50万元（税前），缴纳五险一金。"]'),
    '两个证据片段应按字段顺序追加进 source_evidence',
  );
  assert.ok(after.includes('"verification_level":"关键字段核验"'), '待核实记录写入条件字段应自动升至关键字段核验');
  assert.ok(after.includes('"last_verified":"2026-11-05"'), 'last_verified 应更新为注入日期');
  assert.ok(after.includes('// 批次：fixture-a'), '批次头注释应保持不变');
  assert.ok(after.includes('既有证据片段甲'), '其他记录应保持不变');
});

await test('applyConfirmed：_level 升级写入层级并追加证据', async () => {
  const jobsDir = makeFixtureJobsDir();
  const batchPath = path.join(jobsDir, 'fixture-a.ts');
  const result = await applyConfirmed(
    {
      '9003': {
        responsibilities: '负责数据平台建设与维护，支持课题研究。',
        _evidence: { responsibilities: APPLY_EVIDENCE_RESPONSIBILITIES },
        _level: '来源核验',
      },
    },
    makeFixtureCatalog(),
    { jobsDir, fetchImpl: fetchByUrl({ 'https://fixture.example.com/job-9003': PAGE_9003 }), today: '2026-11-05' },
  );
  assert.deepEqual(result.applied, [9003]);
  assert.equal(result.rejected.length, 0);
  const after = readFileSync(batchPath, 'utf8');
  assert.ok(after.includes('"verification_level":"来源核验"'), '层级应按 _level 升级写入');
  assert.ok(
    after.includes('"source_evidence":["既有证据片段乙","岗位职责：负责数据平台建设与维护，支持课题研究。"]'),
    '新证据应追加在既有证据之后',
  );
});

await test('classifyRefresh：夹具分类（现行有效/来源过期/内容失配）', async () => {
  const job = makeJob();
  const url = job.source_url;

  const hit = await classifyRefresh(job, { fetchImpl: fetchByUrl({ [url]: SOURCE_HTML }) });
  assert.equal(hit.verdict, '现行有效');
  assert.equal(hit.http_status, 200);

  const expired = await classifyRefresh(job, { fetchImpl: fetchByUrl({ [url]: EXPIRED_HTML }) });
  assert.equal(expired.verdict, '来源过期');
  assert.ok(expired.note.includes('过期提示页'), `note 实际为：${expired.note}`);

  const notFound = await classifyRefresh(job, { fetchImpl: fetchByUrl({ [url]: { status: 404, body: 'Not Found' } }) });
  assert.equal(notFound.verdict, '来源过期');
  assert.equal(notFound.http_status, 404);

  const miss = await classifyRefresh(job, { fetchImpl: fetchByUrl({ [url]: MISS_HTML }) });
  assert.equal(miss.verdict, '内容失配');
  assert.ok(miss.note.includes('锚点不命中'), `note 实际为：${miss.note}`);

  const paused = await classifyRefresh(job, { fetchImpl: fetchByUrl({ [url]: PAUSED_HTML }) });
  assert.equal(paused.verdict, '内容失配');
  assert.ok(paused.note.includes('已暂停招聘'), `note 实际为：${paused.note}`);

  const networkError = await classifyRefresh(job, {
    fetchImpl: (async () => { throw new Error('connect ECONNRESET 1.2.3.4'); }) as typeof fetch,
  });
  assert.equal(networkError.verdict, '内容失配');
  assert.ok(networkError.note.includes('访问失败：'), `note 实际为：${networkError.note}`);
  assert.equal(networkError.http_status, null);
});

await test('缺省目标筛选口径（selectScanTargets / selectRefreshTargets）', () => {
  const catalog = [
    makeJob({ id: 1 }),
    makeJob({ id: 2, status: '招聘中', verification_level: '逐字段核验', education: '博士', original_major_requirements: '计算机' }),
    makeJob({ id: 3, status: '招聘中', verification_level: '逐字段核验', salary: '面议' }),
    makeJob({ id: 4, status: '招聘中', verification_level: '来源核验', application_info: '邮箱投递' }),
    makeJob({ id: 5, status: '招聘中', verification_level: '逐字段核验' }),
    makeJob({ id: 6, status: '招聘中', verification_level: '来源核验' }),
    makeJob({ id: 7, status: '招聘中', verification_level: '关键字段核验' }),
    makeJob({ id: 8, status: '已截止', verification_level: '关键字段核验' }),
  ];
  assert.deepEqual(
    selectScanTargets(catalog).map((job) => job.id),
    [1, 5, 6, 7, 8],
    'scan 缺省目标应为五项条件字段全为空的记录（与核验层级无关）',
  );
  assert.deepEqual(
    selectRefreshTargets(catalog).map((job) => job.id),
    [1, 4, 6, 7, 8],
    'refresh 缺省目标应为状态待核实 + 来源核验/关键字段核验记录（与条件字段无关）',
  );
});

const total = cases.length;
console.log(`\nsource-tools 模块测试：通过 ${passed}/${total}`);
if (failures.length > 0) {
  console.error(`失败明细：${failures.join('；')}`);
  process.exitCode = 1;
}

}

main().catch((error) => {
  console.error(`测试执行异常：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
