import type { Metadata } from 'next';
import { Atom, Bot, BookOpen, Building2, Dna, ExternalLink, FlaskConical, HeartPulse, MapPin } from 'lucide-react';
import { internshipListings, internshipTracks } from '@/data/internship-listings';

export const metadata: Metadata = {
  title: '交叉领域实习岗位 | 交点 Careers',
  description: '汇总 AI4S、医疗与生物学 AI、具身智能、科技伦理与仿真算法方向的研究院和企业实习岗位线索。',
};

const trackIcons = {
  ai4s: FlaskConical,
  medical: HeartPulse,
  bio: Dna,
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
          聚焦 AI 与具体学科、科研或真实世界任务结合的实习机会。这里包含算法研究、科学智能产品、机器人研发、科技伦理与治理岗位，适合不同专业背景寻找交叉切入点。
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

      <section className="rounded-2xl border border-brand/20 bg-brand/5 px-5 py-4 text-sm leading-6 text-text-secondary">
        <p className="font-medium text-text-primary">招聘状态提示</p>
        <p className="mt-1">
          以下线索来自招聘单位官网、高校就业平台与公开招聘平台，最近更新于 2026-10-14。职位可能关闭或调整，部分页面需登录；投递前请点开来源核对岗位状态、薪酬、地点和要求。页面摘要仅用于发现机会，不构成招聘承诺。
        </p>
      </section>

      {internshipTracks.map((track) => {
        const listings = internshipListings.filter((listing) => listing.track === track.id);
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

      <p className="rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-text-secondary">
        薪酬按来源页面展示；“面议”或未公开的待遇需向招聘方确认。实际待遇、实习时长、到岗要求及招聘进度均以招聘单位和来源页面为准。
      </p>
    </div>
  );
}
