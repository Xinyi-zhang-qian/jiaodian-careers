// extract:fields —— 提取辅助命令（source-tools 模块入口）。
// 用法：
//   npm run extract:fields -- --scan [--ids id1,id2] [--limit N]
//     抓取目标记录的来源页，按标签分区抽取候选字段与证据片段，
//     产出到 workspace/extract/candidates-{时间戳}.json；不写任何库文件。
//   npm run extract:fields -- --apply <确认json路径>
//     把人工确认的字段与证据写入对应批次文件（逐条在线复核证据命中，任一校验失败整条拒绝），
//     末尾自动执行 audit:jobs:offline 并回显计数；审计失败时退出码 1（文件已写，需人工修正）。
// 模块规格见 docs/modules/source-tools_interaction.md §2-§3 与 docs/interaction.md §11。
import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Job } from '../src/lib/types';
import { JOB_FUNCTIONS } from '../src/lib/utils';
import jobsCatalog from '../src/data/jobs';
import { normalizeHtml } from './lib/recheck-core';
import { extractCandidates } from './lib/extract-core';
import type { FieldCandidate } from './lib/extract-core';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DEFAULT_JOBS_DIR = path.join(REPO_ROOT, 'src/data/jobs');
const OUT_DIR = path.resolve('workspace/extract');
const FETCH_UA = 'JiaodianCareersSourceAudit/1.0';
const FETCH_TIMEOUT_MS = 15_000;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** apply 允许清单（契约 17）：确认 JSON 只能写这些字段。 */
const ALLOWED_FIELDS: readonly string[] = [
  'original_major_requirements', 'education', 'experience', 'salary', 'responsibilities',
  'description', 'application_info', 'deadline', 'application_opens_at', 'recruit_type',
  'platform_disciplines', 'job_functions',
];

/** 核验层级升级方向（契约 2）：数值越大层级越高。 */
const LEVEL_RANK: Record<string, number> = {
  待核实: 0,
  关键字段核验: 1,
  来源核验: 2,
  逐字段核验: 3,
};

/** 非空核验层级（Job.verification_level 为可选字段，校验后取值必属四级之一）。 */
type VerificationLevel = Exclude<Job['verification_level'], undefined>;

// ---------------------------------------------------------------------------
// scan：候选字段抽取
// ---------------------------------------------------------------------------

/** scan 产物条目（模块设计文档 §4）。 */
export interface ScanEntry {
  id: number;
  source_url: string;
  candidates: Record<string, FieldCandidate>;
  inaccessible?: string;
}

/** scan 缺省目标：五项条件字段（original_major_requirements/education/salary/responsibilities/application_info）全为空值的前台记录。 */
export function selectScanTargets(catalog: Job[]): Job[] {
  return catalog.filter((job) =>
    !job.original_major_requirements?.trim()
    && !job.education?.trim()
    && !job.salary
    && !job.responsibilities?.trim()
    && !job.application_info?.trim());
}

// ---------------------------------------------------------------------------
// apply：确认结果写库
// ---------------------------------------------------------------------------

export interface ApplyOptions {
  /** 批次文件目录（缺省 src/data/jobs；测试注入临时目录）。 */
  jobsDir?: string;
  /** 在线复核用 fetch 实现（测试注入假实现，不发真实请求）。 */
  fetchImpl?: typeof fetch;
  /** last_verified 记账日期（缺省当日；测试注入固定日期）。 */
  today?: string;
}

export interface ApplyResult {
  applied: number[];
  rejected: { id: string; reason: string }[];
}

/** 记录对象在批次文件文本中的区间 [start, end)。 */
interface RecordSpan {
  start: number;
  end: number;
}

interface BatchFileState {
  path: string;
  text: string;
  masked: string;
}

/**
 * 生成镜像文本：注释内容整体替换为空格；字符串字面量内的花括号替换为空格（等长替换）。
 * 镜像文本上的 id 标记搜索与花括号配对不受字符串与注释内容干扰（URL 中的 // 不会误判为注释，
 * 注释中的数字与括号不会干扰记录定位）。
 */
function maskCodeStructure(text: string): string {
  const out = text.split('');
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' || ch === "'" || ch === '`') {
      const quote = ch;
      i += 1;
      while (i < text.length) {
        if (text[i] === '\\') { i += 2; continue; } // 转义对整体跳过
        if (text[i] === quote) { i += 1; break; }
        if (text[i] === '{' || text[i] === '}') out[i] = ' ';
        i += 1;
      }
      continue;
    }
    if (ch === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') { out[i] = ' '; i += 1; }
      continue;
    }
    if (ch === '/' && text[i + 1] === '*') {
      out[i] = ' '; out[i + 1] = ' '; i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) { out[i] = ' '; i += 1; }
      if (i < text.length) { out[i] = ' '; out[i + 1] = ' '; i += 2; }
      continue;
    }
    i += 1;
  }
  return out.join('');
}

/** 在批次文件中定位 id 对应记录对象：镜像文本上找 id 字段标记，回溯最近的花括号开头并前向配对闭合。 */
function locateRecordSpan(masked: string, id: number): RecordSpan | null {
  const marker = new RegExp(`(?:"id"\\s*:\\s*|(?<![\\w])id\\s*:\\s*)${id}(?![0-9])`, 'g');
  for (const match of masked.matchAll(marker)) {
    const braceStart = masked.lastIndexOf('{', match.index ?? 0);
    if (braceStart === -1) continue;
    let depth = 0;
    for (let i = braceStart; i < masked.length; i += 1) {
      const ch = masked[i];
      if (ch === '{') depth += 1;
      else if (ch === '}') {
        depth -= 1;
        if (depth === 0) return { start: braceStart, end: i + 1 };
      }
    }
  }
  return null;
}

/** 加载批次目录下全部 .ts 文件（文本 + 镜像文本），供记录定位使用。 */
function loadBatchFiles(jobsDir: string): BatchFileState[] {
  return readdirSync(jobsDir)
    .filter((name) => name.endsWith('.ts'))
    .sort()
    .map((name) => {
      const filePath = path.join(jobsDir, name);
      const text = readFileSync(filePath, 'utf8');
      return { path: filePath, text, masked: maskCodeStructure(text) };
    });
}

/** 校验确认 JSON 中各字段值的类型（模块交互文档 §3 校验第 3 条）。 */
function validateFieldValues(job: Job, fields: Record<string, unknown>): string[] {
  const errors: string[] = [];
  const stringFields = [
    'original_major_requirements', 'education', 'experience', 'salary',
    'responsibilities', 'description', 'application_info',
  ];
  for (const field of stringFields) {
    if (field in fields && (typeof fields[field] !== 'string' || (fields[field] as string).trim().length === 0)) {
      errors.push(`字段 ${field} 必须为非空字符串`);
    }
  }
  for (const field of ['deadline', 'application_opens_at']) {
    if (field in fields && (typeof fields[field] !== 'string' || !DATE_PATTERN.test(fields[field] as string))) {
      errors.push(`字段 ${field} 必须为 YYYY-MM-DD 字符串`);
    }
  }
  // 报名窗口合成校验：新值缺省取记录既有值，opens 不得晚于 deadline（契约 11）
  const opens = ('application_opens_at' in fields ? fields.application_opens_at : job.application_opens_at) as string | undefined;
  const deadline = ('deadline' in fields ? fields.deadline : job.deadline) as string | null | undefined;
  if (typeof opens === 'string' && typeof deadline === 'string'
    && DATE_PATTERN.test(opens) && DATE_PATTERN.test(deadline) && opens > deadline) {
    errors.push(`application_opens_at（${opens}）晚于 deadline（${deadline}）`);
  }
  if ('recruit_type' in fields && fields.recruit_type !== '校招' && fields.recruit_type !== '社招') {
    errors.push('字段 recruit_type 取值非法（允许：校招、社招）');
  }
  for (const field of ['platform_disciplines', 'job_functions']) {
    if (!(field in fields)) continue;
    const value = fields[field];
    if (!Array.isArray(value) || !value.every((item) => typeof item === 'string' && item.trim().length > 0)) {
      errors.push(`字段 ${field} 必须为非空字符串数组`);
    } else if (field === 'job_functions') {
      const invalid = (value as string[]).filter((item) => !(JOB_FUNCTIONS as readonly string[]).includes(item));
      if (invalid.length > 0) errors.push(`字段 job_functions 含枚举外取值：${invalid.join('、')}`);
    }
  }
  return errors;
}

/**
 * 把人工确认的字段与证据写入批次文件（模块交互文档 §3）。
 * 逐条按序校验、整条拒绝不产生该条任何写入；通过的记录在所在批次文件中原位替换为
 * 更新后的单行 JSON（字段值、证据去重追加、层级、last_verified），批次头注释不变。
 * audit:jobs:offline 由命令层在本函数返回后执行。
 */
export async function applyConfirmed(
  confirmed: Record<string, unknown>,
  catalog: Job[],
  options: ApplyOptions = {},
): Promise<ApplyResult> {
  const jobsDir = options.jobsDir ?? DEFAULT_JOBS_DIR;
  const fetchImpl = options.fetchImpl ?? fetch;
  const today = options.today ?? new Date().toISOString().slice(0, 10);
  const batchFiles = loadBatchFiles(jobsDir);

  const applied: number[] = [];
  const rejected: { id: string; reason: string }[] = [];
  /** 批次文件路径 → 该文件的记录区间替换清单（与 batchFiles 中同一份 text 基准）。 */
  const fileEdits = new Map<string, { file: BatchFileState; edits: ApplyEdit[] }>();

  for (const [idKey, entry] of Object.entries(confirmed ?? {})) {
    const reject = (reason: string) => rejected.push({ id: idKey, reason });

    if (!/^[0-9]+$/.test(idKey)) { reject('记录 id 必须为数字串'); continue; }
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) { reject('确认内容必须是对象'); continue; }
    const job = catalog.find((item) => item.id === Number(idKey));
    if (!job) { reject('记录不存在'); continue; }

    const { _evidence, _level, ...rest } = entry as Record<string, unknown>;
    const fields = rest;
    const fieldNames = Object.keys(fields);
    if (fieldNames.length === 0) { reject('未包含任何字段'); continue; }

    const unknownFields = fieldNames.filter((name) => !ALLOWED_FIELDS.includes(name));
    if (unknownFields.length > 0) { reject(`字段不在允许清单：${unknownFields.join('、')}`); continue; }

    const typeErrors = validateFieldValues(job, fields);
    if (typeErrors.length > 0) { reject(typeErrors.join('；')); continue; }

    if (typeof _evidence !== 'object' || _evidence === null || Array.isArray(_evidence)) {
      reject('缺少 _evidence 证据片段');
      continue;
    }
    const evidenceMap = _evidence as Record<string, unknown>;
    const evidenceMissing = fieldNames.filter((name) => {
      const fragment = evidenceMap[name];
      return typeof fragment !== 'string' || fragment.trim().length < 10;
    });
    if (evidenceMissing.length > 0) {
      reject(`字段缺少 ≥10 字符的 _evidence 证据片段：${evidenceMissing.join('、')}`);
      continue;
    }

    // 层级校验：_level 须为严格升级；「待核实」记录写入条件字段时自动升至「关键字段核验」
    const currentLevel = job.verification_level ?? '待核实';
    let newLevel = currentLevel;
    if (_level !== undefined) {
      if (typeof _level !== 'string' || LEVEL_RANK[_level] === undefined) {
        reject(`_level 取值非法：${String(_level)}`);
        continue;
      }
      if (LEVEL_RANK[_level] <= LEVEL_RANK[currentLevel]) {
        reject(`_level 非升级请求（当前 ${currentLevel}，请求 ${_level}）`);
        continue;
      }
      if (_level === '逐字段核验' && !job.source_url.startsWith('https://')) {
        reject('层级「逐字段核验」要求 source_url 为 HTTPS');
        continue;
      }
      newLevel = _level as VerificationLevel;
    } else if (currentLevel === '待核实') {
      if (!job.source_title?.trim()) { reject('记录缺 source_title，无法升级层级'); continue; }
      newLevel = '关键字段核验';
    }

    // 在线复核：每个新字段值的证据片段必须在来源页规范化文本中命中
    let normalizedSource: string;
    try {
      const response = await fetchImpl(job.source_url, {
        headers: { 'user-agent': FETCH_UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      normalizedSource = normalizeHtml(await response.text());
    } catch (error) {
      reject(`来源页无法访问：${describeError(error)}`);
      continue;
    }
    const missedFields = fieldNames.filter(
      (name) => !normalizedSource.includes(normalizeHtml(evidenceMap[name] as string)),
    );
    if (missedFields.length > 0) {
      reject(`证据片段未在来源页命中：${missedFields.join('、')}`);
      continue;
    }

    const located = locateInBatchFiles(batchFiles, job.id);
    if (located === null) { reject('未在其所在批次文件中定位到记录对象'); continue; }

    // 组装更新后的记录：字段值、证据去重追加、层级与 last_verified
    const updated: Job = { ...job };
    for (const name of fieldNames) {
      (updated as unknown as Record<string, unknown>)[name] = fields[name];
    }
    const evidenceSet = new Set(job.source_evidence ?? []);
    for (const name of fieldNames) evidenceSet.add(evidenceMap[name] as string);
    updated.source_evidence = [...evidenceSet];
    updated.verification_level = newLevel as Job['verification_level'];
    updated.last_verified = today;

    const state = fileEdits.get(located.file.path) ?? { file: located.file, edits: [] };
    state.edits.push({ ...located.span, replacement: JSON.stringify(updated) });
    fileEdits.set(located.file.path, state);
    applied.push(job.id);
  }

  // 写回：每个批次文件按 start 降序原位替换，批次头注释与文件其余内容保持不变
  for (const { file, edits } of fileEdits.values()) {
    let output = file.text;
    for (const edit of [...edits].sort((a, b) => b.start - a.start)) {
      output = output.slice(0, edit.start) + edit.replacement + output.slice(edit.end);
    }
    writeFileSync(file.path, output, 'utf8');
  }

  return { applied, rejected };
}

/** 记录区间替换项：span 区间原位替换为更新后记录的单行 JSON。 */
interface ApplyEdit extends RecordSpan {
  replacement: string;
}

function locateInBatchFiles(batchFiles: BatchFileState[], id: number): { file: BatchFileState; span: RecordSpan } | null {
  for (const file of batchFiles) {
    const span = locateRecordSpan(file.masked, id);
    if (span !== null) return { file, span };
  }
  return null;
}

// ---------------------------------------------------------------------------
// 命令行入口
// ---------------------------------------------------------------------------

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    return code ? `${error.message} (${code})` : error.message;
  }
  return String(error);
}

function timestamp(): string {
  const iso = new Date().toISOString();
  return `${iso.slice(0, 10).replace(/-/g, '')}-${iso.slice(11, 19).replace(/:/g, '')}`;
}

interface PageContent {
  status: number;
  text: string;
}

/** 同一次运行内同一 URL 只抓一次：缓存响应文本，每次调用以新 Response 交付（口径同 recheck-legacy）。 */
function makeCachingFetch(): typeof fetch {
  const cache = new Map<string, Promise<PageContent>>();
  return ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    let cached = cache.get(url);
    if (!cached) {
      cached = fetch(url, init).then(async (response) => ({
        status: response.status,
        text: await response.text(),
      }));
      cache.set(url, cached);
    }
    return cached.then(({ status, text }) => {
      // 204/205/304 不允许携带响应体，其余状态以缓存文本重建可读正文。
      const body = status === 204 || status === 205 || status === 304 ? null : text;
      return new Response(body, { status });
    });
  }) as typeof fetch;
}

interface ParsedArgs {
  ids: Set<string>;
  limit: number | null;
}

function parseIdsLimit(args: string[]): ParsedArgs {
  const ids = new Set<string>();
  let limit: number | null = null;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--ids') {
      i += 1;
      (args[i] ?? '').split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => ids.add(id));
    } else if (arg.startsWith('--ids=')) {
      arg.slice('--ids='.length).split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => ids.add(id));
    } else if (arg === '--limit') {
      i += 1;
      const value = Number(args[i]);
      if (!Number.isFinite(value) || value < 0) throw new Error(`--limit 需要非负整数，收到：${args[i]}`);
      limit = Math.floor(value);
    } else if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length));
      if (!Number.isFinite(value) || value < 0) throw new Error(`--limit 需要非负整数，收到：${arg.slice('--limit='.length)}`);
      limit = Math.floor(value);
    } else {
      throw new Error(`未知参数：${arg}（支持 --ids id1,id2、--limit N）`);
    }
  }
  return { ids, limit };
}

async function runScan(argv: string[]): Promise<void> {
  const { ids, limit } = parseIdsLimit(argv);
  let targets: Job[];
  if (ids.size > 0) {
    targets = jobsCatalog.filter((job) => ids.has(String(job.id)));
    const found = new Set(targets.map((job) => String(job.id)));
    const missing = [...ids].filter((id) => !found.has(id));
    if (missing.length > 0) {
      console.error(`[extract:fields] 以下 --ids 不在前台目录中，已跳过：${missing.join('、')}`);
    }
  } else {
    targets = selectScanTargets(jobsCatalog);
  }
  if (limit !== null) targets = targets.slice(0, limit);

  console.log(`[extract:fields] scan 目标 ${targets.length} 条（${ids.size > 0 ? '指定 ids' : '缺省：五项条件字段全为空'}）`);
  const cachingFetch = makeCachingFetch();
  const entries: ScanEntry[] = [];
  for (const job of targets) {
    const entry: ScanEntry = { id: job.id, source_url: job.source_url, candidates: {} };
    try {
      const response = await cachingFetch(job.source_url, {
        headers: { 'user-agent': FETCH_UA },
        redirect: 'follow',
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!response.ok) {
        entry.inaccessible = `无法访问：HTTP ${response.status}`;
      } else {
        const result = extractCandidates(job, normalizeHtml(await response.text()));
        entry.candidates = result.candidates;
        if (result.inaccessible) entry.inaccessible = result.inaccessible;
      }
    } catch (error) {
      entry.inaccessible = `无法访问：${describeError(error)}`;
    }
    entries.push(entry);
    const summary = entry.inaccessible
      ?? `抽取 ${Object.keys(entry.candidates).length} 项：${Object.keys(entry.candidates).join('、') || '无'}`;
    console.log(`  [${job.id}] ${job.title} — ${summary}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `candidates-${timestamp()}.json`);
  writeFileSync(outPath, `${JSON.stringify(entries, null, 2)}\n`, 'utf8');
  const candidateCount = entries.reduce((sum, entry) => sum + Object.keys(entry.candidates).length, 0);
  console.log(`\nScanned ${entries.length} records, extracted ${candidateCount} candidate fields. 产物：${outPath}`);
  console.log('scan 只读不写库：本次未修改 src/data 下任何文件。');
}

async function runApply(argv: string[]): Promise<void> {
  const jsonPath = argv.find((arg) => !arg.startsWith('--')) ?? null;
  if (!jsonPath) {
    console.error('用法：npm run extract:fields -- --apply <确认json路径>');
    process.exitCode = 1;
    return;
  }
  let confirmed: Record<string, unknown>;
  try {
    confirmed = JSON.parse(readFileSync(jsonPath, 'utf8')) as Record<string, unknown>;
  } catch (error) {
    console.error(`无法读取确认 JSON（须为合法 JSON 对象）：${jsonPath}（${describeError(error)}）`);
    process.exitCode = 1;
    return;
  }
  if (typeof confirmed !== 'object' || confirmed === null || Array.isArray(confirmed)) {
    console.error('确认 JSON 顶层必须是对象（键为记录 id）');
    process.exitCode = 1;
    return;
  }

  console.log(`[extract:fields] apply 输入 ${Object.keys(confirmed).length} 条，来源：${jsonPath}`);
  const result = await applyConfirmed(confirmed, jobsCatalog);
  for (const item of result.rejected) console.error(`  [拒绝] ${item.id}：${item.reason}`);
  console.log(`Applied ${result.applied.length} records: ${result.applied.join('、') || '无'}`);

  // apply 写库后自动执行离线审计（契约 17）；审计失败时文件已写入，需人工修正
  const audit = spawnSync(
    process.execPath,
    [path.join(REPO_ROOT, 'node_modules/tsx/dist/cli.mjs'), path.join(REPO_ROOT, 'scripts/audit-verified-jobs.ts'), '--offline'],
    { stdio: 'inherit', cwd: REPO_ROOT },
  );
  if (audit.status !== 0) {
    console.error('offline 审计未通过：批次文件已写入，请人工修正后重新运行 npm run audit:jobs:offline');
    process.exitCode = 1;
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0];
  if (mode === '--scan') { await runScan(args.slice(1)); return; }
  if (mode === '--apply') { await runApply(args.slice(1)); return; }
  console.error('用法：npm run extract:fields -- --scan [--ids id1,id2] [--limit N] | npm run extract:fields -- --apply <确认json路径>');
  process.exitCode = 1;
}

// 仅在直接执行本脚本时运行 main；被测试导入时只暴露 applyConfirmed 等可注入函数。
const isDirectRun = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((error) => {
    console.error(`[extract:fields] 执行失败：${describeError(error)}`);
    process.exitCode = 1;
  });
}
