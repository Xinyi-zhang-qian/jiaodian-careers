import type { Metadata } from 'next';
import { Atom, Bot, BookOpen, Building2, Dna, ExternalLink, FlaskConical, HeartPulse, MapPin, Newspaper } from 'lucide-react';
import { internshipListings, internshipTracks } from '@/data/internship-listings';

export const metadata: Metadata = {
  title: '交叉领域实习岗位 | 交点 Careers',
  description: '汇总 AI4S、医疗与生物学 AI、人文科技内容与数据、具身智能、科技伦理与仿真算法方向的实习线索。',
};

const trackIcons = {
  ai4s: FlaskConical,
  medical: HeartPulse,
  bio: Dna,
  humanities_tech: Newspaper,
  embodied: Bot,
  philosophy_ethics: BookOpen,
  simulation: Atom,
};

export default function InternshipsPage() {
  return (
    <div className="space-y-10">
      <section>
        <p className="text-sm font-medium text-brand">研究院 · 高校课题组 · 科技企业 · 公益机构</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">交叉领域实习岗位</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          聚焦 AI 与具体学科、科研或真实世界任务结合的实习机会。这里包含数据分析、科技文案、学术编辑、算法研究、机器人研发和科技伦理与治理岗位，适合不同专业背景寻找交叉切入点。
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-5 text-sm leading-6 text-amber-900">
        <p className="font-medium text-amber-950">实习岗位正在逐条回源复核</p>
        <p className="mt-1">
          原有线索因未保存足够的逐字段证据已全部下架。后续只会展示能从原页核对岗位名称、单位、条件、地点与申请方式的记录；本站分析标签将与原公告内容分开标注。
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {internshipTracks.map((track) => {
          const Icon = trackIcons[track.id];
          const count = internshipListings.filter((listing) => listing.track === track.id).length;
          return (
            <a key={track.id} href={`#${track.id}`} className="rounded-2xl border border-border bg-surface p-4 transition-colors hover:border-brand/40">
              <div className="flex items-center justify-between">
                <Icon className="h-5 w-5 text-brand" />
                <span className="text-xs text-text-secondary">{count} 条线索</span>
              </div>
              <h2 className="mt-3 font-semibold text-text-primary">{track.title}</h2>
              <p className="mt-1 text-sm leading-5 text-text-secondary">{track.description}</p>
            </a>
          );
        })}
      </section>

      {internshipTracks.map((track) => {
        const listings = internshipListings.filter((listing) => listing.track === track.id);
        if (listings.length === 0) return null;
        return (
          <section key={track.id} id={track.id} className="scroll-mt-6">
            <div className="mb-5">
              <h2 className="text-2xl font-semibold text-text-primary">{track.title}</h2>
              <p className="mt-1 text-sm text-text-secondary">{track.description}</p>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {listings.map((listing) => (
                <article key={listing.id} className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">{listing.organizationType}</span>
                    <span className="text-xs text-text-secondary">{listing.sourceName ?? 'BOSS 直聘'} · 状态需回源核实</span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-text-primary">{listing.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-text-secondary">
                    <Building2 className="h-4 w-4 shrink-0" />{listing.organization}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2.5 py-1.5 text-text-primary"><MapPin className="h-3.5 w-3.5" />{listing.location}</span>
                    <span className="rounded-md bg-muted px-2.5 py-1.5 text-text-primary">{listing.pay}</span>
                    <span className="rounded-md bg-muted px-2.5 py-1.5 text-text-primary">{listing.education}</span>
                    {listing.cohort && <span className="rounded-md bg-muted px-2.5 py-1.5 text-text-primary">{listing.cohort}</span>}
                  </div>
                  <p className="mt-4 text-sm leading-6 text-text-secondary">{listing.summary}</p>
                  <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
                    查看来源页面 <ExternalLink className="h-4 w-4" />
                  </a>
                </article>
              ))}
            </div>
          </section>
        );
      })}

    </div>
  );
}
