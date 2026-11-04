// 聚合测试入口：动态发现并逐个运行 scripts/tests/ 下的断言脚本（docs/interaction.md §11 npm run test）。
// 各模块测试文件自带有统计与退出码，本入口只负责聚合与汇总，任一套件失败即退出码 1。
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const testsDir = path.resolve('scripts/tests');
const tsx = path.resolve('node_modules/.bin/tsx');

const files = readdirSync(testsDir)
  .filter((file) => file.endsWith('.test.ts') && file !== 'run-all.ts')
  .sort();

if (files.length === 0) {
  console.error('scripts/tests/ 下没有发现 *.test.ts 测试文件。');
  process.exitCode = 1;
} else {
  const failed: string[] = [];
  for (const file of files) {
    console.log(`\n=== 运行 ${file} ===`);
    const result = spawnSync(tsx, [path.join(testsDir, file)], { stdio: 'inherit' });
    if (result.status !== 0) failed.push(file);
  }
  console.log(`\n聚合测试完成：${files.length - failed.length}/${files.length} 个套件通过`);
  if (failed.length > 0) {
    console.error(`失败套件：${failed.join('、')}`);
    process.exitCode = 1;
  }
}
