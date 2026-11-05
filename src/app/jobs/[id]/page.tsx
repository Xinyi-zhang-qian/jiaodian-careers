import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ExternalLink, MapPin, Building2, Calendar, GraduationCap, ArrowLeft } from 'lucide-react';
import { getJob, getJobIds, deadlineBadgeLabel, hasConditionInfo, applicationWindow } from '@/lib/data';
import { getListingKind } from '@/lib/utils';
import FavoriteButton from '@/components/jobs/favorite-button';

function verificationLabel(level: string) {
  if (level === '逐字段核验') return '已核验（逐字段）';
  if (level === '来源核验') return '已核验（来源）';
  if (level === '关键字段核验') return '已核验（关键字段）';
  return level;
}

// 本地解析 YYYY-MM-DD 日期并格式化，避免 Date 直接按 UTC 解析字符串导致的日期偏移。
function formatDateYmd(value: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function generateStaticParams() {
  return getJobIds().map((id) => ({ id: String(id) }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(parseInt(id));
  return {
    title: job ? `${job.title} - ${job.organization} | 交点 Careers` : '岗位详情',
  };
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = getJob(parseInt(id));
  if (!job) notFound();
  const listingKind = getListingKind(job.title);
  const deadlineBadge = deadlineBadgeLabel(job);
  // 「报名已截止」用中性灰徽标（docs/design.md §4 契约 19），与红色「即将截止」、
  // 既有状态徽标（bg-text-secondary/10）在视觉上区分。
  const isExpiredBadge = deadlineBadge === '报名已截止';
  const deadlineBadgeClass = isExpiredBadge
    ? 'rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-text-secondary'
    : 'rounded-md bg-red-600 px-2 py-0.5 text-xs font-medium text-white';
  // 五个条件字段（原公告资格条件、学历、薪资、职责、报名方式）全空时在正文顶部显示统一提示条。
  const showConditionNotice = !hasConditionInfo(job);
  const appWindow = applicationWindow(job, listingKind);

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
            {listingKind !== '具体岗位' && (
              <div className="mb-3 inline-flex rounded-md bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent">{listingKind}</div>
            )}
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl lg:text-[32px] font-semibold text-text-primary">{job.title}</h1>
              {deadlineBadge && (
                <span className={deadlineBadgeClass}>{deadlineBadge}</span>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-text-secondary">
              <span className="flex items-center gap-1.5">
                <Building2 className="w-4 h-4" />
                {job.organization}
              </span>
              {(job.location || job.province || job.city) && <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {job.location || `${job.province} ${job.city}`}
              </span>}
              <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                job.status === '招聘中' ? 'bg-brand/10 text-brand-dark' :
                job.status === '已截止' ? 'bg-text-secondary/10 text-text-secondary' :
                'bg-yellow-100 text-yellow-700'
              }`}>
                {job.status === '状态待核实' ? '状态以原文为准' : job.status}
              </span>
            </div>
          </div>

          {/* 五个条件字段全空时的统一提示条（契约 19）：正文顶部唯一兜底文案 */}
          {showConditionNotice && (
            <section className="rounded-2xl border border-border bg-muted p-4 text-sm leading-6 text-text-secondary">
              条件信息请见来源公告
            </section>
          )}

          {listingKind !== '具体岗位' && (
            <section className="rounded-2xl border border-accent/20 bg-accent/5 p-4 text-sm leading-6 text-text-secondary">
              本条是{listingKind}级线索，不代表一个单独职位。具体岗位名称、名额和申请条件请以来源页的职位表或投递系统为准。
            </section>
          )}

          {/* 核验层级提示条按记录性质成组置于条件区块之前（docs/interaction.md §3 色彩协议） */}
          {job.verification_level === '逐字段核验' && (
            <section className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
              本条已按来源全文逐字段核验，标注为“原公告”的内容来自源页；平台标签仅用于检索和归类，不代表招聘单位原文。
            </section>
          )}
          {job.verification_level === '来源核验' && <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm leading-6 text-sky-900">本条已核对来源页面中的岗位名称与单位，标注为“已核验（来源）”；薪资、学历、专业、职责和招聘状态请以原公告为准。</section>}
          {job.verification_level === '关键字段核验' && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">本条已公开岗位名称、单位、地区和来源链接等关键字段，标注为“已核验（关键字段）”；薪资、学历、专业、职责和当前招聘状态未在本站作完整转述，请以原公告为准。</section>}
          {job.verification_level === '待核实' && <section className="rounded-2xl border border-yellow-200 bg-yellow-50 p-4 text-sm leading-6 text-yellow-900">历史招聘线索，尚未核对来源页面。岗位名称、单位及链接也可能有误；本页不展示未经核实的条件信息，请打开来源自行确认。</section>}

          {/* 条件信息分区：原公告资格条件 → 原公告岗位职责 → 技能与方向标签 → 报名窗口 → 原页核验锚点 → 本站说明 */}
          {job.verification_level === '逐字段核验' && <section className="p-5 rounded-2xl border border-brand/20 bg-brand/5">
            <h2 className="text-lg font-semibold text-brand-dark mb-3">原公告资格条件</h2>
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium text-text-primary">原公告原文</p>
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
          </section>}

          {job.responsibilities && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">原公告岗位职责（按原文列项）</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.responsibilities}</p>
            </section>
          )}

          {/* 方向、技能与优先条件合并为一个分区，子组标题区分来源与性质 */}
          {(job.platform_disciplines.length > 0 || job.required_skills.length > 0 || job.preferred_skills.length > 0) && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">技能与方向标签</h2>
              <div className="space-y-3">
                {job.platform_disciplines.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-text-secondary/70">方向标签（平台归类，非公告原文）</p>
                    <div className="flex flex-wrap gap-2">
                      {job.platform_disciplines.map((d) => (
                        <span key={d} className="px-3 py-1.5 rounded-lg text-sm bg-brand/10 text-brand-dark font-medium">{d}</span>
                      ))}
                    </div>
                  </div>
                )}
                {job.required_skills.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-text-secondary/70">技能标签</p>
                    <div className="flex flex-wrap gap-2">
                      {job.required_skills.map((s) => (
                        <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-secondary/10 text-secondary font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {job.preferred_skills.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-text-secondary/70">优先条件</p>
                    <div className="flex flex-wrap gap-2">
                      {job.preferred_skills.map((s) => (
                        <span key={s} className="px-3 py-1.5 rounded-lg text-sm bg-accent/10 text-accent font-medium">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {appWindow.visible && (
            <section className="p-5 rounded-2xl border border-accent/20 bg-accent/5">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <h2 className="text-lg font-semibold text-accent">报名窗口</h2>
                {appWindow.publicRecruitNotice && (
                  <span className="rounded-md bg-accent px-2 py-0.5 text-xs font-medium text-white">事业单位公开招聘</span>
                )}
              </div>
              <div className="space-y-3 text-sm">
                {job.application_opens_at && (
                  <div>
                    <p className="font-medium text-text-primary">报名开始</p>
                    <p className="mt-0.5 text-text-secondary">{formatDateYmd(job.application_opens_at)}</p>
                  </div>
                )}
                {job.deadline && (
                  <div>
                    <p className="font-medium text-text-primary">报名截止</p>
                    <p className="mt-0.5 text-text-secondary">{formatDateYmd(job.deadline)}</p>
                  </div>
                )}
                {job.application_info && (
                  <div>
                    <p className="font-medium text-text-primary">报名方式</p>
                    <p className="mt-1 text-text-secondary leading-relaxed whitespace-pre-wrap">{job.application_info}</p>
                  </div>
                )}
                {!job.application_opens_at && !job.deadline && !job.application_info && (
                  <p className="text-text-secondary">报名安排详见来源公告。</p>
                )}
              </div>
            </section>
          )}

          {job.source_evidence && job.source_evidence.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">原页核验锚点</h2>
              <p className="mb-3 text-xs leading-5 text-text-secondary">以下是校验脚本必须能在来源页找到的原文片段；任一片段缺失，构建将失败。</p>
              <ul className="space-y-2 text-sm leading-6 text-text-secondary">
                {job.source_evidence.map((evidence) => (
                  <li key={evidence} className="rounded-xl border border-border bg-muted px-4 py-3">“{evidence}”</li>
                ))}
              </ul>
            </section>
          )}

          {job.description && (
            <section>
              <h2 className="text-lg font-semibold text-text-primary mb-3">本站说明（非公告原文）</h2>
              <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{job.description}</p>
            </section>
          )}

          <section className="pt-4 border-t border-border">
            <h2 className="text-sm font-medium text-text-secondary mb-2">信息来源与核验</h2>
            <div className="text-sm text-text-secondary space-y-1">
              <p>来源：{job.source_name}（{job.source_type}）</p>
              {job.verification_level !== '待核实' && <><p>获取时间：{new Date(job.fetched_at).toLocaleDateString('zh-CN')}</p><p>最后核验：{new Date(job.last_verified).toLocaleDateString('zh-CN')}</p></>}
              {job.source_title && <p>来源页标题：{job.source_title}</p>}
              {job.verification_level && <p>核验：{verificationLabel(job.verification_level)}</p>}
              <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-2 text-brand hover:text-brand-dark transition-colors">
                前往来源页面 <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </section>
        </div>

        {/* Right: Summary Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-8 p-5 rounded-2xl border border-border bg-surface space-y-5">
            <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand text-white font-medium hover:bg-brand-dark transition-colors">
              前往来源页面 <ExternalLink className="w-4 h-4" />
            </a>

            <FavoriteButton jobId={job.id} />

            <div className="space-y-3 text-sm">
              {job.education && <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="学历" value={job.education} />}
              {(job.city || job.province) && <InfoRow icon={<MapPin className="w-4 h-4" />} label="地点" value={job.city || job.province} />}
              {job.verification_level === '逐字段核验' && <InfoRow icon={<Building2 className="w-4 h-4" />} label="类型" value={job.org_type} />}
              {job.published_at && <InfoRow icon={<Calendar className="w-4 h-4" />} label="发布" value={new Date(job.published_at).toLocaleDateString('zh-CN')} />}
              {job.deadline && <InfoRow icon={<Calendar className="w-4 h-4" />} label="截止" value={new Date(job.deadline).toLocaleDateString('zh-CN')} />}
              {job.salary && <InfoRow label="薪资" value={job.salary} highlight />}
            </div>

            {job.verification_level === '逐字段核验' && <div className="pt-4 border-t border-border">
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
            </div>}

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
