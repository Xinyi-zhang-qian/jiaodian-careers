'use client';

import { useState, useEffect } from 'react';
import { getJob } from '@/lib/data';
import JobCard from '@/components/jobs/job-card';
import { useFavorites } from '@/lib/use-favorites';

export default function FavoritesPage() {
  const { favorites } = useFavorites();
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    const favoriteJobs = favorites.map((id) => getJob(id)).filter(Boolean);
    setJobs(favoriteJobs);
  }, [favorites]);

  return (
    <div>
      <h1 className="text-[28px] font-semibold mb-6">收藏</h1>

      {jobs.length === 0 ? (
        <div className="py-16 text-center text-text-secondary">
          <p className="text-lg">还没有收藏任何岗位</p>
          <p className="mt-2 text-sm">浏览岗位列表，点击 ♥ 收藏感兴趣的岗位</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </div>
  );
}
