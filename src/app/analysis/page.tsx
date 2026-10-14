import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Bot, BriefcaseBusiness, ExternalLink, FlaskConical, GraduationCap, Layers3 } from 'lucide-react';
import { roboticsAiAnalysis } from '@/data/robotics-ai-analysis';

export const metadata: Metadata = {
  title: '机器人与 AI 岗位方向分析 | 交点 Careers',
  description: '比较具身大模型、VLA、仿真、强化学习、感知、控制、数据评测和机器人系统等岗位方向，并提供实习、博士后与企业岗位样本。',
};

const categoryIcons = {
  实习: GraduationCap,
  博士后: FlaskConical,
  企业岗位: BriefcaseBusiness,
};

const backgroundRoutes = [
  { background: '大模型 / 计算机视觉', route: '优先看 VLA、具身大模型、空间感知', proof: '补上机器人数据、动作空间和真机评测经验。' },
  { background: '控制 / 自动化 / 机械', route: '优先看规划控制、仿真、本体系统', proof: '把动力学、实时控制与学习算法串成完整项目。' },
  { background: '图形学 / 游戏引擎 / HPC', route: '优先看物理引擎、合成数据、Sim2Real', proof: '重点证明精度、性能和可复现的场景生成能力。' },
  { background: '数据工程 / 测试 / 后端', route: '优先看数据闭环、评测平台、推理部署', proof: '把数据版本、指标回归和失败分析做成工程证据。' },
];

export default function AnalysisPage() {
  const { directions, opportunities } = roboticsAiAnalysis;

  return (
    <div className="space-y-12">
      <section className="overflow-hidden rounded-3xl border border-brand/20 bg-brand/5 p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-2 text-sm font-medium text-brand">
          <Bot className="h-4 w-4" />
          <span>首期方向分析 · 更新于 2026 年 10 月 14 日</span>
        </div>
        <h1 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl lg:text-[44px] lg:leading-[1.15]">
          机器人与 AI：同一赛道，岗位在做什么？
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          “具身智能”不是一个单一岗位。从训练 VLA 大模型，到搭建物理仿真、控制真机、建设数据与评测平台，团队需要的是一条完整技术链。下面按工作对象、核心能力和作品集证据拆开比较。
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          {directions.map((direction) => (
            <a key={direction.id} href={`#${direction.id}`} className="rounded-full border border-brand/20 bg-surface px-3 py-1.5 text-sm text-brand-dark transition-colors hover:border-brand/50">
              {direction.shortName}
            </a>
          ))}
        </div>
        <p className="mt-5 text-xs leading-5 text-text-secondary/80">{roboticsAiAnalysis.sampleNote}</p>
      </section>

      <section>
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand">快速比较</p>
            <h2 className="mt-1 text-2xl font-semibold text-text-primary">七类岗位方向对照</h2>
          </div>
          <Link href="/jobs?discipline=%E6%9C%BA%E5%99%A8%E4%BA%BA%C3%97%E4%BB%BF%E7%9C%9F%E7%AE%97%E6%B3%95" className="hidden text-sm font-medium text-brand hover:text-brand-dark sm:inline-flex">
            查看相关岗位 <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-border bg-surface">
          <table className="w-full min-w-[900px] border-collapse text-left text-sm">
            <thead className="bg-muted text-text-secondary">
              <tr>
                <th className="px-5 py-3.5 font-medium">方向</th>
                <th className="px-5 py-3.5 font-medium">主要解决的问题</th>
                <th className="px-5 py-3.5 font-medium">典型岗位</th>
                <th className="px-5 py-3.5 font-medium">高频能力</th>
              </tr>
            </thead>
            <tbody>
              {directions.map((direction) => (
                <tr key={direction.id} className="border-t border-border align-top">
                  <td className="whitespace-nowrap px-5 py-4 font-medium text-text-primary">{direction.shortName}</td>
                  <td className="max-w-[280px] px-5 py-4 leading-6 text-text-secondary">{direction.focus}</td>
                  <td className="max-w-[230px] px-5 py-4 leading-6 text-text-secondary">{direction.typicalRoles.join('、')}</td>
                  <td className="max-w-[260px] px-5 py-4 leading-6 text-text-secondary">{direction.coreSkills.join(' · ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-sm font-medium text-brand">深入理解</p>
          <h2 className="mt-1 text-2xl font-semibold text-text-primary">岗位需求与作品集证据</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          {directions.map((direction, index) => (
            <article key={direction.id} id={direction.id} className="scroll-mt-24 rounded-2xl border border-border bg-surface p-5 sm:p-6">
              <div className="flex items-start gap-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-sm font-semibold text-brand-dark">{String(index + 1).padStart(2, '0')}</span>
                <div>
                  <h3 className="text-lg font-semibold text-text-primary">{direction.name}</h3>
                  <p className="mt-1 text-sm leading-6 text-text-secondary">{direction.focus}</p>
                </div>
              </div>
              <div className="mt-5 grid gap-4 border-t border-border pt-5 text-sm sm:grid-cols-2">
                <div>
                  <p className="font-medium text-text-primary">岗位信号</p>
                  <p className="mt-1.5 leading-6 text-text-secondary">{direction.signal}</p>
                </div>
                <div>
                  <p className="font-medium text-text-primary">更适合谁</p>
                  <p className="mt-1.5 leading-6 text-text-secondary">{direction.fit}</p>
                </div>
              </div>
              <div className="mt-4 rounded-xl bg-muted px-4 py-3 text-sm leading-6 text-text-secondary">
                <span className="font-medium text-text-primary">作品集建议：</span>{direction.workSample}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-muted p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Layers3 className="h-5 w-5 text-brand" />
          <h2 className="text-xl font-semibold text-text-primary">按已有背景选择切入口</h2>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {backgroundRoutes.map((item) => (
            <div key={item.background} className="rounded-xl border border-border bg-surface p-4">
              <p className="text-sm font-semibold text-text-primary">{item.background}</p>
              <p className="mt-2 text-sm font-medium text-brand-dark">{item.route}</p>
              <p className="mt-1.5 text-sm leading-6 text-text-secondary">{item.proof}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-6">
          <p className="text-sm font-medium text-brand">具体机会</p>
          <h2 className="mt-1 text-2xl font-semibold text-text-primary">实习、博士后与企业岗位样本</h2>
          <p className="mt-2 text-sm leading-6 text-text-secondary">岗位状态会变化；这里优先列单位官网或官方招聘系统，并保留核验入口。</p>
        </div>

        <div className="space-y-9">
          {(['实习', '博士后', '企业岗位'] as const).map((category) => {
            const Icon = categoryIcons[category];
            const categoryJobs = opportunities.filter((job) => job.category === category);
            return (
              <div key={category}>
                <div className="mb-4 flex items-center gap-2">
                  <Icon className="h-5 w-5 text-brand" />
                  <h3 className="text-lg font-semibold text-text-primary">{category}</h3>
                  <span className="text-sm text-text-secondary">{categoryJobs.length} 个样本</span>
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  {categoryJobs.map((job) => (
                    <article key={job.id} className="rounded-2xl border border-border bg-surface p-5 sm:p-6">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="rounded-md bg-brand/10 px-2.5 py-1 font-medium text-brand-dark">{job.direction}</span>
                        <span className="text-text-secondary">{job.location}</span>
                      </div>
                      <h4 className="mt-4 text-lg font-semibold text-text-primary">{job.title}</h4>
                      <p className="mt-1 text-sm text-text-secondary">{job.organization}</p>
                      <p className="mt-4 text-sm leading-6 text-text-secondary">{job.summary}</p>
                      <p className="mt-3 text-xs leading-5 text-text-secondary"><span className="font-medium text-text-primary">要求：</span>{job.requirements}</p>
                      <div className="mt-5 flex flex-wrap gap-4 text-sm font-medium">
                        <a href={job.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-brand hover:text-brand-dark">
                          {job.sourceName} <ExternalLink className="h-4 w-4" />
                        </a>
                        {job.internalUrl && (
                          <Link href={job.internalUrl} className="inline-flex items-center gap-1 text-text-secondary hover:text-brand">
                            站内详情 <ArrowRight className="h-4 w-4" />
                          </Link>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-brand/20 bg-brand/5 p-5 text-sm leading-6 text-text-secondary sm:p-6">
        <p className="font-medium text-text-primary">如何阅读这份分析</p>
        <p className="mt-2">“岗位信号”来自本页链接的官方岗位样本，是定性归纳，不是职位数量或薪资统计。申请前请回到来源页确认岗位是否仍开放、工作地点、学历、经验和投递方式。</p>
      </section>
    </div>
  );
}
