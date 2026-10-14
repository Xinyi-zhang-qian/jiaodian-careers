import type { Job } from '../lib/types';
import archivedJobs from './real-jobs';

// These archive records were confirmed against their linked pages for exact
// title + organization only. Other fields are deliberately blank, not inferred.
const confirmedIds = new Set([
  408, 407, 409, 412, 475, 496, 209, 207, 589, 583, 596, 595, 301,
]);

const restoredJobs: Job[] = archivedJobs
  .filter((job) => confirmedIds.has(job.id))
  .map((job) => ({
    ...job,
    province: '', city: '', location: '', org_type: '其他', job_type: '待核实',
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: '', deadline: null, fetched_at: '2026-10-14', last_verified: '2026-10-14',
    status: '状态待核实', recruit_type: undefined,
    verification_level: '来源核验', source_title: job.title,
    source_evidence: [job.title, job.organization],
  }));

export default restoredJobs;
