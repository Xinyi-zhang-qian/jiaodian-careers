import type { Metadata } from 'next';
import { BarChart3, ExternalLink, Info, TrendingUp } from 'lucide-react';
import { marketReport, platformChannels, platformListings, roboticsDemandAnalysis } from '@/data/platform-sources';

export const metadata: Metadata = {
  title: '招聘市场观察 | 交点 Careers',
  description: '汇总招聘平台公开岗位线索、机器人方向需求样本与人工智能人才趋势，附原始来源链接。',
};

const directionColors: Record<string, string> = {
  simulation: '#0f766e',
  'planning-control': '#2563eb',
  'system-hardware': '#7c3aed',
  vla: '#db2777',
  perception: '#d97706',
  'data-evaluation': '#64748b',
};

export default function MarketPage() {
  const simulationDemand = roboticsDemandAnalysis.directions.find((direction) => direction.id === 'simulation');
  const vlaDemand = roboticsDemandAnalysis.directions.find((direction) => direction.id === 'vla');
  const simulationToVlaRatio = simulationDemand && vlaDemand && vlaDemand.count > 0
    ? (simulationDemand.count / vlaDemand.count).toFixed(1)
    : '—';

  return (
    <div className="space-y-12">
      <section>
        <div className="flex items-center gap-2 text-sm font-medium text-brand">
          <TrendingUp className="h-4 w-4" />
          <span>平台公开信息 · 更新于 2026 年 10 月 14 日</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">招聘市场观察</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          把招聘平台上的岗位线索与人才市场报告放在一起看，帮助交叉背景的求职者发现 AI 产品、行业应用、科技传播等具体入口。
        </p>
      </section>

      <section className="rounded-2xl border border-brand/20 bg-brand/5 p-6 sm:p-8">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-dark">人才需求数据</p>
            <h2 className="mt-1 text-xl font-semibold text-text-primary">{marketReport.title}</h2>
          </div>
          <p className="text-sm text-text-secondary">{marketReport.publisher} · {marketReport.publishedAt}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {marketReport.metrics.map((metric) => (
            <div key={metric.label} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-2xl font-semibold text-brand-dark">{metric.value}</p>
              <p className="mt-2 text-sm font-medium text-text-primary">{metric.label}</p>
              <p className="mt-1 text-xs text-text-secondary">{metric.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-4 text-sm leading-6 text-text-secondary md:grid-cols-2">
          <p>报告还显示，数据标注 / AI 训练师职位数同比增长 30.3%。岗位需求不只出现在算法研发，也出现在产品设计、内容、销售和行业落地环节。</p>
          <p>报告列出的应用行业包括制造、汽车、医药和航空航天等。对跨专业求职者来说，行业知识、用户研究、数据分析和与技术团队协作的能力可以成为进入这些团队的切入点。</p>
        </div>
        <a href={marketReport.url} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
          查看报告报道 <ExternalLink className="h-4 w-4" />
        </a>
        <p className="mt-3 text-xs leading-5 text-text-secondary/70">
          数据口径为智联招聘平台 2026 年上半年发布的职位与企业数据同比变化，不代表全行业的唯一统计口径。上面的行业机会解读是基于报告与岗位样例的归纳。
        </p>
      </section>

      <section className="overflow-hidden rounded-2xl border border-border bg-surface">
        <div className="border-b border-border bg-gradient-to-br from-teal-50 via-surface to-blue-50 p-6 sm:p-8">
          <div className="flex items-center gap-2 text-sm font-medium text-brand-dark">
            <BarChart3 className="h-4 w-4" />
            <span>方向需求可视化</span>
          </div>
          <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">{roboticsDemandAnalysis.title}</h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
                把同一赛道的职位按主要工作对象重新分组，用来判断仿真、VLA、规划控制等方向在当前公开样本中的相对数量。
              </p>
            </div>
            <p className="shrink-0 text-xs text-text-secondary">样本日期：{roboticsDemandAnalysis.capturedAt}</p>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-semibold text-text-primary">{roboticsDemandAnalysis.sampleSize}</p>
              <p className="mt-1 text-sm text-text-secondary">去重岗位快照</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-semibold text-[#0f766e]">{simulationDemand?.count ?? 0} 条 · {simulationDemand?.share ?? 0}%</p>
              <p className="mt-1 text-sm text-text-secondary">仿真与合成数据</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-semibold text-[#db2777]">{vlaDemand?.count ?? 0} 条 · {vlaDemand?.share ?? 0}%</p>
              <p className="mt-1 text-sm text-text-secondary">VLA / 具身大模型</p>
            </div>
            <div className="rounded-xl border border-white/70 bg-white/80 p-4">
              <p className="text-2xl font-semibold text-brand-dark">{simulationToVlaRatio}×</p>
              <p className="mt-1 text-sm text-text-secondary">仿真样本数 / VLA 样本数</p>
            </div>
          </div>
        </div>

        <div className="grid gap-8 p-6 sm:p-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)]">
          <div>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h3 className="font-semibold text-text-primary">岗位方向样本占比</h3>
                <p className="mt-1 text-xs text-text-secondary">条形长度为该方向占 {roboticsDemandAnalysis.sampleSize} 条样本的比例</p>
              </div>
              <span className="text-xs text-text-secondary">单位：岗位快照</span>
            </div>

            <div className="mt-6 space-y-5">
              {roboticsDemandAnalysis.directions.map((direction) => (
                <div key={direction.id}>
                  <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                    <span className="font-medium text-text-primary">{direction.name}</span>
                    <span className="shrink-0 tabular-nums text-text-secondary">{direction.count} 条 · {direction.share}%</span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${direction.share}%`, backgroundColor: directionColors[direction.id] }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs leading-5 text-text-secondary">{direction.examples}</p>
                </div>
              ))}
            </div>

            <div className="mt-7">
              <p className="mb-2 text-xs font-medium text-text-secondary">全部样本的结构</p>
              <div className="flex h-5 overflow-hidden rounded-full bg-muted" aria-label="机器人岗位方向样本结构">
                {roboticsDemandAnalysis.directions.map((direction) => (
                  <div
                    key={direction.id}
                    title={`${direction.name}：${direction.share}%`}
                    style={{ width: `${(direction.count / roboticsDemandAnalysis.sampleSize) * 100}%`, backgroundColor: directionColors[direction.id] }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
                {roboticsDemandAnalysis.directions.map((direction) => (
                  <span key={direction.id} className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: directionColors[direction.id] }} />
                    {direction.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-xl border border-brand/20 bg-brand/5 p-5">
              <p className="text-sm font-semibold text-brand-dark">这次样本说明了什么？</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{roboticsDemandAnalysis.conclusion}</p>
              <p className="mt-3 text-xs leading-5 text-text-secondary/80">
                扩样后的持平不代表两类岗位在全市场中数量相同。VLA、仿真、数据与控制常被写在同一职位里，而本页每条只归入一个主要方向；不同检索词也会改变样本结构。
              </p>
            </div>

            <div className="rounded-xl border border-border p-5">
              <h3 className="text-sm font-semibold text-text-primary">样本与口径</h3>
              <p className="mt-2 text-xs leading-5 text-text-secondary">{roboticsDemandAnalysis.scope}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {roboticsDemandAnalysis.platforms.map((platform) => (
                  <span key={platform.name} className="rounded-md bg-muted px-2.5 py-1.5 text-xs text-text-primary">
                    {platform.name} {platform.count} 条
                  </span>
                ))}
              </div>
              <ul className="mt-4 space-y-2 text-xs leading-5 text-text-secondary">
                {roboticsDemandAnalysis.methodology.map((item) => <li key={item}>• {item}</li>)}
              </ul>
            </div>
          </aside>
        </div>

        <div className="border-t border-border bg-muted/50 px-6 py-5 sm:px-8">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" />
            <div>
              <p className="text-xs leading-5 text-text-secondary">
                这是定向抽取的岗位快照，不是平台全量数据，因此应读作“样本占比”，不应视为全市场份额。招聘页面会随时更新或下架。
              </p>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                {roboticsDemandAnalysis.sources.map((source) => (
                  <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer" title={source.note} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:text-brand-dark">
                    {source.name} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-text-primary">招聘平台岗位线索</h2>
            <p className="mt-1 text-sm text-text-secondary">以下是平台公开页面检索到的岗位快照，薪资与要求按原页面展示。</p>
          </div>
          <span className="text-xs text-text-secondary">快照日期：2026-10-13</span>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {platformListings.map((listing) => (
            <article key={`${listing.platform}-${listing.title}-${listing.organization}`} className="rounded-2xl border border-border bg-surface p-5 transition-shadow hover:shadow-md sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg bg-secondary/10 px-2.5 py-1 text-xs font-medium text-secondary">{listing.platform}</span>
                <span className="text-xs text-text-secondary">平台页面线索 · 状态需回源核实</span>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-text-primary">{listing.title}</h3>
              <p className="mt-1 text-sm text-text-secondary">{listing.organization} · {listing.location}</p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs">
                <span className="rounded-md bg-muted px-2.5 py-1.5 text-text-primary">{listing.salary}</span>
                <span className="rounded-md bg-muted px-2.5 py-1.5 text-text-primary">{listing.requirements}</span>
              </div>
              <p className="mt-4 text-sm font-medium text-brand-dark">{listing.connection}</p>
              <p className="mt-2 text-sm leading-6 text-text-secondary">{listing.summary}</p>
              <a href={listing.sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
                前往平台原页面 <ExternalLink className="h-4 w-4" />
              </a>
            </article>
          ))}
        </div>
        <p className="mt-4 rounded-xl bg-muted px-4 py-3 text-xs leading-5 text-text-secondary">
          招聘平台会随时下架或修改职位；部分页面可能要求登录。本站只保留公开信息摘要，不代替平台或招聘单位发布公告，也不保证职位仍在招聘。
        </p>
      </section>

      <section>
        <h2 className="text-2xl font-semibold text-text-primary">继续查看平台实时职位</h2>
        <p className="mt-2 text-sm text-text-secondary">点击进入平台后，可以再按城市、学历、经验或岗位方向筛选。</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {platformChannels.map((channel) => (
            <a key={channel.name} href={channel.url} target="_blank" rel="noopener noreferrer" className="group rounded-xl border border-border bg-surface p-4 transition-all hover:border-brand/40 hover:shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-medium text-text-primary group-hover:text-brand">{channel.name}</h3>
                <ExternalLink className="h-4 w-4 shrink-0 text-text-secondary/60 group-hover:text-brand" />
              </div>
              <p className="mt-2 text-sm leading-5 text-text-secondary">{channel.description}</p>
              <p className="mt-3 text-xs font-medium text-brand">建议检索：{channel.query}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted p-5 sm:p-6">
        <h2 className="text-lg font-semibold text-text-primary">对交叉背景求职者的提示</h2>
        <div className="mt-3 grid gap-3 text-sm leading-6 text-text-secondary md:grid-cols-3">
          <p><span className="font-medium text-text-primary">从行业场景切入：</span>医疗、金融、人力资源和知识服务团队会把 AI 用进已有流程，领域理解能帮助你找到具体问题。</p>
          <p><span className="font-medium text-text-primary">把能力写成证据：</span>用作品集展示需求访谈、数据分析、提示词评测、原型或内容策划结果，比只写“了解 AI”更清楚。</p>
          <p><span className="font-medium text-text-primary">逐条核对岗位：</span>学科要求、经验、薪酬和职位状态会因团队和招聘批次而变，投递前请以招聘页面为准。</p>
        </div>
      </section>
    </div>
  );
}
