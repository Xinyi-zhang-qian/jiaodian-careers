import db from './db';
import { Job, JobStatus } from './types';

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    organization TEXT NOT NULL,
    province TEXT NOT NULL,
    city TEXT NOT NULL,
    location TEXT,
    org_type TEXT NOT NULL,
    job_type TEXT NOT NULL,
    original_major_requirements TEXT NOT NULL,
    platform_disciplines TEXT NOT NULL,
    required_skills TEXT NOT NULL,
    preferred_skills TEXT,
    education TEXT NOT NULL,
    experience TEXT,
    salary TEXT,
    description TEXT,
    responsibilities TEXT,
    application_info TEXT,
    published_at TEXT NOT NULL,
    deadline TEXT,
    source_name TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_url TEXT NOT NULL,
    fetched_at TEXT NOT NULL,
    last_verified TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT '招聘中',
    is_demo INTEGER NOT NULL DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_jobs_province ON jobs(province);
  CREATE INDEX IF NOT EXISTS idx_jobs_org_type ON jobs(org_type);
  CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
  CREATE INDEX IF NOT EXISTS idx_jobs_published ON jobs(published_at DESC);
`);

const rowToJob = (row: any): Job => ({
  ...row,
  platform_disciplines: JSON.parse(row.platform_disciplines),
  required_skills: JSON.parse(row.required_skills),
  preferred_skills: row.preferred_skills ? JSON.parse(row.preferred_skills) : [],
  is_demo: Boolean(row.is_demo),
});

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
  let sql = 'SELECT * FROM jobs WHERE 1=1';
  const params: any[] = [];

  if (filters.region && filters.region !== '其他地区') {
    sql += ' AND province = ?';
    params.push(filters.region);
  } else if (filters.region === '其他地区') {
    sql += " AND province NOT IN ('北京', '上海', '广东', '浙江', '江苏')";
  }

  if (filters.city) {
    sql += ' AND city = ?';
    params.push(filters.city);
  }

  if (filters.org_type) {
    sql += ' AND org_type = ?';
    params.push(filters.org_type);
  }

  if (filters.job_type) {
    sql += ' AND job_type = ?';
    params.push(filters.job_type);
  }

  if (filters.education) {
    sql += ' AND education = ?';
    params.push(filters.education);
  }

  if (filters.primary_discipline) {
    sql += ' AND platform_disciplines LIKE ?';
    params.push(`%"${filters.primary_discipline}"%`);
  }

  if (filters.secondary_discipline) {
    sql += ' AND (platform_disciplines LIKE ? OR required_skills LIKE ? OR preferred_skills LIKE ?)';
    const pat = `%"${filters.secondary_discipline}"%`;
    params.push(pat, pat, pat);
  }

  if (filters.status) {
    sql += ' AND status = ?';
    params.push(filters.status);
  }

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    sql += ' AND (title LIKE ? OR organization LIKE ? OR original_major_requirements LIKE ? OR description LIKE ?)';
    params.push(kw, kw, kw, kw);
  }

  // Sorting
  if (filters.sort === 'verified') {
    sql += ' ORDER BY last_verified DESC';
  } else if (filters.sort === 'deadline') {
    sql += ' ORDER BY CASE WHEN deadline IS NOT NULL THEN deadline ELSE "9999-12-31" END ASC';
  } else {
    sql += ' ORDER BY published_at DESC';
  }

  const page = filters.page || 1;
  const limit = filters.limit || 12;
  const offset = (page - 1) * limit;

  const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as total');
  const { total } = db.prepare(countSql).get(...params) as { total: number };

  sql += ' LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const jobs = db.prepare(sql).all(...params).map(rowToJob);

  return { jobs, total, totalPages: Math.ceil(total / limit), page };
}

export function getJob(id: number): Job | null {
  const row = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);
  return row ? rowToJob(row) : null;
}

export function getJobCountByDiscipline(discipline: string): number {
  const row = db.prepare(
    "SELECT COUNT(*) as count FROM jobs WHERE platform_disciplines LIKE ?"
  ).get(`%"${discipline}"%`) as { count: number };
  return row.count;
}

export function getDistinctCities(province: string): string[] {
  const rows = db.prepare(
    'SELECT DISTINCT city FROM jobs WHERE province = ? AND city != "" ORDER BY city'
  ).all(province) as { city: string }[];
  return rows.map(r => r.city);
}
