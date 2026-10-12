import Link from 'next/link';
import { getJobCountByDiscipline } from '@/lib/data';
import { DISCIPLINES } from '@/lib/utils';

export default function DirectionsPage() {
  const disciplinesWithCount = DISCIPLINES.map((d) => ({
    ...d,
    count: getJobCountByDiscipline(d.name),
  }));

  return (
    <div>
      <h1 className="text-[28px] font-semibold mb-2">交叉方向</h1>
      <p className="text-text-secondary mb-8">探索不同学科组合对应的岗位方向与能力要求</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {disciplinesWithCount.map((d) => (
          <Link
            key={d.id}
            href={`/jobs?discipline=${encodeURIComponent(d.name)}`}
            className="p-6 rounded-2xl border border-border bg-surface hover:border-brand/40 hover:shadow-md transition-all group"
          >
            <h3 className="text-[17px] font-medium text-text-primary group-hover:text-brand transition-colors">
              {d.primary} × {d.secondary}
            </h3>
            <p className="mt-3 text-sm text-text-secondary leading-relaxed">
              典型岗位：{d.roles.join('、')}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {d.keywords.map((k) => (
                <span key={k} className="px-2 py-0.5 rounded text-xs bg-muted text-text-secondary">{k}</span>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-text-secondary">
                {d.count > 0 ? `${d.count} 个相关岗位` : '暂无岗位'}
              </span>
              {d.count > 0 && <span className="text-sm text-brand font-medium">查看岗位 →</span>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
