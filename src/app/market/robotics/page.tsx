import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ArrowLeft, BarChart3, Building2, CalendarDays, Download, ExternalLink, MapPin, WalletCards } from 'lucide-react';
import RoboticsJobTable from '@/components/market/robotics-job-table';
import MarketPieChart from '@/components/market/market-pie-chart';
import marketData from '@/data/generated/robotics-market.json';
import { analyzeRoboticsMarket, type RoboticsMarketDataset } from '@/lib/robotics-market';

export const metadata: Metadata = {
  title: '全国机器人正式岗位样本分析 | 交点 Careers',
  description: '基于 BOSS 直聘、猎聘与官方招聘页公开的正式岗位样本，不含实习，分析机器人仿真、VLA、规划控制、感知、数据与系统岗位需求。',
};

const dataset = marketData as RoboticsMarketDataset;
const analysis = analyzeRoboticsMarket(dataset.jobs);
const maxDirectionCount = Math.max(...analysis.directions.map((item) => item.count), 1);
const maxCityCount = Math.max(...analysis.cities.map((item) => item.count), 1);
const pieColors = ['#0f766e', '#2563eb', '#db2777', '#d97706', '#7c3aed', '#0891b2', '#65a30d', '#dc2626', '#94a3b8'];

export default function RoboticsMarketPage() {
  const topDirection = analysis.directions[0];
  const simulation = analysis.directions.find((item) => item.id === 'simulation');
  const vla = analysis.directions.find((item) => item.id === 'vla');

  return (
    <div className="space-y-10">
      <section>
        <Link href="/market" className="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
          <ArrowLeft className="h-4 w-4" /> 返回招聘市场观察
        </Link>
        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-brand-dark">
          <BarChart3 className="h-4 w-4" />
          <span>机器人岗位需求专题 · 正式岗位 · 不含实习</span>
        </div>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">机器人岗位需求分析</h1>
        <p className="mt-4 max-w-4xl text-base leading-7 text-text-secondary">
          汇总 BOSS 直聘、猎聘和单位官网的公开正式职位线索，比较 VLA、仿真、规划控制、感知、数据评测和机器人系统等方向。未完成逐字段原文核验的记录只展示线索和分析标签，不再展示人工补写的岗位要求。所有实习岗位均已排除。
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-xs text-text-secondary">
          <CalendarDays className="h-3.5 w-3.5" /> 数据生成于 {dataset.generatedAt}；职位状态和待遇请以来源页为准
        </p>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
        <div className="flex gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div>
            <h2 className="font-semibold text-amber-950">这不是“全国只有 {analysis.total} 个岗位”</h2>
            <p className="mt-2 text-sm leading-6 text-amber-900/80">
              {analysis.total} 是脚本当前能回溯到公开来源的去重正式岗位样本数。招聘平台的结果会因登录、地区、个性化推荐与岗位下架而变化，公开页未稳定提供可复核的全国总数，因此不伪造“全量”数字。
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5">
          <p className="text-3xl font-semibold text-text-primary">{analysis.total}</p>
          <p className="mt-2 text-sm text-text-secondary">去重正式岗位样本</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><p className="text-3xl font-semibold text-text-primary">{analysis.organizationCount}</p><Building2 className="h-5 w-5 text-brand" /></div>
          <p className="mt-2 text-sm text-text-secondary">招聘单位</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><p className="text-3xl font-semibold text-text-primary">{analysis.cityCount}</p><MapPin className="h-5 w-5 text-brand" /></div>
          <p className="mt-2 text-sm text-text-secondary">城市 / 多地组合</p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-5">
          <div className="flex items-center justify-between"><p className="text-3xl font-semibold text-text-primary">{analysis.salaryDisclosureRate}%</p><WalletCards className="h-5 w-5 text-brand" /></div>
          <p className="mt-2 text-sm text-text-secondary">已核验薪资公开率</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(300px,0.55fr)]">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-brand-dark">具体方向需求</p>
              <h2 className="mt-1 text-2xl font-semibold text-text-primary">岗位数量与样本占比</h2>
            </div>
            <span className="text-xs text-text-secondary">一条岗位只计入一个主方向</span>
          </div>
          <div className="mt-7 space-y-6">
            {analysis.directions.map((direction) => (
              <div key={direction.id}>
                <div className="flex flex-wrap items-end justify-between gap-2">
                  <div>
                    <p className="font-medium text-text-primary">{direction.name}</p>
                    <p className="mt-1 text-xs text-text-secondary">
                      公开薪资 {direction.salaryDisclosed} 条
                      {direction.monthlySalarySamples >= 3 && direction.monthlyMedianK !== null
                        ? ` · 月薪区间中点中位数约 ${direction.monthlyMedianK}K（${direction.monthlySalarySamples} 条月薪样本）`
                        : ' · 月薪样本不足，不展示中位数'}
                    </p>
                  </div>
                  <p className="text-sm tabular-nums text-text-secondary"><span className="font-semibold text-text-primary">{direction.count}</span> 条 · {direction.share}%</p>
                </div>
                <div className="mt-2 h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${(direction.count / maxDirectionCount) * 100}%`, backgroundColor: direction.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-brand/20 bg-brand/5 p-6">
            <p className="text-sm font-semibold text-brand-dark">当前样本结论</p>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              {topDirection.name}以 {topDirection.count} 条位居第一。仿真样本 {simulation?.count ?? 0} 条，VLA 样本 {vla?.count ?? 0} 条；在这批不含实习的样本中，VLA 岗位多于纯仿真岗位，但这是样本观察，不是全国市场份额。
            </p>
            <p className="mt-3 text-xs leading-5 text-text-secondary/80">
              本轮清理已将未保存原文证据的薪资、学历、经验和职责全部撤下，因此暂不做薪资或任职门槛的比较。
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-semibold text-text-primary">招聘类型</h2>
            <div className="mt-4 space-y-3">
              {analysis.recruitmentTypes.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="font-medium text-text-primary">{item.count} 条</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <h2 className="font-semibold text-text-primary">来源构成</h2>
            <div className="mt-4 space-y-3">
              {analysis.sourceTypes.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">{item.name}</span>
                  <span className="font-medium text-text-primary">{item.count} 条</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <p className="text-sm font-medium text-brand-dark">招聘平台复查</p>
        <h2 className="mt-1 text-2xl font-semibold text-text-primary">BOSS 直聘与猎聘已收录样本</h2>
        <p className="mt-2 max-w-4xl text-sm leading-6 text-text-secondary">
          下列数字是本数据集从平台公开页已收录的去重正式岗位，用于衡量当前样本覆盖，不是平台的全国在招总数。
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {dataset.platformSearches.map((search) => (
            <a key={search.platform} href={search.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-border bg-muted p-5 transition-colors hover:border-brand/40">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-text-secondary">{search.platform}</p>
                  <p className="mt-1 text-3xl font-semibold text-text-primary">{search.includedJobs} <span className="text-sm font-normal text-text-secondary">条已收录</span></p>
                </div>
                <ExternalLink className="h-4 w-4 text-brand" />
              </div>
              <p className="mt-3 text-sm text-text-primary">检索：{search.query}</p>
              <p className="mt-2 text-xs leading-5 text-text-secondary">{search.note}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-text-primary">地区分布饼图</h2>
          <p className="mt-1 text-xs text-text-secondary">按公开样本中的城市/多地组合统计；多地岗位不拆分重复计数。</p>
          <MarketPieChart items={analysis.cities} total={analysis.total} colors={pieColors} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-text-primary">招聘单位分布饼图</h2>
          <p className="mt-1 text-xs text-text-secondary">展示样本中岗位数量最多的单位，其余单位合并为“其他”。</p>
          <MarketPieChart items={analysis.organizations} total={analysis.total} colors={pieColors} />
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-text-primary">城市分布</h2>
          <p className="mt-1 text-xs text-text-secondary">多城市岗位按来源页展示为一个“多地组合”，不拆分重复计数。</p>
          <div className="mt-6 space-y-4">
            {analysis.cities.map((city) => (
              <div key={city.name} className="grid grid-cols-[90px_minmax(0,1fr)_44px] items-center gap-3 text-sm">
                <span className="truncate text-text-secondary">{city.name}</span>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand" style={{ width: `${(city.count / maxCityCount) * 100}%` }} /></div>
                <span className="text-right tabular-nums text-text-primary">{city.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="text-xl font-semibold text-text-primary">高频技能信号</h2>
          <p className="mt-1 text-xs text-text-secondary">按岗位已结构化的技能字段统计，同义表达仍可能分开。</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {analysis.skills.map((skill) => (
              <span key={skill.name} className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-text-secondary">
                {skill.name} <span className="ml-1 font-medium text-text-primary">{skill.count}</span>
              </span>
            ))}
          </div>
          <div className="mt-7 rounded-xl bg-muted p-4 text-sm leading-6 text-text-secondary">
            强化学习、机器人仿真、世界模型、VLA、动力学、多传感器融合和 Sim2Real 是当前样本中反复出现的能力。申请时应把这些关键词落实到可验证的项目、指标和真机结果。
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium text-brand-dark">可追溯样本</p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary">岗位线索、核验说明与分析标签</h2>
          </div>
          <div className="flex flex-wrap gap-4 text-sm font-medium">
            <a href="/data/robotics-market.csv" download className="inline-flex items-center gap-1.5 text-brand hover:text-brand-dark"><Download className="h-4 w-4" /> 下载 CSV</a>
            <a href="/data/robotics-market.json" download className="inline-flex items-center gap-1.5 text-brand hover:text-brand-dark"><Download className="h-4 w-4" /> 下载 JSON</a>
            <a href="https://github.com/Xinyi-zhang-qian/jiaodian-careers/blob/main/scripts/collect-robotics-market.ts" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:text-brand-dark">
              查看采集脚本 <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="mt-6"><RoboticsJobTable jobs={dataset.jobs} /></div>
      </section>

      <section className="rounded-2xl border border-border bg-muted p-6">
        <h2 className="font-semibold text-text-primary">数据口径与限制</h2>
        <p className="mt-2 text-sm leading-6 text-text-secondary">{dataset.scope}</p>
        <ul className="mt-4 space-y-2 text-sm leading-6 text-text-secondary">
          {dataset.methodology.map((item) => <li key={item}>• {item}</li>)}
        </ul>
        <p className="mt-4 text-xs leading-5 text-text-secondary/80">
          脚本不会绕过登录、验证码或访问限制。招聘平台和单位官网会随时修改或下架职位，投递前请打开来源页再次确认。
        </p>
      </section>
    </div>
  );
}
