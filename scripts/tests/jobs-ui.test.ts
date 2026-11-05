/**
 * jobs-ui 模块测试：覆盖 docs/modules/jobs-ui_interaction.md §2–§4 与
 * docs/interaction.md §6、§7、§13（断言 1–4）、docs/design.md §4 契约 19。
 * 第 2 轮新增：报名已截止过期标识（含与即将截止互斥）、「条件见来源」收敛（hasConditionInfo）、
 * 卡片与详情页展示接线（源码结构断言）。
 * 运行：npx tsx scripts/tests/jobs-ui.test.ts
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  filterJobs,
  getJobs,
  deadlineDaysLeft,
  deadlineBadgeLabel,
  hasConditionInfo,
  applicationWindow,
} from '../../src/lib/data';
import { JOB_FUNCTIONS } from '../../src/lib/utils';
import jobsCatalog from '../../src/data/jobs';
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
    education: '博士',
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

// 固定「今天」为 2026-11-04（本地时区日期部分），保证断言不随运行日期漂移。
const TODAY = new Date(2026, 10, 4);

// 混合目录：两条标注职能、一条无 job_functions 字段。
const mixedCatalog: Job[] = [
  makeJob(1, { title: '算法工程师', job_functions: ['算法', '工程'] }),
  makeJob(2, { title: '数据研究员', org_type: '企业', job_functions: ['数据'] }),
  makeJob(3, { title: '无职能标注岗位' }),
];

// —— 极简断言框架 ————————————————————————————————————————————

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

// —— 职能筛选（模块交互文档 §2） —————————————————————————————

test('职能筛选只命中标注该职能的记录', () => {
  const result = filterJobs(mixedCatalog, { job_function: '算法' });
  assert.deepEqual(result.map((j) => j.id), [1]);
});

test('职能筛选对无 job_functions 字段的记录不命中', () => {
  const result = filterJobs(mixedCatalog, { job_function: '数据' });
  assert.deepEqual(result.map((j) => j.id), [2]);
});

test('非枚举职能值视为不过滤', () => {
  const result = filterJobs(mixedCatalog, { job_function: '不存在的职能' });
  assert.equal(result.length, mixedCatalog.length);
});

test('空串与缺省职能值视为不过滤', () => {
  assert.equal(filterJobs(mixedCatalog, { job_function: '' }).length, mixedCatalog.length);
  assert.equal(filterJobs(mixedCatalog, {}).length, mixedCatalog.length);
});

test('职能筛选与单位类型 AND 组合', () => {
  const both = filterJobs(mixedCatalog, { job_function: '数据', org_type: '企业' });
  assert.deepEqual(both.map((j) => j.id), [2]);
  const none = filterJobs(mixedCatalog, { job_function: '数据', org_type: '高校' });
  assert.equal(none.length, 0);
});

test('getJobs 对全量目录的职能过滤行为一致', () => {
  assert.equal(getJobs({}).total, jobsCatalog.length);
  assert.equal(getJobs({ job_function: '非枚举值' }).total, jobsCatalog.length);
});

// —— deadlineDaysLeft（模块交互文档 §3） ——————————————————————

test('无 deadline 返回 null', () => {
  assert.equal(deadlineDaysLeft(makeJob(1), TODAY), null);
  assert.equal(deadlineDaysLeft(makeJob(2, { deadline: '' }), TODAY), null);
});

test('status 已截止返回 null', () => {
  assert.equal(
    deadlineDaysLeft(makeJob(1, { deadline: '2026-11-07', status: '已截止' }), TODAY),
    null
  );
});

test('deadline 当天返回 0', () => {
  assert.equal(deadlineDaysLeft(makeJob(1, { deadline: '2026-11-04' }), TODAY), 0);
});

test('未来 3 天返回 3', () => {
  assert.equal(deadlineDaysLeft(makeJob(1, { deadline: '2026-11-07' }), TODAY), 3);
});

test('过去日期返回负数', () => {
  assert.equal(deadlineDaysLeft(makeJob(1, { deadline: '2026-11-01' }), TODAY), -3);
});

test('非法日期返回 null', () => {
  assert.equal(deadlineDaysLeft(makeJob(1, { deadline: '2026-02-30' }), TODAY), null);
  assert.equal(deadlineDaysLeft(makeJob(2, { deadline: '2026/11/07' }), TODAY), null);
  assert.equal(deadlineDaysLeft(makeJob(3, { deadline: '11-07' }), TODAY), null);
});

test('状态待核实的记录仍按 deadline 计算', () => {
  assert.equal(
    deadlineDaysLeft(makeJob(1, { deadline: '2026-11-07', status: '状态待核实' }), TODAY),
    3
  );
});

// —— deadlineBadgeLabel（即将截止判定，interaction.md §6/§7/§13.4） ——

test('剩余 3 天且招聘中显示 3 天后截止', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-07' }), TODAY), '3 天后截止');
});

test('deadline 当天显示今天截止', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-04' }), TODAY), '今天截止');
});

test('剩余 7 天仍在展示边界内', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-11' }), TODAY), '7 天后截止');
});

test('剩余 8 天不显示徽标', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-12' }), TODAY), null);
});

test('已过期且招聘中显示报名已截止', () => {
  // 第 2 轮规格变更：原断言「已过期日期不显示徽标」与 docs/design.md §4 契约 19 冲突，
  // 按新规格 deadline 早于当日且「招聘中」时返回「报名已截止」（界面以中性灰徽标渲染）。
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-01' }), TODAY), '报名已截止');
});

test('已截止状态即使 deadline 已过也不显示报名已截止', () => {
  // 「已截止」已有独立状态徽标，返回 null 避免重复；「状态待核实」维持不展示。
  assert.equal(
    deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-01', status: '已截止' }), TODAY),
    null
  );
  assert.equal(
    deadlineBadgeLabel(makeJob(2, { deadline: '2026-11-01', status: '状态待核实' }), TODAY),
    null
  );
});

test('报名已截止与即将截止互斥且各情形文案唯一', () => {
  const cases: Array<[string | null, string | null]> = [
    ['2026-11-01', '报名已截止'], // -3 天
    ['2026-11-03', '报名已截止'], // -1 天
    ['2026-11-04', '今天截止'], // 0 天
    ['2026-11-07', '3 天后截止'],
    ['2026-11-11', '7 天后截止'],
    ['2026-11-12', null], // 8 天
    [null, null],
  ];
  for (const [deadline, expected] of cases) {
    const label = deadlineBadgeLabel(makeJob(1, { deadline }), TODAY);
    assert.equal(label, expected, `deadline=${deadline}`);
    // 同一记录同一时刻只落入一种语义：要么灰色「报名已截止」，要么红色「即将截止」系文案。
    if (label !== null) {
      assert.notEqual(
        label === '报名已截止',
        /天后截止|今天截止/.test(label),
        `deadline=${deadline} 的文案同时落入两种标识语义`
      );
    }
  }
});

test('已截止与状态待核实不显示徽标', () => {
  assert.equal(
    deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-07', status: '已截止' }), TODAY),
    null
  );
  assert.equal(
    deadlineBadgeLabel(makeJob(2, { deadline: '2026-11-07', status: '状态待核实' }), TODAY),
    null
  );
});

test('无 deadline 不显示徽标', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1), TODAY), null);
});

// —— applicationWindow（报名窗口渲染判定，interaction.md §7/§13.5） ——

test('有报名开始日期的具体岗位展示报名窗口', () => {
  const view = applicationWindow(makeJob(1, { application_opens_at: '2026-11-01' }), '具体岗位');
  assert.equal(view.visible, true);
  assert.equal(view.publicRecruitNotice, false);
});

test('有报名截止日期的具体岗位展示报名窗口', () => {
  const view = applicationWindow(makeJob(1, { deadline: '2026-11-30' }), '具体岗位');
  assert.equal(view.visible, true);
  assert.equal(view.publicRecruitNotice, false);
});

test('仅有报名方式的具体岗位也展示报名窗口', () => {
  const view = applicationWindow(
    makeJob(1, { application_info: '请将简历发送至 hr@example.com' }),
    '具体岗位'
  );
  assert.equal(view.visible, true);
  assert.equal(view.publicRecruitNotice, false);
});

test('事业单位公告级条目展示报名窗口并突出标注', () => {
  const view = applicationWindow(makeJob(1, { org_type: '事业单位' }), '招聘公告');
  assert.equal(view.visible, true);
  assert.equal(view.publicRecruitNotice, true);
});

test('企业公告级条目不突出标注', () => {
  const view = applicationWindow(makeJob(1, { org_type: '企业' }), '招聘公告');
  assert.equal(view.visible, true);
  assert.equal(view.publicRecruitNotice, false);
});

test('具体岗位且无任何报名字段不展示报名窗口', () => {
  const view = applicationWindow(makeJob(1), '具体岗位');
  assert.equal(view.visible, false);
  assert.equal(view.publicRecruitNotice, false);
});

// —— hasConditionInfo（「条件见来源」收敛，design.md 契约 19 / 模块交互文档 §3） ——

test('条件字段全空判定为无条件信息', () => {
  const empty = makeJob(1, {
    original_major_requirements: '',
    education: '',
    salary: null,
    responsibilities: '',
    application_info: '',
  });
  assert.equal(hasConditionInfo(empty), false);
});

test('任一条件字段非空判定为有条件信息', () => {
  const cases: Array<[string, Partial<Job>]> = [
    ['原公告资格条件', { original_major_requirements: '哲学或相关人文社科专业' }],
    ['学历', { education: '硕士及以上' }],
    ['薪资', { salary: '年薪 30 万' }],
    ['职责', { responsibilities: '负责交叉学科研究' }],
    ['报名方式', { application_info: '请于报名窗口内在线提交' }],
  ];
  for (const [name, overrides] of cases) {
    assert.equal(hasConditionInfo(makeJob(1, overrides)), true, `字段「${name}」非空应为有条件信息`);
  }
});

// —— 卡片与详情页展示接线（模块交互文档 §4 界面断言 1/2/5，源码结构断言） ——

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const cardSrc = readFileSync(path.join(repoRoot, 'src/components/jobs/job-card.tsx'), 'utf8');
const detailSrc = readFileSync(path.join(repoRoot, 'src/app/jobs/[id]/page.tsx'), 'utf8');

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1;
}

test('统一提示在卡片与详情页各出现一次且无零散兜底', () => {
  assert.equal(countOccurrences(cardSrc, '条件信息请见来源公告'), 1, 'job-card.tsx 恰好一处');
  assert.equal(countOccurrences(detailSrc, '条件信息请见来源公告'), 1, 'jobs/[id]/page.tsx 恰好一处');
  assert.equal(cardSrc.includes('条件见来源'), false, '卡片不应再含零散「条件见来源」兜底文案');
  assert.equal(detailSrc.includes('条件见来源'), false, '详情页不应含零散「条件见来源」兜底文案');
});

test('卡片与详情页经 hasConditionInfo 判定提示条显隐', () => {
  assert.ok(cardSrc.includes('hasConditionInfo'), 'job-card.tsx 应引用 hasConditionInfo');
  assert.ok(detailSrc.includes('hasConditionInfo'), '详情页应引用 hasConditionInfo');
});

test('报名已截止徽标样式区别于红色即将截止与灰色已截止徽标', () => {
  const grayCard = cardSrc.match(/isExpiredBadge\s*\?\s*'([^']+)'/);
  const grayDetail = detailSrc.match(/isExpiredBadge\s*\?\s*'([^']+)'/);
  assert.ok(grayCard, '卡片应存在「报名已截止」灰样式分支');
  assert.ok(grayDetail, '详情页应存在「报名已截止」灰样式分支');
  for (const [name, gray, src] of [
    ['job-card.tsx', grayCard![1], cardSrc],
    ['jobs/[id]/page.tsx', grayDetail![1], detailSrc],
  ] as Array<[string, string, string]>) {
    assert.ok(gray.includes('bg-muted'), `${name} 灰徽标应使用中性灰底色`);
    assert.ok(!gray.includes('bg-red-600'), `${name} 灰徽标不应复用红色「即将截止」底色`);
    assert.ok(
      !gray.includes('bg-text-secondary/10'),
      `${name} 灰徽标不应复用既有「已截止」状态徽标底色`
    );
  }
  assert.ok(cardSrc.includes('bg-red-600'), '卡片红色「即将截止」分支应保留');
  assert.ok(detailSrc.includes('bg-red-600'), '详情页红色「即将截止」分支应保留');
});

// —— 职能枚举契约（design.md 契约 12） ———————————————————————

test('JOB_FUNCTIONS 与职能枚举契约一致', () => {
  assert.deepEqual(
    [...JOB_FUNCTIONS],
    ['项目管理', '产品经理', 'AI伦理', '算法', '工程', '数据', '科研', '编辑出版', '综合管理', '其他']
  );
});

// —— 汇总 ——————————————————————————————————————————————————

if (failures.length > 0) {
  console.error(`\n共 ${passed + failures.length} 个用例，${failures.length} 个失败：`);
  failures.forEach((f) => console.error(` - ${f}`));
  process.exit(1);
}
console.log(`\n共 ${passed + failures.length} 个用例，全部通过。`);
