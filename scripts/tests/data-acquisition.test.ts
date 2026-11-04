/**
 * data-acquisition 模块测试
 * 运行：npx tsx scripts/tests/data-acquisition.test.ts
 * 依据：docs/modules/data-acquisition_interaction.md §2/§3、docs/interaction.md §11 audit 错误分类、
 *       docs/design.md §4 契约 11（报名窗口）与契约 12（职能标签）
 * 说明：校验逻辑实现为独立可复用函数（validateJobRecord / validateBatch /
 *       validateInstitutionalWindow），口径与 scripts/audit-verified-jobs.ts 的 audit 规则对齐。
 */
import assert from 'node:assert/strict';
import beijingJobs from '../../src/data/jobs/beijing-2026-11';
import shanghaiJobs from '../../src/data/jobs/shanghai-2026-11';
import crossJobs from '../../src/data/jobs/cross-disciplinary-2026-11';

// ---------- 校验常量（与 src/lib/utils.ts、docs/design.md 契约 2/11/12 一致） ----------

const REQUIRED_FIELDS = [
  'title',
  'organization',
  'province',
  'city',
  'location',
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
] as const;

const ORG_TYPES = ['高校', '科研院所', '企业', '事业单位', '其他'];
const SOURCE_TYPES = ['官网', '政府', '其他'];
const STATUSES = ['招聘中', '已截止', '状态待核实'];
const VERIFICATION_LEVELS = ['待核实', '关键字段核验', '来源核验', '逐字段核验'];
const JOB_FUNCTIONS = ['项目管理', '产品经理', 'AI伦理', '算法', '工程', '数据', '科研', '编辑出版', '综合管理', '其他'];

/** 日期字段必须为 YYYY-MM-DD 字符串且能被解析为真实日期 */
function isDateString(value: unknown): boolean {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

// ---------- 独立可复用校验函数（口径对齐 docs/interaction.md §11 audit 错误分类） ----------

/** 单条记录 schema 校验，返回违规错误行列表（空数组 = 通过） */
export function validateJobRecord(job: any): string[] {
  const errors: string[] = [];
  const id = job?.id ?? '(缺id)';

  if (!Number.isInteger(job?.id) || (job?.id as number) < 2001) {
    errors.push(`ID ${id}: id 必须为 ≥2001 的整数（手工段）`);
  }

  for (const field of REQUIRED_FIELDS) {
    const value = job?.[field];
    const empty =
      value === undefined ||
      value === null ||
      (typeof value === 'string' && value.trim() === '') ||
      (Array.isArray(value) && value.length === 0);
    if (empty) errors.push(`ID ${id}: 缺少必填字段 ${field}`);
  }

  if (job && !ORG_TYPES.includes(job.org_type)) errors.push(`ID ${id}: org_type 非法：${job.org_type}`);
  if (job && !SOURCE_TYPES.includes(job.source_type)) errors.push(`ID ${id}: source_type 非法：${job.source_type}`);
  if (job && !STATUSES.includes(job.status)) errors.push(`ID ${id}: status 非法：${job.status}`);
  if (job && !VERIFICATION_LEVELS.includes(job.verification_level)) {
    errors.push(`ID ${id}: verification_level 非法：${job.verification_level}`);
  }
  if (job?.job_functions !== undefined) {
    if (!Array.isArray(job.job_functions)) {
      errors.push(`ID ${id}: job_functions 必须为数组`);
    } else {
      for (const fn of job.job_functions) {
        if (!JOB_FUNCTIONS.includes(fn)) errors.push(`ID ${id}: job_functions 含枚举外值：${fn}`);
      }
    }
  }

  // 日期格式（契约 10：日期 YYYY-MM-DD）
  for (const field of ['published_at', 'fetched_at', 'last_verified']) {
    if (!isDateString(job?.[field])) errors.push(`ID ${id}: ${field} 非法或缺失，须为 YYYY-MM-DD：${job?.[field]}`);
  }
  for (const field of ['application_opens_at', 'deadline']) {
    if (job?.[field] !== undefined && job?.[field] !== null && !isDateString(job[field])) {
      errors.push(`ID ${id}: ${field} 非 YYYY-MM-DD：${job[field]}`);
    }
  }
  // 报名窗口顺序：opens 不得晚于 deadline（契约 11）
  if (isDateString(job?.application_opens_at) && isDateString(job?.deadline)) {
    if (job.application_opens_at > job.deadline) {
      errors.push(`ID ${id}: application_opens_at（${job.application_opens_at}）晚于 deadline（${job.deadline}）`);
    }
  }

  // 「待核实」记录不得携带任何未核验条件字段（契约 2，对齐 audit-verified-jobs.ts）
  if (job?.verification_level === '待核实') {
    const carriesConditions =
      (Array.isArray(job?.source_evidence) && job.source_evidence.length > 0) ||
      (job?.original_major_requirements ?? '') !== '' ||
      (job?.education ?? '') !== '' ||
      (job?.experience ?? '') !== '' ||
      job?.salary != null ||
      (job?.responsibilities ?? '') !== '' ||
      job?.deadline != null ||
      job?.application_opens_at != null;
    if (carriesConditions) errors.push(`ID ${id}: 待核实记录携带未核验条件字段`);
  }

  // 「逐字段核验」：证据 ≥3 段、来源 HTTPS（契约 2/3）
  if (job?.verification_level === '逐字段核验') {
    if (!Array.isArray(job.source_evidence) || job.source_evidence.length < 3) {
      errors.push(`ID ${id}: 逐字段核验记录 source_evidence 少于 3 段`);
    }
    if (typeof job.source_url === 'string' && !job.source_url.startsWith('https://')) {
      errors.push(`ID ${id}: 逐字段核验来源必须为 HTTPS`);
    }
  }

  if (job?.is_demo !== false) errors.push(`ID ${id}: 前台批次禁止 is_demo 非 false 的记录`);

  // 城市必须具体到市，禁止「多地」类模糊线索（模块交互文档 §2）
  if (typeof job?.city === 'string' && /多地|若干|不限/.test(job.city)) {
    errors.push(`ID ${id}: city 含模糊表述：${job.city}`);
  }

  return errors;
}

/** 整批校验：逐条 validateJobRecord */
export function validateBatch(records: any[]): string[] {
  return records.flatMap((job, index) => validateJobRecord(job).map((e) => `第 ${index + 1} 条 ${e}`));
}

/** 事业单位报名窗口断言（契约 11）：有窗口字段，或 application_info 承载报名方式原文 */
export function validateInstitutionalWindow(job: any): string[] {
  if (job?.org_type !== '事业单位') return [];
  const hasWindow = Boolean(job.application_opens_at || job.deadline);
  const hasApplicationInfo = typeof job.application_info === 'string' && job.application_info.trim().length > 0;
  if (!hasWindow && !hasApplicationInfo) {
    return [`ID ${job.id}: 事业单位记录既无报名窗口字段，application_info 也为空`];
  }
  return [];
}

// ---------- 测试执行 ----------

const batches = [
  { name: '北京批次', file: 'beijing-2026-11', records: beijingJobs as any[], minCount: 10 },
  { name: '上海批次', file: 'shanghai-2026-11', records: shanghaiJobs as any[], minCount: 10 },
  { name: '跨学科批次', file: 'cross-disciplinary-2026-11', records: crossJobs as any[], minCount: 10 },
];

let checks = 0;

// 1. 批次 schema 自查（逐批逐条）
for (const batch of batches) {
  const errors = validateBatch(batch.records);
  assert.deepEqual(errors, [], `${batch.name}（${batch.file}.ts）schema 自查发现 ${errors.length} 项违规：\n${errors.join('\n')}`);
  checks += 1;
}

// 2. 跨批 id 唯一且 ≥2001（手工段，互不重复）
const allIds = batches.flatMap((b) => b.records.map((r) => r.id));
const duplicateIds = allIds.filter((id, i) => allIds.indexOf(id) !== i);
assert.deepEqual(duplicateIds, [], `批次间存在重复 id：${duplicateIds.join('、')}`);
assert.ok(
  allIds.every((id) => Number.isInteger(id) && id >= 2001),
  `存在不在 2001 手工段的 id：${allIds.filter((id) => !(Number.isInteger(id) && id >= 2001)).join('、')}`,
);
checks += 1;

// 3. 数量断言（需求 §16：三批各 ≥10）
for (const batch of batches) {
  assert.ok(
    batch.records.length >= batch.minCount,
    `${batch.name} 仅 ${batch.records.length} 条，未达 ${batch.minCount} 条目标`,
  );
  checks += 1;
}

// 4. 跨学科批次 job_functions 必须逐条标注（契约 12：职能标签与原文分离）
const crossMissingFunctions = crossJobs.filter(
  (job) => !Array.isArray((job as any).job_functions) || (job as any).job_functions.length === 0,
);
assert.deepEqual(
  crossMissingFunctions.map((j) => j.id),
  [],
  `跨学科批次存在未标注 job_functions 的记录：${crossMissingFunctions.map((j) => j.id).join('、')}`,
);
checks += 1;

// 5. 事业单位报名窗口断言（契约 11）
const institutionalErrors = batches.flatMap((b) => b.records.flatMap(validateInstitutionalWindow));
assert.deepEqual(
  institutionalErrors,
  [],
  `事业单位记录报名窗口校验发现 ${institutionalErrors.length} 项违规：\n${institutionalErrors.join('\n')}`,
);
checks += 1;

// 汇总
const total = batches.reduce((sum, b) => sum + b.records.length, 0);
const institutional = batches.reduce((sum, b) => sum + b.records.filter((r) => r.org_type === '事业单位').length, 0);
console.log(
  `data-acquisition 测试通过：${checks} 组断言 / 覆盖 ${total} 条记录（北京 ${beijingJobs.length}、上海 ${shanghaiJobs.length}、跨学科 ${crossJobs.length}；其中事业单位 ${institutional} 条）。`,
);
