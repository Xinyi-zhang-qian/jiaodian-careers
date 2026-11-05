// refresh:sources —— 来源刷新分类命令（source-tools 模块入口）。
// 用法：npm run refresh:sources [--ids id1,id2] [--limit N]
// 遍历目标记录（缺省 = 全部「状态待核实」+ 来源核验/关键字段核验记录），在线访问来源页，
// 复用 recheck-core 的抓取与分类口径归类「现行有效 / 内容失配 / 来源过期」，
// 产出到 workspace/source-refresh/report-{时间戳}.json 与控制台摘要；不写任何库文件。
// 模块规格见 docs/modules/source-tools_interaction.md §4 与 docs/interaction.md §11。
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Job } from '../src/lib/types';
import jobsCatalog from '../src/data/jobs';
import { classifySource } from './lib/recheck-core';
import type { LegacyRecord } from './lib/recheck-core';

const OUT_DIR = path.resolve('workspace/source-refresh');
const FETCH_TIMEOUT_MS = 15_000;

/** 刷新分类条目（模块设计文档 §4）。 */
export interface RefreshItem {
  id: number;
  title: string;
  organization: string;
  source_url: string;
  verdict: '现行有效' | '内容失配' | '来源过期';
  http_status: number | null;
  note: string;
}

/** refresh:sources 缺省目标：「状态待核实」+ 来源核验/关键字段核验记录（逐字段核验由 audit:jobs 在线审计覆盖，不重复刷新）。 */
export function selectRefreshTargets(catalog: Job[]): Job[] {
  return catalog.filter((job) =>
    job.status === '状态待核实'
    || job.verification_level === '来源核验'
    || job.verification_level === '关键字段核验');
}

/**
 * 单条分类：记录映射为 LegacyRecord（origin 'real-jobs'，有 source_title 时以 source_title 作锚点）
 * 后调用 recheck-core classifySource，再按模块交互文档 §4 映射归类：
 * 可升级 → 现行有效；建议下架 → 来源过期；需人工复核且 note 含「过期提示页」→ 来源过期；
 * 其余需人工复核（锚点不命中、疑似非招聘页、停招字样、页面内容为空、网络异常）→ 内容失配。
 */
export async function classifyRefresh(
  job: Job,
  deps: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<RefreshItem> {
  const record: LegacyRecord = {
    origin: 'real-jobs',
    id: String(job.id),
    title: job.title,
    organization: job.organization,
    source_url: job.source_url,
    source_title: job.source_title,
  };
  const item = await classifySource(record, deps);
  let verdict: RefreshItem['verdict'];
  if (item.verdict === '可升级') {
    verdict = '现行有效';
  } else if (item.verdict === '建议下架' || item.note.includes('过期提示页')) {
    verdict = '来源过期';
  } else {
    verdict = '内容失配';
  }
  return {
    id: job.id,
    title: job.title,
    organization: job.organization,
    source_url: job.source_url,
    verdict,
    http_status: item.http_status,
    note: item.note,
  };
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

async function main() {
  const { ids, limit } = parseIdsLimit(process.argv.slice(2));
  let targets: Job[];
  if (ids.size > 0) {
    targets = jobsCatalog.filter((job) => ids.has(String(job.id)));
    const found = new Set(targets.map((job) => String(job.id)));
    const missing = [...ids].filter((id) => !found.has(id));
    if (missing.length > 0) {
      console.error(`[refresh:sources] 以下 --ids 不在前台目录中，已跳过：${missing.join('、')}`);
    }
  } else {
    targets = selectRefreshTargets(jobsCatalog);
  }
  if (limit !== null) targets = targets.slice(0, limit);

  console.log(`[refresh:sources] 目标 ${targets.length} 条（${ids.size > 0 ? '指定 ids' : '缺省：状态待核实 + 来源核验/关键字段核验'}）`);
  const cachingFetch = makeCachingFetch();
  const items: RefreshItem[] = [];
  for (const job of targets) {
    let item: RefreshItem;
    try {
      item = await classifyRefresh(job, {
        fetchImpl: cachingFetch,
        timeoutMs: FETCH_TIMEOUT_MS,
      });
    } catch (error) {
      // classifySource 在函数内部消化网络异常，此处为兜底：单条失败不中断整批
      item = {
        id: job.id,
        title: job.title,
        organization: job.organization,
        source_url: job.source_url,
        verdict: '内容失配',
        http_status: null,
        note: `访问失败：${describeError(error)}`,
      };
    }
    items.push(item);
    console.log(`  [${item.id}] ${item.title} — ${item.verdict}${item.note ? `（${item.note}）` : ''}`);
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const outPath = path.join(OUT_DIR, `report-${timestamp()}.json`);
  writeFileSync(outPath, `${JSON.stringify(items, null, 2)}\n`, 'utf8');
  const countOf = (verdict: RefreshItem['verdict']) => items.filter((item) => item.verdict === verdict).length;
  console.log(`\nRefreshed ${items.length} sources: 现行有效 ${countOf('现行有效')} / 内容失配 ${countOf('内容失配')} / 来源过期 ${countOf('来源过期')}`);
  console.log(`报告：${outPath}`);
  console.log('refresh 只读不写库：本次未修改 src/data 下任何文件。');
}

// 仅在直接执行本脚本时运行 main；被测试导入时只暴露 classifyRefresh 等可注入函数。
const isDirectRun = process.argv[1] !== undefined
  && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));
if (isDirectRun) {
  main().catch((error) => {
    console.error(`[refresh:sources] 执行失败：${describeError(error)}`);
    process.exitCode = 1;
  });
}
