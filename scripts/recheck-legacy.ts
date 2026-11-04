// recheck:legacy —— 遗留数据回源复核（legacy-cleanup 模块入口）。
// 用法：npm run recheck:legacy -- [--offline] [--ids id1,id2] [--limit N]
//   --offline    不发网络请求，全部条目标「未核验」
//   --ids        指定本次复核的记录 id（逗号分隔；命中的条目无论已有结论一律重跑并覆盖）
//   --limit      未带 --ids 时，取待复核队列前 N 条（已有非「未核验」结论的条目自动跳过）
// 产物：workspace/legacy-recheck/details.json（逐条明细，同 id 覆盖）与 report.md（分类报告）。
// 遗留清单文件在合并阶段可能被删除：一律动态 import + try/catch，失败按 0 条处理，脚本不崩溃。
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import {
  buildReport,
  classifySource,
  markUnverified,
  mergeDetails,
  type LegacyRecord,
  type RecheckItem,
  type RecheckOrigin,
} from './lib/recheck-core';

const OUT_DIR = path.resolve('workspace/legacy-recheck');
const DETAILS_PATH = path.join(OUT_DIR, 'details.json');
const REPORT_PATH = path.join(OUT_DIR, 'report.md');

interface JobLike {
  id: number;
  title?: string;
  organization?: string;
  source_url?: string;
  source_title?: string;
}

interface PlatformListingLike {
  title?: string;
  organization?: string;
  sourceUrl?: string;
}

function toRecord(origin: RecheckOrigin, id: string, job: JobLike): LegacyRecord {
  return {
    origin,
    id,
    title: job.title ?? '',
    organization: job.organization ?? '',
    source_url: job.source_url ?? '',
    source_title: job.source_title,
  };
}

/** 加载 src/data/real-jobs.ts（228 条未发布候选，default 导出）。 */
async function loadRealJobs(): Promise<LegacyRecord[]> {
  try {
    const specifier = '../src/data/real-jobs';
    const mod = await import(specifier);
    const jobs = (mod.default ?? []) as JobLike[];
    return jobs.map((job) => toRecord('real-jobs', String(job.id), job));
  } catch (error) {
    console.error(`[recheck:legacy] 加载 src/data/real-jobs.ts 失败（文件可能在合并阶段已删除），按 0 条处理：${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/** 加载 src/data/expanded-source-leads.ts（63 条已发布线索，default 导出）。 */
async function loadLeads(): Promise<LegacyRecord[]> {
  try {
    const specifier = '../src/data/expanded-source-leads';
    const mod = await import(specifier);
    const jobs = (mod.default ?? []) as JobLike[];
    return jobs.map((job) => toRecord('leads', String(job.id), job));
  } catch (error) {
    console.error(`[recheck:legacy] 加载 src/data/expanded-source-leads.ts 失败（文件可能在合并阶段已删除），按 0 条处理：${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/** 加载 src/data/platform-sources.ts 的 QUARANTINED 平台快照段（具名导出 unverifiedPlatformListings）。 */
async function loadPlatformListings(): Promise<LegacyRecord[]> {
  try {
    const specifier = '../src/data/platform-sources';
    const mod = await import(specifier);
    const listings = (mod.unverifiedPlatformListings ?? []) as PlatformListingLike[];
    return listings.map((listing, index) =>
      toRecord('platform-sources', `ps-${index + 1}`, {
        id: index + 1,
        title: listing.title,
        organization: listing.organization,
        source_url: listing.sourceUrl,
      }),
    );
  } catch (error) {
    console.error(`[recheck:legacy] 加载 src/data/platform-sources.ts 快照段失败（文件可能在合并阶段已删除），按 0 条处理：${error instanceof Error ? error.message : String(error)}`);
    return [];
  }
}

/** 读取既有明细（同 id 覆盖的合并基准）；文件损坏时报错退出，避免静默丢失历史结论。 */
function loadExistingDetails(): RecheckItem[] {
  try {
    const raw = readFileSync(DETAILS_PATH, 'utf8');
    const parsed = JSON.parse(raw) as RecheckItem[];
    if (!Array.isArray(parsed)) throw new Error('details.json 顶层不是数组');
    return parsed;
  } catch (error) {
    if ((error as NodeJS.ErrnoException)?.code === 'ENOENT') return [];
    throw new Error(`details.json 读取失败，请修复或删除后重跑：${error instanceof Error ? error.message : String(error)}`);
  }
}

/** 同一次运行内同一 URL 只抓一次：缓存响应文本，每次调用以新 Response 交付（正文可重复消费）。 */
function makeCachingFetch(): typeof fetch {
  const cache = new Map<string, Promise<{ status: number; text: string }>>();
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
      // 204/205/304 不允许携带响应体，其余状态以缓存的文本重建可读正文。
      const body = status === 204 || status === 205 || status === 304 ? null : text;
      return new Response(body, { status });
    });
  }) as typeof fetch;
}

function parseArgs(argv: string[]): { offline: boolean; ids: Set<string>; limit: number | null; argsText: string } {
  const ids = new Set<string>();
  let limit: number | null = null;
  let offline = false;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--offline') {
      offline = true;
    } else if (arg === '--ids') {
      i += 1;
      const value = argv[i] ?? '';
      value.split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => ids.add(id));
    } else if (arg.startsWith('--ids=')) {
      arg.slice('--ids='.length).split(',').map((id) => id.trim()).filter(Boolean).forEach((id) => ids.add(id));
    } else if (arg === '--limit') {
      i += 1;
      const value = Number(argv[i]);
      if (!Number.isFinite(value) || value < 0) throw new Error(`--limit 需要非负整数，收到：${argv[i]}`);
      limit = Math.floor(value);
    } else if (arg.startsWith('--limit=')) {
      const value = Number(arg.slice('--limit='.length));
      if (!Number.isFinite(value) || value < 0) throw new Error(`--limit 需要非负整数，收到：${arg.slice('--limit='.length)}`);
      limit = Math.floor(value);
    } else {
      throw new Error(`未知参数：${arg}（支持 --offline、--ids id1,id2、--limit N）`);
    }
  }
  return { offline, ids, limit, argsText: argv.join(' ') || '（无参数）' };
}

async function main() {
  const { offline, ids, limit, argsText } = parseArgs(process.argv.slice(2));
  const startedAt = new Date();

  const [leads, realJobs, platformListings] = await Promise.all([
    loadLeads(),
    loadRealJobs(),
    loadPlatformListings(),
  ]);
  const sources: Record<RecheckOrigin, number> = {
    leads: leads.length,
    'real-jobs': realJobs.length,
    'platform-sources': platformListings.length,
  };
  // 队列顺序：已发布线索优先，其后 real-jobs 未发布候选，最后平台快照。
  const all: LegacyRecord[] = [...leads, ...realJobs, ...platformListings];
  if (all.length === 0) {
    console.error('[recheck:legacy] 三份遗留清单均为空或加载失败，无可复核条目。');
    process.exitCode = 1;
    return;
  }

  const existing = loadExistingDetails();
  const reviewedKeys = new Set(
    existing.filter((item) => item.verdict !== '未核验').map((item) => `${item.origin}#${item.id}`),
  );

  let queue: LegacyRecord[];
  if (ids.size > 0) {
    queue = all.filter((record) => ids.has(record.id));
    const found = new Set(queue.map((record) => record.id));
    const missing = [...ids].filter((id) => !found.has(id));
    if (missing.length > 0) {
      console.error(`[recheck:legacy] 以下 --ids 未在任何遗留清单中找到，已跳过：${missing.join('、')}`);
    }
  } else {
    // 增量语义：跳过已有在线结论的条目，从未核验/未复核的条目继续。
    queue = all.filter((record) => !reviewedKeys.has(`${record.origin}#${record.id}`));
  }
  if (limit !== null) queue = queue.slice(0, limit);

  if (queue.length === 0) {
    console.log('[recheck:legacy] 本次没有待复核条目（全部已有结论或被参数过滤），仅重建报告。');
  }

  const fresh: RecheckItem[] = [];
  if (offline) {
    for (const record of queue) {
      fresh.push(markUnverified(record));
    }
  } else {
    const cachingFetch = makeCachingFetch();
    for (const record of queue) {
      const item = await classifySource(record, { fetchImpl: cachingFetch });
      fresh.push(item);
      console.log(`[${item.origin}#${item.id}] ${item.verdict}${item.note ? `（${item.note}）` : ''}`);
    }
  }

  const details = mergeDetails(existing, fresh);
  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(DETAILS_PATH, `${JSON.stringify(details, null, 2)}\n`, 'utf8');

  const generatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
  const report = buildReport(details, { generatedAt, args: argsText, sources });
  writeFileSync(REPORT_PATH, report, 'utf8');

  const countOf = (verdict: string) => details.filter((item) => item.verdict === verdict).length;
  console.log('');
  console.log(
    `Rechecked legacy records: 本次处理 ${fresh.length} 条；累计明细 ${details.length} 条`
      + `（可升级 ${countOf('可升级')} / 需人工复核 ${countOf('需人工复核')} / 建议下架 ${countOf('建议下架')} / 未核验 ${countOf('未核验')}）`,
  );
  console.log(`报告：${REPORT_PATH}`);
  console.log(`明细：${DETAILS_PATH}`);
  const elapsedSeconds = Math.round((Date.now() - startedAt.getTime()) / 1000);
  console.log(`耗时：${elapsedSeconds}s`);
}

main().catch((error) => {
  console.error(`[recheck:legacy] 执行失败：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
