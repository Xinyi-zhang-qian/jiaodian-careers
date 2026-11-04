// legacy-cleanup 复核核心：纯函数与分类口径。
// 分类口径（CLASSIFY_RULES）写死于本文件，recheck:legacy 产出的 report.md 头部逐条同步声明，
// 保证结论可复核。模块规格见 docs/modules/legacy-cleanup_interaction.md §2-§4。

export type RecheckOrigin = 'real-jobs' | 'platform-sources' | 'leads';
export type RecheckVerdict = '可升级' | '需人工复核' | '建议下架' | '未核验';

/** 遗留记录（real-jobs / leads 取 Job 字段子集；platform-sources 快照映射为同构记录）。 */
export interface LegacyRecord {
  origin: RecheckOrigin;
  id: string;
  title: string;
  organization: string;
  source_url: string;
  source_title?: string;
}

/** 复核明细条目，见 docs/modules/legacy-cleanup_design.md §4。 */
export interface RecheckItem {
  origin: RecheckOrigin;
  id: string;
  title: string;
  organization: string;
  source_url: string;
  verdict: RecheckVerdict;
  http_status: number | null;
  evidence_hits: string[];
  note: string;
}

const RECHECK_UA = 'JiaodianCareersSourceAudit/1.0';
const DEFAULT_TIMEOUT_MS = 15_000;

/** 招聘相关关键词：页面规范化文本命中其一才视为招聘页。 */
const RECRUIT_KEYWORDS = ['招聘', '岗位', '职位', '报名', '简历', 'recruit', 'hiring', 'career', 'job'];

/** 分类口径 9 条，与 classifySource 的判定分支一一对应。 */
const CLASSIFY_RULES: readonly string[] = [
  'URL 缺失或非 http(s) →「建议下架」，note「URL 非法」',
  'DNS 解析失败（ENOTFOUND / EAI_AGAIN）→「建议下架」，note 含「域名失效」与原因',
  '其余网络异常或超时 →「需人工复核」，note 含「访问失败：」与原因',
  'HTTP 404/410 →「建议下架」，note 含状态码与「页面不存在」',
  'HTTP 401/403/429 →「建议下架」，note 含「疑似反爬拦截」与状态码',
  '其余非 2xx 状态 →「需人工复核」，note 含状态码',
  'HTTP 2xx 但规范化文本为空 →「需人工复核」，note「页面内容为空」',
  'HTTP 2xx 且锚点命中（有 source_title 时命中 source_title；平台快照要求 title 与 organization 都命中；其余来源 title 命中即可）且页面含招聘相关关键词（招聘/岗位/职位/报名/简历/recruit/hiring/career/job 之一）→「可升级」；页面标注「已暂停招聘 / 已停止招聘」类停招字样时例外，转下一条判「需人工复核」',
  'HTTP 2xx 但锚点不命中、页面不含招聘相关关键词（疑似非招聘页），或页面标注「已暂停招聘 / 已停止招聘」类停招字样（来源页为「信息已过期」类提示页时在 note 中标注「过期提示页」，标注停招字样时在 note 中标注「已暂停招聘」）→「需人工复核」，note 注明命中情况',
];

/** HTML 规范化：去 script/style/标签，解实体，压空白，统一 en/em dash（口径与 audit-verified-jobs.ts 一致）。 */
export function normalizeHtml(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;|&#160;/gi, '')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/[\s\u00a0]+/g, '')
    .replace(/[\u2013\u2014]/g, '-')
    .trim();
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    const code = (error as { cause?: { code?: string } }).cause?.code;
    return code ? `${error.message} (${code})` : error.message;
  }
  return String(error);
}

function isDnsFailure(error: unknown): boolean {
  const code = (error as { cause?: { code?: string }; code?: string })?.cause?.code
    ?? (error as { code?: string })?.code
    ?? '';
  const message = error instanceof Error ? error.message : String(error);
  return /ENOTFOUND|EAI_AGAIN/.test(code) || /getaddrinfo|ENOTFOUND|EAI_AGAIN/.test(message);
}

/**
 * 单条回源分类判定。fetch 实现可注入（模块测试用假实现，不发真实请求）；
 * 任何异常都在函数内部消化为明细条目，单条失败不中断整批。
 */
export async function classifySource(
  record: LegacyRecord,
  deps: { fetchImpl?: typeof fetch; timeoutMs?: number } = {},
): Promise<RecheckItem> {
  const base: RecheckItem = {
    origin: record.origin,
    id: record.id,
    title: record.title ?? '',
    organization: record.organization ?? '',
    source_url: record.source_url ?? '',
    verdict: '需人工复核',
    http_status: null,
    evidence_hits: [],
    note: '',
  };

  const url = base.source_url.trim();
  if (!/^https?:\/\//i.test(url)) {
    return { ...base, verdict: '建议下架', note: 'URL 非法' };
  }

  const fetchImpl = deps.fetchImpl ?? fetch;
  const timeoutMs = deps.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let response: Response;
  try {
    response = await fetchImpl(url, {
      headers: { 'user-agent': RECHECK_UA },
      redirect: 'follow',
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const reason = describeError(error);
    if (isDnsFailure(error)) {
      return { ...base, verdict: '建议下架', note: `域名失效：${reason}` };
    }
    return { ...base, verdict: '需人工复核', note: `访问失败：${reason}` };
  }

  const status = response.status;
  if (!response.ok) {
    if (status === 404 || status === 410) {
      return { ...base, http_status: status, verdict: '建议下架', note: `HTTP ${status}（页面不存在）` };
    }
    if (status === 401 || status === 403 || status === 429) {
      return { ...base, http_status: status, verdict: '建议下架', note: `HTTP ${status}（疑似反爬拦截）` };
    }
    return { ...base, http_status: status, verdict: '需人工复核', note: `HTTP ${status}（非成功状态）` };
  }

  let html = '';
  try {
    html = await response.text();
  } catch (error) {
    return {
      ...base,
      http_status: status,
      verdict: '需人工复核',
      note: `访问失败：读取响应正文失败：${describeError(error)}`,
    };
  }

  const text = normalizeHtml(html);
  if (!text) {
    return { ...base, http_status: status, verdict: '需人工复核', note: '页面内容为空' };
  }

  // 南开就业网等站点对已撤下的公告返回 200 的「该信息已过期」跳转提示页，如实标注供人工处置。
  const expiredNotice = text.includes('信息已过期') || (text.includes('操作失败') && text.includes('跳转提示'));
  // 猎聘/BOSS 等平台页面对已关闭职位标注「已暂停招聘」，此时锚点可能仍命中页面装饰性内容，不得判可升级。
  const pausedNotice = text.includes('已暂停招聘') || text.includes('已停止招聘') || text.includes('已停招');

  // 锚点判定：source_title 优先；平台快照要求 title 与 organization 同时命中；其余来源 title 命中即可。
  const sourceTitle = (record.source_title ?? '').trim();
  const title = base.title.trim();
  const organization = base.organization.trim();
  const hits: string[] = [];
  let anchorOk = false;
  if (sourceTitle) {
    const hit = text.includes(normalizeHtml(sourceTitle));
    if (hit) hits.push(`source_title:${sourceTitle}`);
    anchorOk = hit;
  } else if (record.origin === 'platform-sources') {
    const titleHit = title !== '' && text.includes(normalizeHtml(title));
    const orgHit = organization !== '' && text.includes(normalizeHtml(organization));
    if (titleHit) hits.push(`title:${title}`);
    if (orgHit) hits.push(`organization:${organization}`);
    anchorOk = titleHit && orgHit;
  } else {
    const titleHit = title !== '' && text.includes(normalizeHtml(title));
    const orgHit = organization !== '' && text.includes(normalizeHtml(organization));
    if (titleHit) hits.push(`title:${title}`);
    if (orgHit) hits.push(`organization:${organization}`);
    anchorOk = titleHit;
  }

  if (!anchorOk) {
    return {
      ...base,
      http_status: status,
      evidence_hits: hits,
      verdict: '需人工复核',
      note: `锚点不命中（${sourceTitle ? 'source_title' : 'title'} 未在来源页命中${hits.length ? `，已命中：${hits.join('；')}` : ''}）${expiredNotice ? '；来源页为过期提示页（公告已撤下）' : ''}`,
    };
  }

  const keywordHit = RECRUIT_KEYWORDS.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
  if (!keywordHit || pausedNotice) {
    return {
      ...base,
      http_status: status,
      evidence_hits: hits,
      verdict: '需人工复核',
      note: pausedNotice
        ? '来源页标注「已暂停招聘」类停招字样，锚点命中可能来自页面装饰内容，需人工确认'
        : '疑似非招聘页：来源页未命中招聘相关关键词',
    };
  }

  return {
    ...base,
    http_status: status,
    evidence_hits: hits,
    verdict: '可升级',
    note: '锚点命中',
  };
}

/** 离线态标注：不发网络请求，全量标「未核验」（docs/interaction.md §11）。 */
export function markUnverified(record: LegacyRecord): RecheckItem {
  return {
    origin: record.origin,
    id: record.id,
    title: record.title ?? '',
    organization: record.organization ?? '',
    source_url: record.source_url ?? '',
    verdict: '未核验',
    http_status: null,
    evidence_hits: [],
    note: '离线模式未访问来源',
  };
}

/** 明细合并：按 origin+id 去重，fresh 覆盖 old 中同键条目，old 独有条目保留在前，新条目追加在后。 */
export function mergeDetails(oldItems: RecheckItem[], fresh: RecheckItem[]): RecheckItem[] {
  const keyOf = (item: RecheckItem) => `${item.origin}#${item.id}`;
  const freshByKey = new Map(fresh.map((item) => [keyOf(item), item]));
  const result: RecheckItem[] = [];
  const seen = new Set<string>();
  for (const item of oldItems) {
    const key = keyOf(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(freshByKey.get(key) ?? item);
  }
  for (const item of fresh) {
    const key = keyOf(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}

interface ReportMeta {
  generatedAt: string;
  args: string;
  sources: Record<RecheckOrigin, number>;
}

function tableRow(cells: string[]): string {
  return `| ${cells.join(' | ')} |`;
}

/**
 * 生成 report.md 全文：头部口径声明 → 分类统计 → 三个清单 → 处置建议（逐条到记录 id）。
 * 验收断言：三个清单的并集等于已复核（非「未核验」）明细的全量 id 集，无遗漏无重复。
 */
export function buildReport(details: RecheckItem[], meta: ReportMeta): string {
  const verdicts: RecheckVerdict[] = ['可升级', '需人工复核', '建议下架', '未核验'];
  const countOf = (verdict: RecheckVerdict) => details.filter((item) => item.verdict === verdict).length;
  const counts = Object.fromEntries(verdicts.map((verdict) => [verdict, countOf(verdict)])) as Record<RecheckVerdict, number>;
  const reviewed = counts['可升级'] + counts['需人工复核'] + counts['建议下架'];
  const byVerdict = (verdict: RecheckVerdict) => details.filter((item) => item.verdict === verdict);
  const idsOf = (verdict: RecheckVerdict) => byVerdict(verdict).map((item) => item.id);

  const lines: string[] = [];
  lines.push('# 遗留数据回源复核报告（recheck:legacy）', '');
  lines.push(`- 生成时间：${meta.generatedAt}`);
  lines.push(`- 运行参数：\`${meta.args}\``);
  lines.push(
    `- 清单加载：real-jobs ${meta.sources['real-jobs']} 条；platform-sources 快照 ${meta.sources['platform-sources']} 条；expanded-source-leads ${meta.sources.leads} 条`,
  );
  lines.push(`- 明细合计：${details.length} 条（已复核 ${reviewed} 条，未核验 ${counts['未核验']} 条）`);
  lines.push('', '## 分类口径（写死于 scripts/lib/recheck-core.ts 的 CLASSIFY_RULES）', '');
  CLASSIFY_RULES.forEach((rule, index) => lines.push(`${index + 1}. ${rule}`));

  lines.push('', '## 分类统计', '', tableRow(['分类', '条数']), tableRow(['---', '---']));
  verdicts.forEach((verdict) => lines.push(tableRow([verdict, String(counts[verdict])])));
  lines.push(tableRow(['合计', String(details.length)]));

  // —— 可升级清单 ——
  const upgraded = byVerdict('可升级');
  lines.push('', `### 可升级清单（${upgraded.length} 条）`, '');
  if (upgraded.length === 0) {
    lines.push('（无）');
  } else {
    lines.push(
      tableRow(['id', '单位', '岗位', '来源 URL', '命中锚点', '定层级建议']),
      tableRow(['---', '---', '---', '---', '---', '---']),
    );
    upgraded.forEach((item) => {
      lines.push(tableRow([
        item.id,
        item.organization || '—',
        item.title || '—',
        item.source_url || '—',
        item.evidence_hits.length ? item.evidence_hits.join('；') : '—',
        '来源核验',
      ]));
    });
    lines.push('');
    lines.push('可升级记录默认建议层级「来源核验」；如需判「逐字段核验」，须以 details.json 中逐片段证据经 add:jobs 补齐后另定，报告中以命中锚点为依据。');
  }

  // —— 需人工复核清单 ——
  const manual = byVerdict('需人工复核');
  lines.push('', `### 需人工复核清单（${manual.length} 条）`, '');
  if (manual.length === 0) {
    lines.push('（无）');
  } else {
    lines.push(tableRow(['id', '单位', '岗位', '原因']), tableRow(['---', '---', '---', '---']));
    manual.forEach((item) => {
      lines.push(tableRow([item.id, item.organization || '—', item.title || '—', item.note || '—']));
    });
  }

  // —— 建议下架清单 ——
  const removed = byVerdict('建议下架');
  lines.push('', `### 建议下架清单（${removed.length} 条）`, '');
  if (removed.length === 0) {
    lines.push('（无）');
  } else {
    lines.push(tableRow(['id', '单位', '岗位', 'http 状态/原因']), tableRow(['---', '---', '---', '---']));
    removed.forEach((item) => {
      const statusCell = item.http_status === null ? item.note : `HTTP ${item.http_status}｜${item.note}`;
      lines.push(tableRow([item.id, item.organization || '—', item.title || '—', statusCell || '—']));
    });
  }

  // —— 处置建议（逐条到记录 id）——
  lines.push('', '## 处置建议（逐条到记录 id）', '');
  lines.push('处置由维护者确认后执行：存活记录经 add:jobs 迁入新批次，失效记录随遗留文件移除；本脚本只产出建议，不改前台数据。');

  const originLabel: Record<RecheckOrigin, string> = {
    'real-jobs': 'real-jobs',
    'platform-sources': 'platform-sources 快照',
    leads: 'expanded-source-leads',
  };
  const groupIds = (items: RecheckItem[]) =>
    (['real-jobs', 'leads', 'platform-sources'] as RecheckOrigin[])
      .map((origin) => {
        const ids = items.filter((item) => item.origin === origin).map((item) => item.id);
        return ids.length ? `${originLabel[origin]}（${ids.length} 条）：${ids.join('、')}` : null;
      })
      .filter((line): line is string => line !== null);

  lines.push('', `### 可升级（${upgraded.length} 条）`, '');
  if (upgraded.length === 0) {
    lines.push('（无）');
  } else {
    groupIds(upgraded).forEach((line) => lines.push(`- ${line}`));
    lines.push('- 处置动作：可升级条目按证据定层级后迁入规范数据源批次文件（首轮处置已于 2026-11-04 落地：leads 27 条保留于 leads-2026-09 批次，real-jobs 可升级且未发布的 11 条已升级为来源核验并入 restored-2026-10 批次）；是否进一步逐字段核验由维护者按证据决定。');
  }

  lines.push('', `### 需人工复核（${manual.length} 条）`, '');
  if (manual.length === 0) {
    lines.push('（无）');
  } else {
    groupIds(manual).forEach((line) => lines.push(`- ${line}`));
    lines.push('- 处置动作：逐条人工打开来源页（URL 见 details.json）确认在招状态后，重新归类为可升级或建议下架；在此之前不迁入也不移除。');
  }

  lines.push('', `### 建议下架（${removed.length} 条）`, '');
  if (removed.length === 0) {
    lines.push('（无）');
  } else {
    groupIds(removed).forEach((line) => lines.push(`- ${line}`));
    lines.push('- 处置动作：建议下架条目自其所在遗留清单移除（首轮处置后 real-jobs.ts、expanded-source-leads.ts 与 platform-sources.ts 未核验快照段均已移除；后续新增的隔离清单按同一流程处置）。');
  }

  const unverified = byVerdict('未核验');
  lines.push('', `### 未核验（${unverified.length} 条）`, '');
  if (unverified.length === 0) {
    lines.push('（无）');
  } else {
    groupIds(unverified).forEach((line) => lines.push(`- ${line}`));
    lines.push(`- 处置动作：按队列顺序续跑 \`npm run recheck:legacy -- --limit ${unverified.length}\`（自动跳过已有结论条目），或以 \`--ids\` 指定上述 id 逐条复核。`);
  }

  lines.push('');
  return lines.join('\n');
}
