// legacy-cleanup 模块测试
// 依据 docs/modules/legacy-cleanup_interaction.md §2-§4 与 docs/interaction.md §11。
// 运行：npx tsx scripts/tests/legacy-cleanup.test.ts
// 全部网络行为使用注入的 fetch 假实现，不发真实请求。
import assert from 'node:assert/strict';
import {
  classifySource,
  markUnverified,
  mergeDetails,
  normalizeHtml,
  buildReport,
} from '../lib/recheck-core';
import type { LegacyRecord, RecheckItem } from '../lib/recheck-core';

let passed = 0;
const failures: string[] = [];
const cases: string[] = [];

async function test(name: string, fn: () => void | Promise<void>) {
  cases.push(name);
  try {
    await fn();
    passed += 1;
    console.log(`  通过 | ${name}`);
  } catch (error) {
    failures.push(name);
    console.error(`  失败 | ${name}`);
    console.error(`    ${error instanceof Error ? error.message : String(error)}`);
  }
}

function record(overrides: Partial<LegacyRecord> = {}): LegacyRecord {
  return {
    origin: 'leads',
    id: '1001',
    title: '通信网络工程师',
    organization: '中国移动通信有限公司',
    source_url: 'https://career.nankai.edu.cn/correcruit/content/id/118222.html',
    source_title: '中国移动2027校园招聘全面启动！',
    ...overrides,
  };
}

// 注入的 fetch 假实现：返回给定文本与状态
function fetchOk(html: string, status = 200): typeof fetch {
  return (async () => new Response(html, { status })) as typeof fetch;
}

// 注入的 fetch 假实现：抛出给定异常
function fetchThrows(error: unknown): typeof fetch {
  return (async () => {
    throw error;
  }) as typeof fetch;
}

// —— 夹具 HTML ——
// 正文命中 source_title；script 块中故意重复同一标题，验证 script 内容不计入判定。
const HIT_HTML = `<html><head><title>南开大学就业信息网</title>
<script>var cached = "中国移动2027校园招聘全面启动！";</script>
<style>.title { color: red; }</style></head>
<body><nav>首页&nbsp;&nbsp;招聘公告</nav>
<article><h1>中国移动2027校园招聘全面启动！</h1>
<p>中国移动通信有限公司面向2027届毕业生开展校园招聘，岗位包括通信网络工程师等。</p>
</article></body></html>`;

const PLATFORM_HIT_HTML = `<html><body>
<h1>AI 产品经理（Agent 研发平台）</h1>
<p>Moka 深圳 20–40K/月，职位页提到 Agent 研发平台与工作流编排。</p>
</body></html>`;

const MISS_HTML = `<html><body><p>今日校园通知：图书馆开放时间调整。</p></body></html>`;

async function main() {

await test('classifySource：source_title 命中 → 可升级，script 内容不计入', async () => {
  const item = await classifySource(record(), { fetchImpl: fetchOk(HIT_HTML) });
  assert.equal(item.verdict, '可升级');
  assert.equal(item.http_status, 200);
  assert.ok(
    item.evidence_hits.some((hit) => hit.startsWith('source_title:')),
    `evidence_hits 应含 source_title 命中，实际 ${JSON.stringify(item.evidence_hits)}`,
  );
});

await test('classifySource：平台快照 title+organization 都命中 → 可升级', async () => {
  const item = await classifySource(
    record({
      origin: 'platform-sources',
      id: 'ps-1',
      title: 'AI 产品经理（Agent 研发平台）',
      organization: 'Moka',
      source_url: 'https://www.zhipin.com/job_detail/faa59b8168d6fbb00nJ509i0EVJR.html',
      source_title: undefined,
    }),
    { fetchImpl: fetchOk(PLATFORM_HIT_HTML) },
  );
  assert.equal(item.verdict, '可升级');
  assert.ok(item.evidence_hits.some((hit) => hit.startsWith('title:')));
  assert.ok(item.evidence_hits.some((hit) => hit.startsWith('organization:')));
});

await test('classifySource：平台快照 organization 不命中 → 需人工复核', async () => {
  const item = await classifySource(
    record({
      origin: 'platform-sources',
      id: 'ps-1',
      title: 'AI 产品经理（Agent 研发平台）',
      organization: '不存在的单位',
      source_title: undefined,
    }),
    { fetchImpl: fetchOk(PLATFORM_HIT_HTML) },
  );
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('锚点不命中'), `note 实际为：${item.note}`);
});

await test('classifySource：内容对不上（锚点不命中）→ 需人工复核', async () => {
  const item = await classifySource(record(), { fetchImpl: fetchOk(MISS_HTML) });
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('锚点不命中'), `note 实际为：${item.note}`);
});

await test('classifySource：HTTP 200 但规范化文本为空 → 需人工复核', async () => {
  const item = await classifySource(record(), {
    fetchImpl: fetchOk('<html><body></body></html>'),
  });
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('页面内容为空'), `note 实际为：${item.note}`);
});

await test('classifySource：疑似非招聘页 → 需人工复核', async () => {
  // 锚点命中（正文含 source_title）但页面无任何招聘相关关键词。
  const html = '<html><body><h1>2027届秋季宣讲行程公布</h1><p>公司简介：我们销售矿泉水。</p></body></html>';
  const item = await classifySource(
    record({ source_title: '2027届秋季宣讲行程公布' }),
    { fetchImpl: fetchOk(html) },
  );
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('疑似非招聘页'), `note 实际为：${item.note}`);
});

await test('classifySource：来源页为过期提示页 → 需人工复核且 note 标注', async () => {
  // 南开就业网对已撤下公告返回 200 的「该信息已过期」跳转页（实测行为），如实标注。
  const html = '<html><body><div>跳转提示</div><div>操作失败！ 该信息已过期！</div><div>页面自动跳转 等待时间：3</div></body></html>';
  const item = await classifySource(record(), { fetchImpl: fetchOk(html) });
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('锚点不命中'), `note 实际为：${item.note}`);
  assert.ok(item.note.includes('过期提示页'), `note 应标注过期提示页，实际为：${item.note}`);
});

await test('classifySource：页面标注已暂停招聘 → 需人工复核（锚点命中也不得升级）', async () => {
  // 猎聘实测：页面标题栏与关联职位仍含锚点文本，但目标职位标注「该职位已暂停招聘」。
  const html = '<html><body><h1>AI 产品经理（Agent 研发平台）</h1><p>Moka 职位页提到 Agent 研发平台。</p><p>该职位已暂停招聘，投递了该职位的人还查看了以下职位。</p></body></html>';
  const item = await classifySource(
    record({
      origin: 'platform-sources',
      id: 'ps-4',
      title: 'AI 产品经理（Agent 研发平台）',
      organization: 'Moka',
      source_title: undefined,
    }),
    { fetchImpl: fetchOk(html) },
  );
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('已暂停招聘'), `note 实际为：${item.note}`);
});

await test('classifySource：网络异常 → 需人工复核且 note 含原因', async () => {
  const item = await classifySource(record(), {
    fetchImpl: fetchThrows(new Error('connect ECONNRESET 1.2.3.4')),
  });
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('访问失败：'), `note 实际为：${item.note}`);
  assert.ok(item.note.includes('ECONNRESET'), `note 应含异常原因，实际为：${item.note}`);
  assert.equal(item.http_status, null);
});

await test('classifySource：请求超时 → 需人工复核且 note 含原因', async () => {
  const item = await classifySource(record(), {
    fetchImpl: fetchThrows(Object.assign(new Error('The operation was aborted'), { name: 'TimeoutError' })),
    timeoutMs: 15,
  });
  assert.equal(item.verdict, '需人工复核');
  assert.ok(item.note.includes('访问失败：'), `note 实际为：${item.note}`);
});

await test('classifySource：URL 非法 → 建议下架', async () => {
  const item = await classifySource(record({ source_url: 'not-a-url' }), {
    fetchImpl: fetchOk(HIT_HTML),
  });
  assert.equal(item.verdict, '建议下架');
  assert.ok(item.note.includes('URL 非法'), `note 实际为：${item.note}`);
});

await test('classifySource：HTTP 404 → 建议下架', async () => {
  const item = await classifySource(record(), { fetchImpl: fetchOk('Not Found', 404) });
  assert.equal(item.verdict, '建议下架');
  assert.ok(item.note.includes('404'), `note 实际为：${item.note}`);
  assert.equal(item.http_status, 404);
});

await test('classifySource：HTTP 403 反爬拦截 → 建议下架', async () => {
  const item = await classifySource(record(), { fetchImpl: fetchOk('Forbidden', 403) });
  assert.equal(item.verdict, '建议下架');
  assert.ok(item.note.includes('疑似反爬拦截'), `note 实际为：${item.note}`);
});

await test('classifySource：域名失效（ENOTFOUND）→ 建议下架', async () => {
  const error = Object.assign(new Error('getaddrinfo ENOTFOUND dead.example.com'), {
    cause: { code: 'ENOTFOUND' },
  });
  const item = await classifySource(record(), { fetchImpl: fetchThrows(error) });
  assert.equal(item.verdict, '建议下架');
  assert.ok(item.note.includes('域名失效'), `note 实际为：${item.note}`);
});

await test('normalizeHtml：去 script/style/标签/实体/空白，统一破折号', () => {
  const html = '<div><script>ignore()</script><style>.a{}</style>'
    + '<h1>中国移动2027校园招聘</h1>'
    + '<p>岗位&nbsp;&amp;&nbsp;职责：A&amp;B，&quot;引用&quot;，&lt;标签&gt;，&#160;2026–2027年。</p></div>';
  const out = normalizeHtml(html);
  assert.equal(out.includes('ignore()'), false, 'script 内容应被移除');
  assert.equal(out.includes('.a{}'), false, 'style 内容应被移除');
  assert.ok(out.includes('中国移动2027校园招聘'), `跨标签标题应连续，实际：${out}`);
  assert.ok(out.includes('A&B'), '实体 &amp; 应解码');
  assert.ok(out.includes('"引用"'), '实体 &quot; 应解码');
  assert.ok(out.includes('<标签>'), '实体 &lt;/&gt; 应解码');
  assert.ok(out.includes('2026-2027'), 'en dash 应统一为 -');
  assert.equal(/\s/.test(out), false, '空白应全部压缩');
});

await test('markUnverified：离线标注为未核验', () => {
  const item = markUnverified(record());
  assert.equal(item.verdict, '未核验');
  assert.equal(item.http_status, null);
  assert.equal(item.evidence_hits.length, 0);
  assert.ok(item.note.includes('离线模式未访问来源'), `note 实际为：${item.note}`);
});

await test('mergeDetails：同 origin+id 覆盖，其余保留，无重复', () => {
  const oldItems: RecheckItem[] = [
    { ...markUnverified(record({ id: '401', origin: 'real-jobs' })) },
    { ...markUnverified(record({ id: '402', origin: 'real-jobs' })) },
    { ...markUnverified(record({ id: '1001' })) },
  ];
  const fresh: RecheckItem[] = [
    { ...markUnverified(record({ id: '402', origin: 'real-jobs' })), verdict: '可升级', note: '新结论' },
    { ...markUnverified(record({ id: '403', origin: 'real-jobs' })) },
  ];
  const merged = mergeDetails(oldItems, fresh);
  assert.equal(merged.length, 4, '合并后应为 4 条（402 覆盖、403 追加）');
  const get = (origin: string, id: string) =>
    merged.find((item) => item.origin === origin && item.id === id);
  assert.equal(get('real-jobs', '402')?.verdict, '可升级', '同 id 应被新结果覆盖');
  assert.equal(get('real-jobs', '401')?.verdict, '未核验', '旧独有条目应保留');
  assert.equal(get('leads', '1001')?.verdict, '未核验', '旧独有条目应保留');
  assert.equal(get('real-jobs', '403')?.verdict, '未核验', '新条目应追加');
  const keys = new Set(merged.map((item) => `${item.origin}#${item.id}`));
  assert.equal(keys.size, merged.length, '合并结果不得有重复键');
});

await test('buildReport：三清单并集等于已复核全集、无重复、未核验不进清单', () => {
  const details: RecheckItem[] = [
    { ...markUnverified(record({ id: '1001' })), verdict: '可升级', http_status: 200, evidence_hits: ['source_title:中国移动2027校园招聘全面启动！'], note: '锚点命中' },
    { ...markUnverified(record({ id: '1002' })), verdict: '可升级', http_status: 200, evidence_hits: ['source_title:中国移动2027校园招聘全面启动！'], note: '锚点命中' },
    { ...markUnverified(record({ id: '401', origin: 'real-jobs' })), verdict: '需人工复核', http_status: 200, evidence_hits: [], note: '锚点不命中' },
    { ...markUnverified(record({ id: '402', origin: 'real-jobs' })), verdict: '建议下架', http_status: 404, evidence_hits: [], note: 'HTTP 404（页面不存在）' },
    { ...markUnverified(record({ id: 'ps-1', origin: 'platform-sources' })), verdict: '需人工复核', http_status: 403, evidence_hits: [], note: 'HTTP 403（疑似反爬拦截）' },
    { ...markUnverified(record({ id: 'ps-2', origin: 'platform-sources' })) },
  ];
  const report = buildReport(details, {
    generatedAt: '2026-11-04 18:00:00',
    args: '--offline',
    sources: { 'real-jobs': 2, 'platform-sources': 2, leads: 2 },
  });
  const sectionIds = (heading: string): string[] => {
    const startIndex = report.indexOf(heading);
    assert.ok(startIndex >= 0, `报告应包含小节「${heading}」`);
    const rest = report.slice(startIndex);
    const nextHeading = rest.indexOf('\n### ', 1);
    const body = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
    const ids: string[] = [];
    for (const line of body.split('\n')) {
      if (!line.startsWith('| ')) continue;
      const first = line.slice(2).split('|')[0].trim();
      if (first === 'id' || first.startsWith('---') || first === '') continue;
      ids.push(first);
    }
    return ids;
  };
  const upgraded = sectionIds('### 可升级清单');
  const manual = sectionIds('### 需人工复核清单');
  const removed = sectionIds('### 建议下架清单');
  const all = [...upgraded, ...manual, ...removed];
  assert.deepEqual(
    [...all].sort(),
    ['1001', '1002', '401', '402', 'ps-1'].sort(),
    '三清单并集应等于已复核全集',
  );
  assert.equal(new Set(all).size, all.length, '同一 id 不得在清单中重复出现');
  assert.equal(new Set(upgraded).size, upgraded.length, '可升级清单内部无重复');
  assert.ok(!all.includes('ps-2'), '未核验条目不得进入三个清单');
  assert.ok(report.includes('未核验'), '统计区应单独呈现未核验');
  assert.ok(report.includes('ps-2'), '处置建议应点名未核验条目');
});

const total = cases.length;
console.log(`\nlegacy-cleanup 模块测试：通过 ${passed}/${total}`);
if (failures.length > 0) {
  console.error(`失败明细：${failures.join('；')}`);
  process.exitCode = 1;
}

}

main().catch((error) => {
  console.error(`测试执行异常：${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
