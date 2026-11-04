// 首页「跨学科职能入口」计数逻辑（site-design 模块）。
// 依据 docs/modules/site-design_interaction.md §2：对全量记录按 JOB_FUNCTIONS
// 枚举本地统计 job_functions 命中数，只保留计数 >0 的职能并按计数降序排列
// （同数按枚举声明顺序，依赖稳定排序）。不调用 getJobs 的 job_function 过滤
// 参数——该参数由 src/lib/data.ts 的 getJobs 提供；本地统计与 getJobs 的职能过滤语义一致。
import { JOB_FUNCTIONS } from './utils';
import type { Job } from './types';

export interface JobFunctionEntry {
  name: string;
  count: number;
}

export function getJobFunctionEntries(jobs: readonly Job[]): JobFunctionEntry[] {
  return JOB_FUNCTIONS.map((name) => ({
    name,
    count: jobs.filter((job) => job.job_functions?.includes(name)).length,
  }))
    .filter((entry) => entry.count > 0)
    .sort((a, b) => b.count - a.count);
}
