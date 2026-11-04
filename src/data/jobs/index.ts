// 规范数据源聚合桩：并行开发期间先行聚合既有三个数据文件，
// 使前台数据入口唯一化为 jobsCatalog（docs/design.md §4 契约 1、13）。
// 合并时由 data-foundation 的真实版本整体替换。
import verifiedJobs from '../verified-jobs';
import restoredJobs from '../restored-jobs';
import additionalVerifiedJobs from '../additional-verified-jobs';

const jobsCatalog = [...verifiedJobs, ...restoredJobs, ...additionalVerifiedJobs];

export default jobsCatalog;
