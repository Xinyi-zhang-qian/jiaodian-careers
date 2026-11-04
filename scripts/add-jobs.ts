// add:jobs 增补录入入口：npm run add:jobs -- <json路径> --batch <批次名>
// 流程：读 JSON → 逐条校验（任一失败整批拒绝、无任何文件写入）→ 与现有目录重复的记录跳过
// → 自动分配 ID（现有最大 id+1 递增）→ 创建/追加批次文件 → 更新 index.ts 聚合行
// → 自动执行 audit:jobs:offline 并回显计数。
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Job } from '../src/lib/types';
import { JOB_FUNCTIONS, ORG_TYPES, JOB_STATUSES } from '../src/lib/utils';
import jobsCatalog from '../src/data/jobs';

const SOURCE_TYPES = ['官网', '政府', '其他'] as const;
const VERIFICATION_LEVELS = ['待核实', '关键字段核验', '来源核验', '逐字段核验'] as const;
const RECRUIT_TYPES = ['校招', '社招'] as const;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const BATCH_NAME_PATTERN = /^[a-z0-9-]+$/;

// Job 接口全部字段名（types.ts）；用于拒绝未知字段，保证批次文件满足 Job 类型。
const JOB_FIELDS = [
  'id', 'title', 'organization', 'province', 'city', 'location', 'org_type', 'job_type',
  'original_major_requirements', 'platform_disciplines', 'required_skills', 'preferred_skills',
  'education', 'experience', 'salary', 'description', 'responsibilities', 'application_info',
  'published_at', 'deadline', 'source_name', 'source_type', 'source_url', 'fetched_at',
  'last_verified', 'status', 'is_demo', 'recruit_type', 'verification_level', 'source_title',
  'source_evidence', 'application_opens_at', 'job_functions',
];

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// 单条记录校验（规格见 docs/modules/data-foundation_interaction.md §3）；
// existingIds 供输入携带 id 时做目录冲突诊断（id 正常路径由脚本自动分配）。
export function validateJobRecord(record: unknown, existingIds: Set<number>): string[] {
  const errors: string[] = [];
  if (typeof record !== 'object' || record === null || Array.isArray(record)) {
    return ['记录必须是对象'];
  }
  const rec = record as Record<string, unknown>;

  if ('id' in rec) {
    errors.push('字段 id 不允许出现在输入中（ID 由脚本自动分配）');
    if (existingIds.has(rec.id as number)) errors.push(`字段 id 与现有目录冲突：${String(rec.id)}`);
  }
  for (const key of Object.keys(rec)) {
    if (!JOB_FIELDS.includes(key)) errors.push(`字段 ${key} 不在 Job 模式中，拒绝写入`);
  }

  const requireText = (field: string) => {
    if (!isNonEmptyString(rec[field])) errors.push(`字段 ${field} 必填且为非空字符串`);
  };
  requireText('title');
  requireText('organization');
  requireText('province');
  requireText('city');
  requireText('job_type');
  requireText('source_name');
  requireText('source_title');

  const requireEnum = (field: string, values: readonly string[]) => {
    const value = rec[field];
    if (value === undefined) errors.push(`字段 ${field} 必填`);
    else if (typeof value !== 'string' || !values.includes(value)) {
      errors.push(`字段 ${field} 取值非法：${String(value)}（允许：${values.join('、')}）`);
    }
  };
  requireEnum('org_type', ORG_TYPES);
  requireEnum('source_type', SOURCE_TYPES);
  requireEnum('status', JOB_STATUSES);
  requireEnum('verification_level', VERIFICATION_LEVELS);

  if (!isNonEmptyString(rec.source_url) || !/^https?:\/\//.test(rec.source_url)) {
    errors.push('字段 source_url 必填且必须以 http:// 或 https:// 开头');
  }
  if (!isNonEmptyString(rec.published_at) || !DATE_PATTERN.test(rec.published_at)) {
    errors.push('字段 published_at 必填且格式必须为 YYYY-MM-DD');
  }
  const evidence = rec.source_evidence;
  if (!Array.isArray(evidence) || evidence.length === 0 || !evidence.every((item) => isNonEmptyString(item))) {
    errors.push('字段 source_evidence 必填且为非空的字符串数组');
  }

  if (rec.application_opens_at !== undefined
    && (!isNonEmptyString(rec.application_opens_at) || !DATE_PATTERN.test(rec.application_opens_at))) {
    errors.push('字段 application_opens_at 格式必须为 YYYY-MM-DD');
  }
  if (rec.deadline !== undefined && rec.deadline !== null
    && (!isNonEmptyString(rec.deadline) || !DATE_PATTERN.test(rec.deadline))) {
    errors.push('字段 deadline 格式必须为 YYYY-MM-DD 或为 null');
  }
  if (isNonEmptyString(rec.application_opens_at) && isNonEmptyString(rec.deadline)
    && DATE_PATTERN.test(rec.application_opens_at) && DATE_PATTERN.test(rec.deadline)
    && rec.application_opens_at > rec.deadline) {
    errors.push(`字段 application_opens_at（${rec.application_opens_at}）晚于 deadline（${rec.deadline}）`);
  }

  if (rec.job_functions !== undefined
    && (!Array.isArray(rec.job_functions)
      || !rec.job_functions.every((item) => (JOB_FUNCTIONS as readonly string[]).includes(item as string)))) {
    errors.push(`字段 job_functions 必须为由职能枚举组成的数组（允许：${JOB_FUNCTIONS.join('、')}）`);
  }

  // 其余已知字段出现时类型必须符合 Job 定义（纯字符串字段不接受 null）
  for (const field of ['location', 'original_major_requirements', 'education', 'experience', 'description', 'responsibilities', 'application_info', 'fetched_at', 'last_verified']) {
    const value = rec[field];
    if (value !== undefined && typeof value !== 'string') errors.push(`字段 ${field} 类型非法（应为字符串）`);
  }
  for (const field of ['platform_disciplines', 'required_skills', 'preferred_skills']) {
    const value = rec[field];
    if (value !== undefined && (!Array.isArray(value) || !value.every((item) => isNonEmptyString(item)))) {
      errors.push(`字段 ${field} 类型非法（应为非空字符串数组）`);
    }
  }
  if (rec.salary !== undefined && rec.salary !== null && typeof rec.salary !== 'string') {
    errors.push('字段 salary 类型非法（应为字符串或 null）');
  }
  if (rec.is_demo !== undefined && typeof rec.is_demo !== 'boolean') {
    errors.push('字段 is_demo 类型非法（应为布尔值）');
  }
  if (rec.recruit_type !== undefined && !(RECRUIT_TYPES as readonly string[]).includes(rec.recruit_type as string)) {
    errors.push('字段 recruit_type 取值非法（允许：校招、社招）');
  }

  // 「待核实」纯净：禁止携带条件字段，字段范围与 audit 规则一致
  if (rec.verification_level === '待核实') {
    const violations: string[] = [];
    if (Array.isArray(rec.source_evidence) && rec.source_evidence.length > 0) violations.push('source_evidence');
    if (rec.original_major_requirements) violations.push('original_major_requirements');
    if (rec.education) violations.push('education');
    if (rec.experience) violations.push('experience');
    if (rec.salary) violations.push('salary');
    if (rec.responsibilities) violations.push('responsibilities');
    if (rec.deadline) violations.push('deadline');
    for (const field of violations) errors.push(`「待核实」层级禁止携带条件字段：${field}`);
  }

  return errors;
}

// 结构字段缺省填充：只覆盖维护者未提供的字段，空值语义见 design 契约 10；不改动任何已提供内容。
function toJobRecord(rec: Record<string, unknown>, id: number): Job {
  const today = new Date().toISOString().slice(0, 10);
  const job: Job = {
    id,
    title: rec.title as string,
    organization: rec.organization as string,
    province: rec.province as string,
    city: rec.city as string,
    location: (rec.location as string | undefined) ?? '',
    org_type: rec.org_type as Job['org_type'],
    job_type: rec.job_type as string,
    original_major_requirements: (rec.original_major_requirements as string | undefined) ?? '',
    platform_disciplines: (rec.platform_disciplines as string[] | undefined) ?? [],
    required_skills: (rec.required_skills as string[] | undefined) ?? [],
    preferred_skills: (rec.preferred_skills as string[] | undefined) ?? [],
    education: (rec.education as string | undefined) ?? '',
    experience: (rec.experience as string | undefined) ?? '',
    salary: rec.salary === undefined ? null : (rec.salary as string | null),
    description: (rec.description as string | undefined) ?? '',
    responsibilities: (rec.responsibilities as string | undefined) ?? '',
    application_info: (rec.application_info as string | undefined) ?? '',
    published_at: rec.published_at as string,
    deadline: rec.deadline === undefined ? null : (rec.deadline as string | null),
    source_name: rec.source_name as string,
    source_type: rec.source_type as Job['source_type'],
    source_url: rec.source_url as string,
    fetched_at: (rec.fetched_at as string | undefined) ?? today,
    last_verified: (rec.last_verified as string | undefined) ?? today,
    status: rec.status as Job['status'],
    is_demo: (rec.is_demo as boolean | undefined) ?? false,
    verification_level: rec.verification_level as Job['verification_level'],
    source_title: rec.source_title as string,
    source_evidence: rec.source_evidence as string[],
  };
  if (rec.recruit_type !== undefined) job.recruit_type = rec.recruit_type as Job['recruit_type'];
  if (rec.application_opens_at !== undefined) job.application_opens_at = rec.application_opens_at as string;
  if (rec.job_functions !== undefined) job.job_functions = rec.job_functions as string[];
  return job;
}

function recordKey(value: { title?: unknown; organization?: unknown; source_url?: unknown }): string {
  return `${value.title}|${value.organization}|${value.source_url}`;
}

function toIdentifier(batch: string): string {
  const camel = batch
    .split('-')
    .map((part, index) => (index === 0 ? part : part.charAt(0).toUpperCase() + part.slice(1)))
    .join('');
  return /^[0-9]/.test(camel) ? `batch${camel.charAt(0).toUpperCase()}${camel.slice(1)}` : camel;
}

// 逐条记录以单行 JSON 字面量序列化（与迁移脚本一致），保证与内存值逐字等值。
function serializeRecords(records: Job[]): string {
  return records.map((record) => JSON.stringify(record)).join(',\n');
}

function createBatchFile(filePath: string, batch: string, records: Job[]): void {
  const today = new Date().toISOString().slice(0, 10);
  const content = [
    `// 批次：${batch}`,
    `// 采集/录入日期：${today}；来源范围：维护者经 add:jobs 录入（来源明细见各记录 source_name 与 source_url）`,
    "import type { Job } from '../../lib/types';",
    '',
    'const records: Job[] = [',
    serializeRecords(records),
    '];',
    '',
    'export default records;',
    '',
  ].join('\n');
  writeFileSync(filePath, content);
}

function appendBatchFile(filePath: string, records: Job[]): void {
  const source = readFileSync(filePath, 'utf8');
  const insertAt = source.lastIndexOf('\n];');
  if (insertAt === -1) throw new Error(`批次文件格式无法识别，无法追加：${filePath}`);
  const addition = `,\n${serializeRecords(records)}`;
  writeFileSync(filePath, source.slice(0, insertAt) + addition + source.slice(insertAt));
}

// 在写入任何文件前先在内存中完成 index.ts 更新内容；批次已在聚合中时返回 null。
function buildUpdatedIndex(indexPath: string, batch: string, identifier: string): string | null {
  const source = readFileSync(indexPath, 'utf8');
  if (source.includes(`import ${identifier} from './${batch}';`)) return null;

  const importMatches = [...source.matchAll(/^import .* from '\.\/[^']*';$/gm)];
  if (importMatches.length === 0) throw new Error(`index.ts 中未找到批次 import 行：${indexPath}`);
  const lastImport = importMatches[importMatches.length - 1];
  const insertPos = lastImport.index! + lastImport[0].length;
  const withImport = source.slice(0, insertPos) + `\nimport ${identifier} from './${batch}';` + source.slice(insertPos);

  const aggregationPattern = /^(const jobsCatalog: Job\[\] = \[.*)(\];)$/m;
  if (!aggregationPattern.test(withImport)) throw new Error(`index.ts 中未找到 jobsCatalog 聚合行：${indexPath}`);
  return withImport.replace(aggregationPattern, `$1, ...${identifier}$2`);
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const repoRoot = path.resolve(scriptDir, '..');
  const args = process.argv.slice(2);
  let jsonPath: string | null = null;
  let batch: string | null = null;
  let jobsDir = path.join(repoRoot, 'src/data/jobs');

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--batch') {
      batch = args[i + 1] ?? null;
      i += 1;
    } else if (args[i] === '--jobs-dir') {
      jobsDir = path.resolve(args[i + 1] ?? '');
      i += 1;
    } else if (jsonPath === null) {
      jsonPath = args[i];
    }
  }

  if (!jsonPath || !batch) {
    console.error('用法：npm run add:jobs -- <json路径> --batch <批次名>');
    process.exitCode = 1;
    return;
  }
  if (!BATCH_NAME_PATTERN.test(batch)) {
    console.error(`批次名非法：${batch}（须为 kebab-case：小写字母、数字与连字符）`);
    process.exitCode = 1;
    return;
  }
  const indexPath = path.join(jobsDir, 'index.ts');
  if (!existsSync(indexPath)) {
    console.error(`未找到聚合入口 index.ts：${indexPath}`);
    process.exitCode = 1;
    return;
  }

  let input: unknown;
  try {
    input = JSON.parse(readFileSync(jsonPath, 'utf8'));
  } catch (error) {
    console.error(`无法读取输入文件（须为合法 JSON）：${jsonPath}（${error instanceof Error ? error.message : String(error)}）`);
    process.exitCode = 1;
    return;
  }
  if (!Array.isArray(input)) {
    console.error('输入文件顶层必须是记录数组');
    process.exitCode = 1;
    return;
  }

  const existingIds = new Set(jobsCatalog.map((job) => job.id));
  const existingKeys = new Set(jobsCatalog.map((job) => recordKey(job)));
  const batchSeenKeys = new Set<string>();
  const errors: string[] = [];
  const skipped: string[] = [];
  const accepted: { index: number; record: Record<string, unknown> }[] = [];

  (input as unknown[]).forEach((record, index) => {
    const label = `第 ${index + 1} 条`;
    const titleOf = String((record as { title?: unknown } | null)?.title ?? '无标题');
    if (typeof record === 'object' && record !== null && !Array.isArray(record)) {
      const key = recordKey(record as { title?: unknown; organization?: unknown; source_url?: unknown });
      if (existingKeys.has(key)) {
        skipped.push(`${label} 与现有目录重复（title+organization+source_url 相同），已跳过：${titleOf}`);
        return;
      }
      if (batchSeenKeys.has(key)) {
        skipped.push(`${label} 与本批前文重复（title+organization+source_url 相同），已跳过：${titleOf}`);
        return;
      }
      batchSeenKeys.add(key);
    }
    const recordErrors = validateJobRecord(record, existingIds);
    if (recordErrors.length > 0) {
      errors.push(...recordErrors.map((message) => `${label}（${titleOf}）：${message}`));
    } else {
      accepted.push({ index, record: record as Record<string, unknown> });
    }
  });

  if (errors.length > 0) {
    console.error(`整批拒绝，未写入任何文件（${errors.length} 处校验错误）：`);
    console.error(errors.join('\n'));
    process.exitCode = 1;
    return;
  }

  const maxId = jobsCatalog.reduce((max, job) => Math.max(max, job.id), 0);
  const newRecords = accepted.map(({ record }, offset) => toJobRecord(record, maxId + 1 + offset));
  const batchFilePath = path.join(jobsDir, `${batch}.ts`);

  // 先在内存中备好 index.ts 更新内容，再执行文件写入，避免批次文件已写而聚合未更新的中间态。
  let updatedIndex: string | null = null;
  try {
    updatedIndex = buildUpdatedIndex(indexPath, batch, toIdentifier(batch));
  } catch (error) {
    console.error(`整批拒绝，未写入任何文件：${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
    return;
  }

  if (!existsSync(jobsDir)) mkdirSync(jobsDir, { recursive: true });
  if (existsSync(batchFilePath)) {
    appendBatchFile(batchFilePath, newRecords);
  } else {
    createBatchFile(batchFilePath, batch, newRecords);
  }
  if (updatedIndex !== null) writeFileSync(indexPath, updatedIndex);

  for (const message of skipped) console.log(message);
  for (let offset = 0; offset < accepted.length; offset += 1) {
    console.log(`第 ${accepted[offset].index + 1} 条已写入，分配 ID ${maxId + 1 + offset}：${String(accepted[offset].record.title)}`);
  }
  console.log(`Added ${newRecords.length} jobs to ${batchFilePath}`);

  const audit = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'node_modules/tsx/dist/cli.mjs'), path.join(repoRoot, 'scripts/audit-verified-jobs.ts'), '--offline'],
    { stdio: 'inherit', cwd: repoRoot },
  );
  if (audit.status !== 0) {
    console.error('offline 审计未通过：请修复数据后重新运行 npm run add:jobs');
    process.exitCode = 1;
  }
}

// 仅在直接执行本脚本时运行 main；被测试导入时只暴露 validateJobRecord 等纯函数。
const isDirectRun = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main();
}
