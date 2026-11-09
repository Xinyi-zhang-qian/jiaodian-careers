'use client';

// 推荐列表（match 模块，第 3 轮）：MatchResult[] → JobCard + 逐条匹配理由标签。
import JobCard from '@/components/jobs/job-card';
import type { MatchResult } from '@/lib/match';

export default function RecommendList({ results }: { results: MatchResult[] }) {
  if (results.length === 0) {
    return (
      <div className="py-16 text-center text-text-secondary">
        <p className="text-lg">暂无高度匹配的岗位</p>
        <p className="mt-2 text-sm">尝试调整画像条目（换用更具体的专业名、技能名或岗位名称）后再看推荐。</p>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {results.map(({ job, score, reasons }) => (
        <div key={job.id} className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded-md bg-brand text-white font-medium">匹配度 {score}</span>
            {reasons.map((reason) => (
              <span key={reason} className="px-2 py-0.5 rounded-md bg-brand/10 text-brand-dark">{reason}</span>
            ))}
          </div>
          <JobCard job={job} />
        </div>
      ))}
    </div>
  );
}
