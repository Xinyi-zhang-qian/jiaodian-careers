'use client';

import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { roboticsDirectionDefinitions, type RoboticsMarketJob } from '@/lib/robotics-market';

interface RoboticsJobTableProps {
  jobs: RoboticsMarketJob[];
}

export default function RoboticsJobTable({ jobs }: RoboticsJobTableProps) {
  const [query, setQuery] = useState('');
  const [direction, setDirection] = useState('all');
  const [recruitmentType, setRecruitmentType] = useState('all');

  const directionNames = Object.fromEntries(roboticsDirectionDefinitions.map((item) => [item.id, item.name]));
  const filteredJobs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return jobs.filter((job) => {
      const matchesQuery = !normalizedQuery || [
        job.title,
        job.organization,
        job.city,
        job.requirements,
        job.skills.join(' '),
      ].join(' ').toLowerCase().includes(normalizedQuery);
      const matchesDirection = direction === 'all' || job.direction === direction;
      const matchesType = recruitmentType === 'all' || job.recruitmentType === recruitmentType;
      return matchesQuery && matchesDirection && matchesType;
    });
  }, [direction, jobs, query, recruitmentType]);

  return (
    <div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px_160px]">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-text-secondary" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="搜索岗位、公司、城市或技能"
            aria-label="搜索机器人岗位"
            className="h-10 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm outline-none transition-colors focus:border-brand"
          />
        </label>
        <select
          value={direction}
          onChange={(event) => setDirection(event.target.value)}
          aria-label="按机器人技术方向筛选"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        >
          <option value="all">全部技术方向</option>
          {roboticsDirectionDefinitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select
          value={recruitmentType}
          onChange={(event) => setRecruitmentType(event.target.value)}
          aria-label="按招聘类型筛选"
          className="h-10 rounded-lg border border-border bg-surface px-3 text-sm outline-none focus:border-brand"
        >
          <option value="all">全部招聘类型</option>
          <option value="校招">校招</option>
          <option value="社招">社招</option>
          <option value="博士后">博士后</option>
        </select>
      </div>

      <p className="mt-3 text-xs text-text-secondary">显示 {filteredJobs.length} / {jobs.length} 条样本</p>

      <div className="mt-4 overflow-x-auto rounded-xl border border-border">
        <table className="min-w-[1120px] w-full border-collapse text-left text-sm">
          <thead className="bg-muted text-xs text-text-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">岗位与单位</th>
              <th className="px-4 py-3 font-medium">城市 / 类型</th>
              <th className="px-4 py-3 font-medium">主要方向</th>
              <th className="px-4 py-3 font-medium">薪资</th>
              <th className="px-4 py-3 font-medium">学历 / 经验</th>
              <th className="px-4 py-3 font-medium">岗位需求摘要</th>
              <th className="px-4 py-3 font-medium">来源</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filteredJobs.map((job) => (
              <tr key={job.id} className="align-top hover:bg-muted/60">
                <td className="max-w-[230px] px-4 py-4">
                  <p className="font-medium text-text-primary">{job.title}</p>
                  <p className="mt-1 text-xs text-text-secondary">{job.organization}</p>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-text-secondary">
                  <p>{job.city}</p>
                  <p className="mt-1 text-xs">{job.recruitmentType}</p>
                </td>
                <td className="max-w-[150px] px-4 py-4 text-text-secondary">{directionNames[job.direction]}</td>
                <td className="whitespace-nowrap px-4 py-4 font-medium text-text-primary">{job.salary}</td>
                <td className="max-w-[170px] px-4 py-4 text-text-secondary">
                  <p>{job.education}</p>
                  <p className="mt-1 text-xs">{job.experience}</p>
                </td>
                <td className="max-w-[330px] px-4 py-4 leading-6 text-text-secondary">
                  <p>{job.requirements}</p>
                  <p className="mt-2 text-xs text-brand-dark">{job.skills.slice(0, 4).join(' · ')}</p>
                </td>
                <td className="max-w-[150px] px-4 py-4">
                  <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-brand hover:text-brand-dark">
                    {job.sourceName} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                  <p className="mt-1 text-xs text-text-secondary">{job.sourceType}</p>
                  <p className="mt-1 text-xs text-text-secondary">{job.sourceStatus} · {job.verifiedAt}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredJobs.length === 0 && (
        <p className="rounded-b-xl border border-t-0 border-border bg-surface px-4 py-8 text-center text-sm text-text-secondary">没有符合当前条件的岗位。</p>
      )}
    </div>
  );
}
