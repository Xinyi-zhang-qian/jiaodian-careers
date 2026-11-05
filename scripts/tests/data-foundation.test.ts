// data-foundation 模块测试：jobsCatalog 完整性、audit:jobs:offline 门禁、
// add:jobs 校验矩阵与整批写入行为。
// 运行方式：npm run test（scripts/tests/run-all.ts 聚合）或 npx tsx scripts/tests/data-foundation.test.ts
// 断言依据：docs/modules/data-foundation_interaction.md §2/§3 与 docs/interaction.md §11。
import { ok, strictEqual } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import jobsCatalog from '../../src/data/jobs';
import { validateJobRecord } from '../add-jobs';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, '../..');
const tsxCli = path.join(repoRoot, 'node_modules/tsx/dist/cli.mjs');
const existingIds = new Set(jobsCatalog.map((job) => job.id));

// 一、jobsCatalog 完整性：总数 169、ID 唯一、层级分布 128/31/10（第 1 轮迁移后 188；data-refresh 2026-11-05 全量来源分类与处置：
// 删除 19 条 JS 渲染壳/404/反爬且重新检索无现行可核验来源的记录，充实 107 条并升级层级，439/214/444 因来源可核验性回落调整，2016 状态改「已截止」）
{
  strictEqual(jobsCatalog.length, 169, 'jobsCatalog 总数应为 169');
  strictEqual(new Set(jobsCatalog.map((job) => job.id)).size, 169, 'id 应全目录唯一');
  const countBy = (level: string) => jobsCatalog.filter((job) => job.verification_level === level).length;
  strictEqual(countBy('逐字段核验'), 128, '逐字段核验应为 128 条');
  strictEqual(countBy('来源核验'), 31, '来源核验应为 31 条');
  strictEqual(countBy('关键字段核验'), 10, '关键字段核验应为 10 条');
  console.log('通过：jobsCatalog 完整性');
}

// 二、audit:jobs:offline 通过：退出码 0 且输出 169 条与三级核验计数
{
  const result = spawnSync(
    process.execPath,
    [tsxCli, path.join(repoRoot, 'scripts/audit-verified-jobs.ts'), '--offline'],
    { encoding: 'utf8', cwd: repoRoot },
  );
  strictEqual(result.status, 0, `audit:jobs:offline 退出码应为 0；stderr：${result.stderr}`);
  ok(
    result.stdout.includes('Audited 169 public jobs (128 field-level, 31 source-level, 10 key-field)'),
    `应输出 169 条与三级核验计数；stdout：${result.stdout}`,
  );
  console.log('通过：audit:jobs:offline');
}

// 三、add:jobs 校验矩阵（validateJobRecord）：合法通过 + 七类非法输入按字段名拒绝 + 未知字段拒绝
{
  const baseRecord = {
    title: '测试岗位',
    organization: '测试单位',
    province: '北京',
    city: '北京',
    org_type: '企业',
    job_type: '工程',
    source_url: 'https://example.com/job/1',
    source_name: '测试来源',
    source_type: '官网',
    published_at: '2026-11-01',
    status: '招聘中',
    verification_level: '来源核验',
    source_title: '测试岗位招聘公告',
    source_evidence: ['测试岗位招聘公告'],
  };

  strictEqual(validateJobRecord({ ...baseRecord }, existingIds).length, 0, '合法记录应零错误');

  const expectError = (record: Record<string, unknown>, field: string, note: string) => {
    const errors = validateJobRecord(record, existingIds);
    ok(errors.length > 0, `${note}：应被拒绝`);
    ok(
      errors.some((message) => message.includes(field)),
      `${note}：错误信息应含字段名 ${field}；实际：${errors.join('；')}`,
    );
  };

  expectError({ ...baseRecord, source_title: undefined }, 'source_title', '缺 source_title');
  expectError({ ...baseRecord, source_evidence: [] }, 'source_evidence', '缺 source_evidence');
  expectError({ ...baseRecord, org_type: '政府' }, 'org_type', 'org_type 枚举外取值');
  expectError({ ...baseRecord, status: '已下架' }, 'status', 'status 枚举外取值');
  expectError({ ...baseRecord, published_at: '2026/11/01' }, 'published_at', 'published_at 非法日期格式');
  expectError(
    { ...baseRecord, application_opens_at: '2026-12-01', deadline: '2026-11-30' },
    'application_opens_at',
    'application_opens_at 晚于 deadline',
  );
  expectError({ ...baseRecord, job_functions: ['编程'] }, 'job_functions', 'job_functions 枚举外取值');
  expectError({ ...baseRecord, id: 999 }, 'id', '输入携带 id 字段');
  expectError({ ...baseRecord, 非模式字段: 'x' }, '非模式字段', '输入携带 Job 模式未知字段');
  console.log('通过：add:jobs 校验矩阵');
}

// 四、add:jobs 整批写入行为：经 --jobs-dir 注入临时目录隔离写入
{
  const runAddJobs = (jsonPath: string, batch: string, jobsDir: string) =>
    spawnSync(
      process.execPath,
      [tsxCli, path.join(repoRoot, 'scripts/add-jobs.ts'), jsonPath, '--batch', batch, '--jobs-dir', jobsDir],
      { encoding: 'utf8', cwd: repoRoot },
    );

  const pristineIndex = readFileSync(path.join(repoRoot, 'src/data/jobs/index.ts'), 'utf8');
  const realMaxId = Math.max(...jobsCatalog.map((job) => job.id));
  const validNewRecord = {
    title: '新增测试岗位',
    organization: '测试单位',
    province: '北京',
    city: '北京',
    org_type: '企业',
    job_type: '工程',
    source_url: 'https://example.com/job/new-1',
    source_name: '测试来源',
    source_type: '官网',
    published_at: '2026-11-01',
    status: '招聘中',
    verification_level: '来源核验',
    source_title: '新增测试岗位招聘公告',
    source_evidence: ['新增测试岗位招聘公告'],
  };

  // 4a 合法批次：重复记录跳过、ID 自动分配、批次文件与 index.ts 更新
  const sandboxA = mkdtempSync(path.join(os.tmpdir(), 'data-foundation-a-'));
  const jobsDirA = path.join(sandboxA, 'jobs');
  mkdirSync(jobsDirA);
  writeFileSync(path.join(jobsDirA, 'index.ts'), pristineIndex);
  const duplicateSource = jobsCatalog[0];
  const inputFileA = path.join(sandboxA, 'input.json');
  writeFileSync(
    inputFileA,
    JSON.stringify([
      { title: duplicateSource.title, organization: duplicateSource.organization, source_url: duplicateSource.source_url },
      validNewRecord,
    ]),
  );
  const resultA = runAddJobs(inputFileA, 'test-batch', jobsDirA);
  strictEqual(resultA.status, 0, `合法批次应以退出码 0 结束；stderr：${resultA.stderr}\nstdout：${resultA.stdout}`);
  ok(resultA.stdout.includes('跳过'), '重复记录应输出跳过提示');
  ok(resultA.stdout.includes('Added 1 jobs'), `应写入 1 条；stdout：${resultA.stdout}`);
  const batchFileA = readFileSync(path.join(jobsDirA, 'test-batch.ts'), 'utf8');
  ok(batchFileA.includes(`"id":${realMaxId + 1}`), `新记录应自动分配 ID ${realMaxId + 1}`);
  const indexA = readFileSync(path.join(jobsDirA, 'index.ts'), 'utf8');
  ok(indexA.includes("import testBatch from './test-batch';"), 'index.ts 应新增批次 import 行');
  ok(indexA.includes('...testBatch'), 'index.ts 聚合行应追加新批次');
  rmSync(sandboxA, { recursive: true, force: true });
  console.log('通过：add:jobs 合法批次写入与 ID 自动分配');

  // 4b 含非法记录的批次：整批拒绝、退出码 1、无任何文件写入
  const sandboxB = mkdtempSync(path.join(os.tmpdir(), 'data-foundation-b-'));
  const jobsDirB = path.join(sandboxB, 'jobs');
  mkdirSync(jobsDirB);
  writeFileSync(path.join(jobsDirB, 'index.ts'), pristineIndex);
  const inputFileB = path.join(sandboxB, 'input.json');
  writeFileSync(
    inputFileB,
    JSON.stringify([
      { ...validNewRecord, title: '另一新增测试岗位', source_url: 'https://example.com/job/new-2' },
      { ...validNewRecord, title: '非法日期岗位', source_url: 'https://example.com/job/new-3', published_at: '2026/11/01' },
    ]),
  );
  const resultB = runAddJobs(inputFileB, 'test-batch', jobsDirB);
  strictEqual(resultB.status, 1, '含非法记录的批次应以退出码 1 拒绝');
  ok(!existsSync(path.join(jobsDirB, 'test-batch.ts')), '整批拒绝时不得创建批次文件');
  strictEqual(readFileSync(path.join(jobsDirB, 'index.ts'), 'utf8'), pristineIndex, '整批拒绝时 index.ts 不得被修改');
  ok(resultB.stderr.includes('published_at'), `错误输出应含非法字段名；stderr：${resultB.stderr}`);
  rmSync(sandboxB, { recursive: true, force: true });
  console.log('通过：add:jobs 整批拒绝且无写入');

  // 4c 非 kebab-case 批次名：拒绝且无写入
  const sandboxC = mkdtempSync(path.join(os.tmpdir(), 'data-foundation-c-'));
  const jobsDirC = path.join(sandboxC, 'jobs');
  mkdirSync(jobsDirC);
  writeFileSync(path.join(jobsDirC, 'index.ts'), pristineIndex);
  const inputFileC = path.join(sandboxC, 'input.json');
  writeFileSync(inputFileC, JSON.stringify([validNewRecord]));
  const resultC = runAddJobs(inputFileC, 'Bad_Batch', jobsDirC);
  strictEqual(resultC.status, 1, '非 kebab-case 批次名应以退出码 1 拒绝');
  ok(!existsSync(path.join(jobsDirC, 'Bad_Batch.ts')), '批次名非法时不得创建批次文件');
  strictEqual(readFileSync(path.join(jobsDirC, 'index.ts'), 'utf8'), pristineIndex, '批次名非法时 index.ts 不得被修改');
  rmSync(sandboxC, { recursive: true, force: true });
  console.log('通过：add:jobs 批次名校验');
}
