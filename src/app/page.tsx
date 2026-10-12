'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { getJobs, getJobCountByDiscipline } from '@/lib/data';
import JobCard from '@/components/jobs/job-card';
import { REGIONS, DISCIPLINES, ZHEJIANG_CITIES, JIANGSU_CITIES } from '@/lib/utils';

const regions = REGIONS;
const disciplines = DISCIPLINES;

function getCitiesForRegion(region: string): string[] {
  if (region === '浙江') return ZHEJIANG_CITIES;
  if (region === '江苏') return JIANGSU_CITIES;
  return [];
}

export default function HomePage() {
  const router = useRouter();
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (keyword) params.set('q', keyword);
    if (region) params.set('region', region);
    if (city) params.set('city', city);
    router.push(`/jobs?${params.toString()}`);
  };

  const handleRegionChange = (newRegion: string) => {
    setRegion(newRegion);
    setCity('');
  };

  const { jobs } = getJobs({ limit: 6, sort: 'newest' });

  const disciplinesWithCount = disciplines.map((d) => ({
    ...d,
    count: getJobCountByDiscipline(d.name),
  })).filter((d) => d.count > 0);

  return (
    <div className="space-y-12">
      {/* Hero */}
      <section className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-3xl sm:text-4xl lg:text-[48px] font-semibold leading-[1.15] tracking-tight text-text-primary">
            让交叉背景，<br />找到适合的位置。
          </h1>
          <p className="mt-4 text-base lg:text-lg text-text-secondary max-w-lg">
            面向人文、社会科学与理工科交叉人才，发现重点城市的科研与产业机会。
          </p>

          <form onSubmit={handleSearch} className="mt-8">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-text-secondary/50" />
                <input
                  type="text"
                  placeholder="搜索岗位、专业、技能或单位"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-surface text-text-primary text-[15px] placeholder:text-text-secondary/50 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand transition-all"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-brand text-white font-medium text-[15px] hover:bg-brand-dark transition-colors"
              >
                搜索
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {regions.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRegionChange(r === region ? '' : r)}
                  className={`px-3.5 py-2 rounded-lg text-sm border transition-all ${
                    region === r
                      ? 'bg-brand text-white border-brand'
                      : 'bg-surface border-border text-text-secondary hover:border-brand hover:text-brand'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {region && getCitiesForRegion(region).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {getCitiesForRegion(region).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCity(city === c ? '' : c)}
                    className={`px-3 py-1.5 rounded-md text-xs border transition-all ${
                      city === c
                        ? 'bg-secondary text-white border-secondary'
                        : 'bg-muted border-border text-text-secondary hover:border-secondary'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            )}
          </form>
        </div>

        {/* Right side: preview cards */}
        <div className="hidden lg:flex flex-col gap-4">
          {jobs.slice(0, 2).map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block">
              <div className="p-5 rounded-2xl border border-border bg-surface hover:shadow-md hover:border-brand/30 transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[17px] font-medium text-text-primary">{job.title}</h3>
                    <p className="mt-1.5 text-sm text-text-secondary">{job.organization}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg text-xs bg-brand/10 text-brand-dark font-medium">
                    {job.org_type}
                  </span>
                </div>
                <div className="mt-3 flex gap-3 text-sm text-text-secondary">
                  <span>{job.city}</span>
                  <span>·</span>
                  <span>{job.education}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Cross-Discipline Directions */}
      {disciplinesWithCount.length > 0 && (
        <section>
          <h2 className="text-[28px] font-semibold mb-6 text-text-primary">交叉方向</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {disciplinesWithCount.map((d) => (
              <Link
                key={d.id}
                href={`/jobs?discipline=${encodeURIComponent(d.name)}`}
                className="p-5 rounded-2xl border border-border bg-surface hover:border-brand/40 hover:shadow-md transition-all group"
              >
                <h3 className="text-[15px] font-medium text-text-primary group-hover:text-brand transition-colors">
                  {d.primary} × {d.secondary}
                </h3>
                <p className="mt-2 text-sm text-text-secondary leading-relaxed">
                  {d.roles.join('、')}
                </p>
                <div className="mt-3 text-xs text-text-secondary/70">
                  {d.keywords.join(' · ')}
                </div>
                <div className="mt-3 text-xs text-brand font-medium">
                  {d.count} 个岗位 →
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Jobs */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[28px] font-semibold text-text-primary">精选岗位</h2>
          <Link href="/jobs" className="text-sm text-brand hover:text-brand-dark transition-colors">
            查看全部 →
          </Link>
        </div>
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>

      {/* Source Explanation */}
      <section className="p-6 rounded-2xl border border-border bg-muted">
        <h3 className="text-lg font-medium text-text-primary mb-4">信息来源与核验</h3>
        <div className="grid sm:grid-cols-2 gap-6 text-sm text-text-secondary">
          <div>
            <p className="font-medium text-text-primary mb-2">来源优先级</p>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>招聘单位官方网站、官方招聘系统及正式招聘公告</li>
              <li>政府部门或公共就业服务机构发布的正式招聘信息</li>
              <li>其他招聘平台或第三方信息（明确标注来源类型）</li>
            </ol>
          </div>
          <div>
            <p className="font-medium text-text-primary mb-2">核验规则</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>每条岗位标注来源类型与原始链接</li>
              <li>区分"来源为单位官网"与"已核验"</li>
              <li>无截止日期且无法确认有效性的岗位显示"状态待核实"</li>
              <li>当前为演示数据，全站显著标注</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
