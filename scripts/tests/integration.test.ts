// 库级集成测试：整库构建产物与数据链一致性（docs/test.md「全局测试」节登记条目）。
// 覆盖两条链路：①构建期数据链——jobsCatalog 经 SSG 固化为 out/ 静态页，每个岗位有独立详情页；
// ②端到端内容——详情页 HTML 含岗位标题、来源链接与核验锚点，404 页存在。
import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { ok } from 'node:assert';
import { join } from 'node:path';

async function main() {
const root = process.cwd();
const outDir = join(root, 'out');

// out/ 缺失时先执行整库构建（保证测试自包含；构建含 prebuild 离线审计门禁）
if (!existsSync(join(outDir, 'index.html'))) {
  console.log('out/ 不存在，先执行整库构建（npm run build）…');
  execSync('npm run build', { stdio: 'inherit' });
}

ok(existsSync(join(outDir, 'index.html')), 'out/index.html 应存在（整库构建成功）');
ok(existsSync(join(outDir, '404.html')), 'out/404.html 应存在（静态导出默认 404 页）');
ok(existsSync(join(outDir, 'jobs')), 'out/jobs/ 应存在');

// 详情页数量与 jobsCatalog 一致
const catalog = (await import('../../src/data/jobs')).default as { id: number; title: string; source_url: string; source_evidence?: string[] }[];
const jobDirs = readdirSync(join(outDir, 'jobs')).filter((name) => {
  const p = join(outDir, 'jobs', name);
  return statSync(p).isDirectory() && existsSync(join(p, 'index.html'));
});
ok(jobDirs.length === catalog.length, `out/jobs/ 详情页数量（${jobDirs.length}）应等于 jobsCatalog 条数（${catalog.length}）`);

// 抽查三条详情页内容：标题、来源链接、核验锚点片段均出现在 HTML 中
const catalogById = new Map(catalog.map((j) => [String(j.id), j]));
const sampleIds = ['577', '401', '2001'].filter((id) => catalogById.has(id));
ok(sampleIds.length >= 1, '抽样 id 至少一条存在于目录');
for (const id of sampleIds) {
  const job = catalogById.get(id)!;
  const html = readFileSync(join(outDir, 'jobs', id, 'index.html'), 'utf8');
  ok(html.includes(job.title), `详情页 ${id} 应含岗位标题「${job.title}」`);
  ok(html.includes(job.source_url), `详情页 ${id} 应含来源链接`);
  const anchor = (job.source_evidence ?? [])[0];
  if (anchor) ok(html.includes(anchor.slice(0, 12)), `详情页 ${id} 应含核验锚点片段开头`);
}

console.log(`通过：整库构建产物一致性（${jobDirs.length} 个详情页，抽样 ${sampleIds.length} 条内容核对）`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
