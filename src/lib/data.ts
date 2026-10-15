import { Job } from './types';
import verifiedJobs from '../data/verified-jobs';
import restoredJobs from '../data/restored-jobs';

// Publish the complete 300-record catalog. Each record carries a verification
// level so the UI distinguishes field-level, source-level and key-field checks.
const allJobs: Job[] = [...verifiedJobs, ...restoredJobs];


export function getJobs(filters: {
  region?: string;
  city?: string;
  org_type?: string;
  job_type?: string;
  education?: string;
  primary_discipline?: string;
  secondary_discipline?: string;
  status?: string;
  keyword?: string;
  page?: number;
  limit?: number;
  sort?: 'newest' | 'verified' | 'deadline';
} = {}) {
  let result = [...allJobs];

  if (filters.region && filters.region !== '其他地区') {
    result = result.filter(j => j.province.includes(filters.region!));
  } else if (filters.region === '其他地区') {
    result = result.filter(j => !['北京', '上海', '天津', '广东', '浙江', '江苏'].some((region) => j.province.includes(region)));
  }

  if (filters.city) result = result.filter(j => j.city === filters.city);
  if (filters.org_type) result = result.filter(j => j.org_type === filters.org_type);
  if (filters.job_type) result = result.filter(j => j.job_type === filters.job_type);
  if (filters.education) result = result.filter(j => j.education === filters.education);
  if (filters.primary_discipline) result = result.filter(j => j.platform_disciplines.includes(filters.primary_discipline!));
  if (filters.secondary_discipline) {
    const kw = filters.secondary_discipline.toLowerCase();
    result = result.filter(j =>
      j.platform_disciplines.some(d => d.toLowerCase().includes(kw)) ||
      j.required_skills.some(s => s.toLowerCase().includes(kw)) ||
      j.preferred_skills.some(s => s.toLowerCase().includes(kw))
    );
  }
  if (filters.status) result = result.filter(j => j.status === filters.status);
  if (filters.keyword) {
    const kw = filters.keyword.toLowerCase();
    result = result.filter(j =>
      j.title.toLowerCase().includes(kw) ||
      j.organization.toLowerCase().includes(kw) ||
      j.province.toLowerCase().includes(kw) ||
      j.city.toLowerCase().includes(kw) ||
      j.location.toLowerCase().includes(kw) ||
      j.original_major_requirements.toLowerCase().includes(kw) ||
      j.description.toLowerCase().includes(kw)
    );
  }

  // Sort
  if (filters.sort === 'verified') {
    result.sort((a, b) => b.last_verified.localeCompare(a.last_verified));
  } else if (filters.sort === 'deadline') {
    result.sort((a, b) => {
      const da = a.deadline || '9999-12-31';
      const db = b.deadline || '9999-12-31';
      return da.localeCompare(db);
    });
  } else {
    result.sort((a, b) => b.published_at.localeCompare(a.published_at));
  }

  const total = result.length;
  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const totalPages = Math.ceil(total / limit);
  const start = (page - 1) * limit;
  const pagedJobs = result.slice(start, start + limit);

  return { jobs: pagedJobs, total, totalPages, page };
}

export function getJob(id: number): Job | null {
  return allJobs.find(j => j.id === id) || null;
}

export function getJobIds(): number[] {
  return allJobs.map((job) => job.id);
}

export function getJobCountByDiscipline(discipline: string): number {
  return allJobs.filter(j => j.platform_disciplines.includes(discipline)).length;
}

export function getDistinctCities(province: string): string[] {
  return [...new Set(allJobs.filter(j => j.province.includes(province) && j.city).map(j => j.city))].sort();
}
