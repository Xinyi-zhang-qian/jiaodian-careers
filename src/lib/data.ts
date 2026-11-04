import { Job } from './types';
import { JOB_FUNCTIONS } from './utils';
import type { ListingKind } from './utils';
import jobsCatalog from '../data/jobs';

// 前台岗位目录唯一数据入口：规范数据源聚合结果 jobsCatalog（docs/design.md §4 契约 1）。
const allJobs: Job[] = [...jobsCatalog];

export interface JobFilters {
  region?: string;
  city?: string;
  org_type?: string;
  job_type?: string;
  education?: string;
  primary_discipline?: string;
  secondary_discipline?: string;
  job_function?: string;
  status?: string;
  keyword?: string;
  sort?: 'newest' | 'verified' | 'deadline';
}

// 对任意目录应用筛选与排序（不含分页）的纯函数；getJobs 在此之上做分页包装。
// 抽为独立纯函数，便于对混合目录（含/不含 job_functions 字段）做单元测试。
export function filterJobs(jobs: Job[], filters: JobFilters = {}): Job[] {
  let result = [...jobs];

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
  // 职能过滤：仅接受 JOB_FUNCTIONS 枚举值，空值与非枚举值视为未选择、不做过滤
  // （与 docs/interaction.md §6「非枚举值按无筛选处理」一致）；记录缺 job_functions 字段不命中。
  const jobFunction = filters.job_function;
  if (jobFunction && (JOB_FUNCTIONS as readonly string[]).includes(jobFunction)) {
    result = result.filter(j => j.job_functions?.includes(jobFunction));
  }
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

  // 排序
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

  return result;
}

export function getJobs(filters: JobFilters & { page?: number; limit?: number } = {}) {
  const result = filterJobs(allJobs, filters);

  const total = result.length;
  const limit = filters.limit || 12;
  const totalPages = Math.ceil(total / limit);
  // 非法页码（负数、越界）按第 1 页处理（docs/interaction.md §6）。
  const page = Math.max(1, Math.min(filters.page || 1, totalPages || 1));
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

// —— 即将截止与报名窗口判定（纯函数，供列表页、详情页与测试复用） ——

// 计算报名截止剩余天数：按本地时区取日期部分做日历差。
// 无 deadline、status 为「已截止」或日期非法返回 null；deadline 当天为 0，过去为负数。
// today 仅供测试注入当前日期，缺省取系统今天。
export function deadlineDaysLeft(job: Job, today: Date = new Date()): number | null {
  if (!job.deadline || job.status === '已截止') return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(job.deadline)) return null;
  const [year, month, day] = job.deadline.split('-').map(Number);
  const deadlineDate = new Date(year, month - 1, day);
  // 防御不存在的日历日期（如 02-30）：Date 构造会静默进位，回读不一致即非法。
  if (deadlineDate.getFullYear() !== year || deadlineDate.getMonth() !== month - 1 || deadlineDate.getDate() !== day) {
    return null;
  }
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((deadlineDate.getTime() - todayStart.getTime()) / 86400000);
}

// 「即将截止」徽标文案：仅 status 为「招聘中」且剩余天数 0–7 时展示；当天为「今天截止」。
// 已截止、无 deadline、已过期（负数）均不展示。
export function deadlineBadgeLabel(job: Job, today: Date = new Date()): string | null {
  if (job.status !== '招聘中') return null;
  const days = deadlineDaysLeft(job, today);
  if (days === null || days < 0 || days > 7) return null;
  return days === 0 ? '今天截止' : `${days} 天后截止`;
}

export interface ApplicationWindowView {
  visible: boolean;
  publicRecruitNotice: boolean;
}

// 报名窗口区块渲染判定：有报名开始、报名截止、报名方式之一，或条目为公告/项目级时展示；
// 事业单位的公告/项目级条目在区块标题旁突出标注「事业单位公开招聘」。
export function applicationWindow(job: Job, listingKind: ListingKind): ApplicationWindowView {
  const visible = Boolean(job.application_opens_at || job.deadline || job.application_info) || listingKind !== '具体岗位';
  const publicRecruitNotice = visible && listingKind !== '具体岗位' && job.org_type === '事业单位';
  return { visible, publicRecruitNotice };
}
