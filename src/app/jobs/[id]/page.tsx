import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, MapPin, Building2, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
import { getJob } from '@/lib/data';

export function generateMetadata({ params }: { params: { id: string } }) {
  const job = getJob(parseInt(params.id));
  return {
    title: job ? `${job.title} - ${job.organization} | 交点 Careers` : '岗位详情',
  };
}

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const { id } = await params;
  const job = getJob(parseInt(id));
  if (!job) notFound();

  return (
    <div>
      <Link href="/jobs" className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-brand transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        返回岗位列表
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl lg:text-[32px] font-semibold text-text-primary">{job.title}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {job.organization}
              </span>
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location || `${job.province} ${job.city}`}
              </span>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                job.status === '招聘中' ? 'bg-brand/10 text-brand-dark' :
                job.status === '已截止' ? 'bg-text-secondary/10 text-text-secondary' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {job.status}
              </span>
            </div>
          </div>

          <section className="p-5 rounded-2xl border border-brand/20 bg-brand/5">
            <h2 className="text-lg font-semibold text-brand-dark mb-3">专业与学历要求</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">原公告专业要求</p>
                <p className="mt-1 text-text-secondary leading-relaxed">{job.original_major_requirements}</p>
              </div>
              <div>
                <p className="font-medium text-text-primary">学历要求</p>
                <p className="mt-1 text-text-secondary">{job.education}</p>
              </div>
              {job.experience && job.experience !== '不限' && (
                <div>
                  <p className="font-medium text-text-primary">经验要求</p>
                  <p className="mt-1 text-text-secondary">{job.experience}</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">平台归纳交叉方向</h2>
            <div className="flex flex-wrap gap-2">
              {job.platform_disciplines.map((d) => (
                <span key={d} className="px-3 py-1.5 rounded-lg text-sm bg-brand/10 text-brand-dark font-medium">{d}</span>
              ))}
            </div>
          </section>

          {job.responsibilities && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">岗位职责</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-text-primary mb-3">必备能力</h2>
            <div className="flex flex-wrap gap-2">
              {job.required_skills.map((s) => (
                <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-secondary/10 text-secondary font-medium">{s}</span>
              ))}
            </div>
          </section>

          {job.preferred_skills.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">优先条件</h2>
              <div className="flex flex-wrap gap-2">
                {job.preferred_skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-accent/10 text-accent font-medium">{s}</span>
                ))}
              </div>
            </section>
          )}

          {job.description && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">岗位描述</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </section>
          )}

          {job.application_info && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">申请方式与材料</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.application_info}</p>
            </section>
          )}

          {job.deadline && (
            <section className="p-5 rounded-2xl border border-accent/20 bg-accent/5">
              <h2 className="text-lg font-semibold text-accent mb-2">截止日期</h2>
              <p className="text-[18px] font-medium text-text-primary">
                {new Date(job.deadline).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </section>
          )}

          <section className="pt-4 border-t border-border">
            <h2 className="text-sm font-medium text-text-secondary mb-2">信息来源与核验</h2>
            <div className="text-sm text-text-secondary space-y-1">
              <p>来源：{job.source_name}（{job.source_type}）</p>
              <p>获取时间：{new Date(job.fetched_at).toLocaleDateString('zh-CN')}</p>
              <p>最后核验：{new Date(job.last_verified).toLocaleDateString('zh-CN')}</p>
              <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-brand hover:text-brand-dark transition-colors">
                前往官方招聘页面 <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 p-5 rounded-2xl border border-border bg-surface space-y-5">
            <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors">
              前往官方招聘页面 <ExternalLink className="w-4 h-4" />
            </a>

            <div className="space-y-3 text-sm">
              <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="学历" value={job.education} />
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="地点" value={job.city || job.province} />
              <InfoRow icon={<Building2 className="w-4 h-4" />} label="类型" value={job.org_type} />
              <InfoRow icon={<Calendar className="w-4 h-4" />} label="发布" value={new Date(job.published_at).toLocaleDateString('zh-CN')} />
              {job.deadline && <InfoRow icon={<Calendar className="w-4 h-4" />} label="截止" value={new Date(job.deadline).toLocaleDateString('zh-CN')} />}
              {job.salary && <InfoRow label="薪资" value={job.salary} highlight />}
            </div>

            <div className="pt-4 border-t border-border">
              <h3 className="text-sm font-medium text-text-primary mb-2">为什么与你的背景相关</h3>
              <div className="text-xs text-text-secondary leading-relaxed space-y-1">
                {job.original_major_requirements.includes('哲学') && <p>• 公告明确要求哲学或相关人文社科背景</p>}
                {job.required_skills.some((s) => ['Python', '数据分析', '机器学习', '统计'].some((k) => s.includes(k))) && (
                  <p>• 同时要求数据分析或编程能力，适合具有技术交叉背景的申请者</p>
                )}
                {job.platform_disciplines.some((d) => d.includes('×')) && (
                  <p>• 该岗位属于{job.platform_disciplines[0]}交叉方向</p>
                )}
                <p className="text-text-secondary/60 mt-2">注：相关性仅基于公告内容与已选学科，不构成录用资格保证</p>
              </div>
            </div>

            {job.is_demo && (
              <div className="pt-3 border-t border-border text-xs text-demo font-medium text-center">※ 本条为演示数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, highlight }: { icon?: React.ReactNode; label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      {icon && <span className="mt-0.5 text-text-secondary/60">{icon}</span>}
      <div>
        <span className="text-text-secondary/70">{label}：</span>
        <span className={highlight ? 'text-brand-dark font-medium' : 'text-text-primary'}>{value}</span>
      </div>
    </div>
  );
}
