// site-design 模块测试：首页职能入口计数逻辑、渲染接线、README 规范断言与徽标语义色。
// 运行方式：npx tsx scripts/tests/site-design.test.ts（或合并后 npm run test 聚合）
// 断言依据：docs/modules/site-design_interaction.md §2/§3 与 docs/interaction.md §3/§5。
import { deepStrictEqual, ok, strictEqual } from 'node:assert';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Job } from '../../src/lib/types';
import { getJobFunctionEntries } from '../../src/lib/job-function-stats';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');

// 夹具工厂：构造一条最小合法 Job 记录，可选携带 job_functions。
function makeJob(id: number, jobFunctions?: string[]): Job {
  return {
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
    education: '硕士',
    experience: '',
    salary: null,
    description: '',
    responsibilities: '',
    application_info: '',
    published_at: '2026-01-01',
    deadline: null,
    source_name: '测试来源',
    source_type: '官网',
    source_url: 'https://example.com/job',
    fetched_at: '2026-01-01',
    last_verified: '2026-01-01',
    status: '招聘中',
    is_demo: false,
    ...(jobFunctions ? { job_functions: jobFunctions } : {}),
  } as Job;
}

// 一、职能入口计数逻辑（getJobFunctionEntries）：
// 计数 >0 的职能按计数降序出现、计数 0 的不出现、无 job_functions 字段不计入、
// 多职能各计一次、枚举外职能不计、全零返回空数组、输入不被修改。
{
  const jobs = [
    makeJob(1, ['项目管理']),
    makeJob(2, ['项目管理', '数据']),
    makeJob(3, ['产品经理']),
    makeJob(4), // 无 job_functions 字段
    makeJob(5, ['工程']),
    makeJob(6, ['枚举外职能']), // 枚举外值不计入任何职能
  ];
  const snapshot = JSON.stringify(jobs);

  const entries = getJobFunctionEntries(jobs);

  deepStrictEqual(
    entries.map((entry) => entry.name),
    ['项目管理', '产品经理', '工程', '数据'],
    '应只含计数 >0 的职能并按计数降序（同数按枚举顺序：产品经理、工程、数据）',
  );
  strictEqual(entries[0].count, 2, '项目管理应计 2（多职能记录在每个职能下各计一次）');
  deepStrictEqual(
    entries.slice(1).map((entry) => entry.count),
    [1, 1, 1],
    '产品经理、工程、数据应各计 1',
  );
  ok(!entries.some((entry) => entry.name === 'AI伦理'), '计数为 0 的职能不应出现');
  ok(!entries.some((entry) => entry.name === '枚举外职能'), '枚举外职能名不应出现');
  strictEqual(JSON.stringify(jobs), snapshot, '输入数组不应被修改');

  const empty = getJobFunctionEntries([makeJob(7), makeJob(8, [])]);
  deepStrictEqual(empty, [], '全部职能计数为 0 时应返回空数组（首页整块不渲染）');

  console.log('通过：职能入口计数逻辑');
}

// 二、首页职能入口渲染接线：page.tsx 引用计数函数、以 /jobs?function= 跳转、
// 经全量列表本地统计而不调用 getJobs 的 job_function 过滤参数。
{
  const pageSource = readFileSync(path.join(repoRoot, 'src/app/page.tsx'), 'utf8');

  ok(
    /from '@\/lib\/job-function-stats'/.test(pageSource),
    'page.tsx 应从 src/lib/job-function-stats 导入计数结果',
  );
  ok(/getJobFunctionEntries\(/.test(pageSource), 'page.tsx 应调用 getJobFunctionEntries 渲染职能入口');
  ok(/\/jobs\?function=/.test(pageSource), '职能卡应链接 /jobs?function={枚举值}');
  ok(
    /getJobs\(\{ limit: 1000 \}\)/.test(pageSource),
    '应经 getJobs({ limit: 1000 }).jobs 取全量后本地统计',
  );
  ok(
    !/getJobs\(\{[^}]*job_function/.test(pageSource),
    '首页计数采用全量本地统计的现行实现（不依赖 getJobs 的 job_function 过滤参数）',
  );

  console.log('通过：首页职能入口渲染接线');
}

// 三、README 数据增补指引与命令一致性：
// 「数据增补指引」节含 add:jobs 用法、14 个必填字段、证据要求与 audit 门禁；
// 全文不再出现 update.sh 与 Vercel；npm run 命令与 package.json scripts 一致。
{
  const readme = readFileSync(path.join(repoRoot, 'README.md'), 'utf8');
  const pkg = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')) as {
    scripts: Record<string, string>;
  };

  const guideMatch = readme.match(/## 数据增补指引[\s\S]*?(?=\n## |$)/);
  ok(guideMatch, 'README 应含「数据增补指引」节');
  const guide = guideMatch ? guideMatch[0] : '';

  ok(guide.includes('npm run add:jobs -- '), '指引节应写明 add:jobs 用法');
  ok(guide.includes('--batch'), '指引节应写明 --batch 批次参数');
  const requiredFields = [
    'title',
    'organization',
    'province',
    'city',
    'org_type',
    'job_type',
    'source_url',
    'source_name',
    'source_type',
    'published_at',
    'status',
    'verification_level',
    'source_title',
    'source_evidence',
  ];
  for (const field of requiredFields) {
    ok(guide.includes(field), `指引节应列明必填字段 ${field}`);
  }
  ok(guide.includes('逐字段核验'), '指引节应写明核验层级');
  ok(guide.includes('audit:jobs'), '指引节应写明 audit:jobs 门禁');

  ok(!readme.includes('update.sh'), 'README 不应再出现 update.sh 表述');
  ok(!/vercel/i.test(readme), 'README 不应再出现 Vercel 表述（现部署为 Render）');

  // 运行命令一致性：README 中每个 npm run X 均登记于 package.json scripts；
  // 并行开发期内 add:jobs、recheck:legacy、test 为跨模块桩例外（登记由其他分支交付）。
  const stubCommands = new Set(['add:jobs', 'recheck:legacy', 'test']);
  const referenced = new Set<string>();
  for (const match of readme.matchAll(/npm run ([a-zA-Z0-9:_-]+)/g)) {
    referenced.add(match[1]);
  }
  for (const command of referenced) {
    ok(
      command in pkg.scripts || stubCommands.has(command),
      `README 中的 npm run ${command} 应登记于 package.json scripts（或属跨模块桩例外）`,
    );
  }
  for (const literal of ['npm ci', 'npm run dev', 'npm run build', 'npm run test']) {
    ok(readme.includes(literal), `README 本地运行应写明 ${literal}`);
  }

  console.log('通过：README 数据增补指引与命令一致性');
}

// 四、徽标语义色变量登记：@theme 含五组核验语义色与浅底色，既有变量取值不变。
{
  const css = readFileSync(path.join(repoRoot, 'src/app/globals.css'), 'utf8');
  const themeMatch = css.match(/@theme \{[\s\S]*?\n\}/);
  ok(themeMatch, 'globals.css 应含 @theme 主题块');
  const theme = themeMatch ? themeMatch[0] : '';

  const semanticTokens = [
    '--color-verified',
    '--color-verified-soft',
    '--color-source-verified',
    '--color-source-verified-soft',
    '--color-key-verified',
    '--color-key-verified-soft',
    '--color-pending',
    '--color-pending-soft',
    '--color-upcoming',
    '--color-upcoming-soft',
  ];
  for (const token of semanticTokens) {
    ok(theme.includes(token), `@theme 应登记语义色变量 ${token}`);
  }

  const existingTokens = [
    '--color-background: #F5F3EF;',
    '--color-surface: #FFFFFF;',
    '--color-text-primary: #283330;',
    '--color-text-secondary: #626B66;',
    '--color-brand: #61766B;',
    '--color-brand-light: #7A8F84;',
    '--color-brand-dark: #4A5E52;',
    '--color-secondary: #7E909C;',
    '--color-accent: #A07868;',
    '--color-border: #E2E5DF;',
    '--color-border-light: #EEF0EC;',
    '--color-muted: #F7F6F3;',
    '--color-demo: #D4A373;',
  ];
  for (const token of existingTokens) {
    ok(theme.includes(token), `既有主题变量取值应保持不变：${token}`);
  }

  console.log('通过：徽标语义色变量登记');
}
