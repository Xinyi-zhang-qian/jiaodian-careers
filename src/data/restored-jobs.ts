import type { Job } from '../lib/types';
import archivedJobs from './real-jobs';

// Publish every historical listing with a conservative key-field verification
// level. The original title, organization and source URL are retained; details
// such as salary, education, responsibilities and current status are not
// asserted unless separately checked against the source page.
const sourceCheckedIds = new Set([
  408, 407, 409, 412, 475, 496, 209, 207, 589, 583, 596, 301,
  595,
]);
const alreadyFullyVerifiedIds = new Set([215, 217, 218, 577]);
// The original National Museum recruitment announcement now returns 404 and
// the remaining official page is only a shortlist/result notice, so do not
// publish it as an actionable vacancy.
const withdrawnSourceIds = new Set([506]);
// Do not publish records whose current source is inaccessible, non-specific,
// or a repost rather than an exact recruitment page.
const invalidSourceIds = new Set([304, 549, 558]);

function hasDirectSourcePage(sourceUrl: string) {
  try {
    const parsed = new URL(sourceUrl);
    // NIO's official campus-recruitment microsite is intentionally served at
    // the domain root, but it is a recruitment page rather than a corporate
    // homepage.
    if (parsed.hostname === 'intern.nio.com') return true;
    const pathname = parsed.pathname;
    return pathname !== '' && pathname !== '/' && pathname !== '/index.html';
  } catch {
    return false;
  }
}

const restoredJobs: Job[] = archivedJobs
  .filter((job) => !alreadyFullyVerifiedIds.has(job.id)
    && !withdrawnSourceIds.has(job.id)
    && !invalidSourceIds.has(job.id)
    && hasDirectSourcePage(job.source_url))
  .map((job) => ({
    ...job,
    province: job.province, city: job.city, location: job.location,
    org_type: job.org_type, job_type: job.job_type,
    original_major_requirements: '', platform_disciplines: [], required_skills: [], preferred_skills: [],
    education: '', experience: '', salary: null, description: '', responsibilities: '', application_info: '',
    published_at: job.published_at, deadline: null, fetched_at: '2026-10-15', last_verified: '2026-10-15',
    status: '状态待核实', recruit_type: undefined,
    verification_level: sourceCheckedIds.has(job.id) ? '来源核验' : '关键字段核验',
    source_title: job.title,
    source_evidence: [job.title, job.organization],
  }));

export default restoredJobs;
