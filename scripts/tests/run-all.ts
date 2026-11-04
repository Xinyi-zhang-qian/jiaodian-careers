// npm run test 聚合入口：依次运行 scripts/tests/ 下全部 *.test.ts 断言脚本，
// 任一套件抛出断言失败即记录，最终任一失败以退出码 1 结束。
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const testsDir = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const testFiles = readdirSync(testsDir).filter((name) => name.endsWith('.test.ts')).sort();

  const failures: { file: string; message: string }[] = [];
  let passed = 0;

  for (const file of testFiles) {
    console.log(`\n===== 套件 ${file} =====`);
    try {
      await import(path.join(testsDir, file));
      passed += 1;
      console.log(`[通过] ${file}`);
    } catch (error) {
      failures.push({ file, message: error instanceof Error ? error.message : String(error) });
      console.error(`[失败] ${file}`);
    }
  }

  console.log(`\n测试套件：${passed} 通过 / ${failures.length} 失败（共 ${testFiles.length}）`);
  if (failures.length > 0) {
    console.error('失败断言明细：');
    for (const failure of failures) {
      console.error(`- ${failure.file}: ${failure.message}`);
    }
    process.exitCode = 1;
  }
}

main();
