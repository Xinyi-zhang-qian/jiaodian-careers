'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { getJobs, getDistinctCities } from '@/lib/data';
import JobCard from '@/components/jobs/job-card';
import { ORG_TYPES, JOB_TYPES, EDUCATION_LEVELS, JOB_STATUSES, DISCIPLINES } from '@/lib/utils';

function JobsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    region: searchParams.get('region') || '',
    city: searchParams.get('city') || '',
    org_type: searchParams.get('org_type') || '',
    job_type: searchParams.get('job_type') || '',
    education: searchParams.get('education') || '',
    discipline: searchParams.get('discipline') || '',
    secondary_discipline: searchParams.get('secondary_discipline') || '',
    status: searchParams.get('status') || '',
    sort: (searchParams.get('sort') as 'newest' | 'verified' | 'deadline') || 'newest',
    page: parseInt(searchParams.get('page') || '1', 10),
  });

  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => {
    if (filters.region) {
      setCities(getDistinctCities(filters.region));
    } else {
      setCities([]);
    }
  }, [filters.region]);

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'newest' && value !== '1') {
        params.set(key, String(value));
      }
    });
    router.replace(`/jobs?${params.toString()}`, { scroll: false });
  }, [filters]);

  const { jobs, total, totalPages } = getJobs({
    region: filters.region,
    city: filters.city,
    org_type: filters.org_type,
    job_type: filters.job_type,
    education: filters.education,
    primary_discipline: filters.discipline,
    secondary_discipline: filters.secondary_discipline,
    status: filters.status,
    keyword: filters.q,
    page: filters.page,
    sort: filters.sort,
  });

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const setPage = (page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  };

  const clearFilters = () => {
    setFilters({
      q: '', region: '', city: '', org_type: '', job_type: '',
      education: '', discipline: '', secondary_discipline: '', status: '',
      sort: 'newest', page: 1,
    });
  };

  const hasActiveFilters = filters.region || filters.city || filters.org_type || filters.job_type || filters.education || filters.discipline || filters.secondary_discipline || filters.status || filters.q;

  return (
    <div>
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-surface text-text-secondary"
        >
          <Filter className="w-4 h-4" />
          筛选条件
          {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-brand" />}
        </button>
      </div>

      <div className="flex gap-6">
        {/* Filter Sidebar */}
        <aside className={`lg:w-[260px] flex-shrink-0 ${showFilters ? 'block' : 'hidden lg:block'}`}>
          <div className="sticky top-8 p-5 rounded-2xl border border-border bg-surface space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-text-primary">筛选</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-brand hover:text-brand-dark">
                  清除
                </button>
              )}
            </div>

            {/* Keyword */}
            <FilterGroup label="关键词">
              <input
                type="text"
                value={filters.q}
                onChange={(e) => updateFilter('q', e.target.value)}
                placeholder="岗位、专业、技能或单位"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </FilterGroup>

            {/* Region */}
            <FilterGroup label="地区">
              <select
                value={filters.region}
                onChange={(e) => updateFilter('region', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {['北京', '上海', '广州', '浙江', '江苏', '其他地区'].map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </FilterGroup>

            {/* City */}
            {cities.length > 0 && (
              <FilterGroup label="城市">
                <select
                  value={filters.city}
                  onChange={(e) => updateFilter('city', e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
                >
                  <option value="">全部</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </FilterGroup>
            )}

            {/* Org Type */}
            <FilterGroup label="单位类型">
              <select
                value={filters.org_type}
                onChange={(e) => updateFilter('org_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FilterGroup>

            {/* Job Type */}
            <FilterGroup label="岗位类型">
              <select
                value={filters.job_type}
                onChange={(e) => updateFilter('job_type', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </FilterGroup>

            {/* Education */}
            <FilterGroup label="学历要求">
              <select
                value={filters.education}
                onChange={(e) => updateFilter('education', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {EDUCATION_LEVELS.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </FilterGroup>

            {/* Primary Discipline */}
            <FilterGroup label="主学科">
              <select
                value={filters.discipline}
                onChange={(e) => updateFilter('discipline', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {DISCIPLINES.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </FilterGroup>

            {/* Secondary Discipline */}
            <FilterGroup label="第二学科／技能">
              <input
                type="text"
                value={filters.secondary_discipline}
                onChange={(e) => updateFilter('secondary_discipline', e.target.value)}
                placeholder="如：Python、伦理学"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            </FilterGroup>

            {/* Status */}
            <FilterGroup label="招聘状态">
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
              >
                <option value="">全部</option>
                {JOB_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </FilterGroup>
          </div>
        </aside>

        {/* Job List */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-sm text-text-secondary">{total} 个岗位</span>
              {filters.q && <span className="ml-2 text-sm text-brand">搜索：{filters.q}</span>}
            </div>
            <select
              value={filters.sort}
              onChange={(e) => updateFilter('sort', e.target.value)}
              className="px-3 py-2 rounded-lg border border-border text-sm focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand bg-surface"
            >
              <option value="newest">最新发布</option>
              <option value="verified">最近核验</option>
              <option value="deadline">截止日期</option>
            </select>
          </div>

          {jobs.length === 0 ? (
            <div className="py-16 text-center text-text-secondary">
              <p className="text-lg">没有找到匹配的岗位</p>
              <p className="mt-2 text-sm">请尝试调整筛选条件或搜索关键词</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                disabled={filters.page === 1}
                onClick={() => setPage(filters.page - 1)}
                className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:border-brand hover:text-brand transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm transition-colors ${
                    p === filters.page
                      ? 'bg-brand text-white'
                      : 'border border-border hover:border-brand hover:text-brand'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                disabled={filters.page === totalPages}
                onClick={() => setPage(filters.page + 1)}
                className="px-4 py-2 rounded-lg border border-border text-sm disabled:opacity-40 hover:border-brand hover:text-brand transition-colors"
              >
                下一页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-text-secondary mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="py-16 text-center text-text-secondary">加载中...</div>}>
      <JobsContent />
    </Suspense>
  );
}
