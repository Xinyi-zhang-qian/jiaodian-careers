/**
 * jobs-ui 模块测试：覆盖 docs/modules/jobs-ui_interaction.md §2–§5 与
 * docs/interaction.md §6、§7、§13（断言 1–4）。
 * 运行：npx tsx scripts/tests/jobs-ui.test.ts
 */
import assert from 'node:assert/strict';
import {
  filterJobs,
  getJobs,
  deadlineDaysLeft,
  deadlineBadgeLabel,
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

test('已过期日期不显示徽标', () => {
  assert.equal(deadlineBadgeLabel(makeJob(1, { deadline: '2026-11-01' }), TODAY), null);
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
