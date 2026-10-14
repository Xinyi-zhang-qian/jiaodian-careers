import Link from 'next/link';
import { ExternalLink, Heart, MapPin, Building2, Calendar, Building } from 'lucide-react';
import { Job } from '@/lib/types';
import { useFavorites } from '@/lib/use-favorites';
import { getListingKind } from '@/lib/utils';

export default function JobCard({ job }: { job: Job }) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(job.id);
  const listingKind = getListingKind(job.title);

  return (
    <article className="p-5 rounded-2xl border border-border bg-surface hover:shadow-lg hover:border-brand/30 transition-all group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {listingKind !== '具体岗位' && (
              <span className="rounded-md bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">{listingKind}</span>
            )}
            {job.verification_level && (
              <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">{job.verification_level}</span>
            )}
            <Link href={`/jobs/${job.id}`} className="text-lg font-medium text-text-primary hover:text-brand transition-colors">
              {job.title}
            </Link>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            {job.verification_level !== '来源核验' && <span className="flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              {job.organization}
            </span>}
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {job.city || job.province || '地点见来源'}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-3.5 h-3.5" />
              {job.org_type}
            </span>
          </div>
        </div>

        <button
          onClick={() => toggleFavorite(job.id)}
          className={`p-2 rounded-lg transition-colors ${
            favorited ? 'text-accent bg-accent/10' : 'text-text-secondary/50 hover:text-accent hover:bg-accent/5'
          }`}
          aria-label={favorited ? '取消收藏' : '收藏'}
        >
          <Heart className="w-5 h-5" fill={favorited ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Professional Requirements */}
      {!!(job.original_major_requirements || job.platform_disciplines.length || job.required_skills.length) && <div className="mt-4 p-3 rounded-xl bg-brand/5 border border-brand/20">
        <p className="text-sm text-text-primary">
          {job.original_major_requirements && <span className="font-medium text-brand-dark">原公告资格条件：</span>}
          {job.original_major_requirements}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {job.platform_disciplines.map((d) => (
            <span key={d} className="px-2 py-0.5 rounded text-xs bg-brand/10 text-brand-dark font-medium">
              {d}
            </span>
          ))}
          {job.required_skills.slice(0, 3).map((s) => (
            <span key={s} className="px-2 py-0.5 rounded text-xs bg-secondary/10 text-secondary font-medium">
              {s}
            </span>
          ))}
        </div>
      </div>}

      {/* Footer info */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex flex-wrap gap-4 text-text-secondary">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {job.education || '条件见来源'}
            {job.experience && job.experience !== '不限' && ` · ${job.experience}`}
          </span>
          {job.salary && (
            <span className="text-brand-dark font-medium">{job.salary}</span>
          )}
          {!job.salary && <span className="text-text-secondary/60">薪资未公开</span>}
          {job.recruit_type && (
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
              job.recruit_type === '校招' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
            }`}>
              {job.recruit_type}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-text-secondary">
          {job.published_at && <span>发布 {new Date(job.published_at).toLocaleDateString('zh-CN')}</span>}
          {job.deadline && (
            <span className="text-accent">截止 {new Date(job.deadline).toLocaleDateString('zh-CN')}</span>
          )}
          {job.status === '已截止' && (
            <span className="px-2 py-0.5 rounded bg-text-secondary/10 text-text-secondary">已截止</span>
          )}
          {job.status === '状态待核实' && (
            <span className="px-2 py-0.5 rounded bg-yellow-100 text-yellow-700">状态待核实</span>
          )}
          <a
            href={job.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 text-brand hover:text-brand-dark transition-colors"
          >
            查看原文 <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {job.is_demo && (
        <div className="mt-3 text-xs text-demo font-medium">※ 演示数据</div>
      )}
    </article>
  );
}
