import type { Job } from '../lib/types';
import archivedJobs from './real-jobs';

// Restore every historical listing as a reviewable lead. Only these IDs were
// matched to exact title + organization on the linked page; all other archived
// fields are suppressed until checked against source.
const sourceCheckedIds = new Set([
  408, 407, 409, 412, 475, 496, 209, 207, 589, 583, 596, 595, 301,
]);
const alreadyFullyVerifiedIds = new Set([215, 217, 218, 577]);

const restoredJobs: Job[] = archivedJobs
  .filter((job) => !alreadyFullyVerifiedIds.has(job.id))
  .map((job) => ({
    ...job,
    province: '', city: '', location: '', org_type: '其他', job_type: '待核实',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: '', deadline: null, fetched_at: '2026-10-14', last_verified: '2026-10-14',
    status: '状态待核实', recruit_type: undefined,
    verification_level: sourceCheckedIds.has(job.id) ? '来源核验' : '待核实',
    source_title: sourceCheckedIds.has(job.id) ? job.title : undefined,
    source_evidence: sourceCheckedIds.has(job.id) ? [job.title, job.organization] : [],
  }));

export default restoredJobs;
