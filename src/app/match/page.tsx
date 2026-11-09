'use client';

// 岗位匹配页（/match，match 模块，第 3 轮）。
// 画像编辑 + 本地打分推荐（契约 20、21）：全部计算在浏览器本地完成，无网络请求。
import { useMemo, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getJobs } from '@/lib/data';
import { REGIONS, ORG_TYPES } from '@/lib/utils';
import { matchProfile } from '@/lib/match';
import { useProfile } from '@/lib/use-profile';
import ProfileEditor from '@/components/match/profile-editor';
import RecommendList from '@/components/match/recommend-list';

export default function MatchPage() {
  const api = useProfile();
  const { profile, hydrated } = api;
  const [region, setRegion] = useState('');
  const [orgType, setOrgType] = useState('');

  // 输入即计算：画像或筛选变化时实时重算（纯本地）。
  const results = useMemo(() => {
    const scored = matchProfile(profile, getJobs({ limit: 1000 }).jobs);
    return scored.filter(({ job }) =>
      (!region || job.province.includes(region)) && (!orgType || job.org_type === orgType),
    );
  }, [profile, region, orgType]);

  const hasEntries = profile.education.length + profile.work.length + profile.skills.length > 0;

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-brand">画像匹配</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">岗位匹配推荐</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-text-secondary">
          填写你的教育经历、工作经历与技能特长，系统按岗位的核验信息与平台标签在本地打分排序，并给出逐条匹配理由；画像只保存在你的浏览器本地。
        </p>
      </section>

      <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
        <aside className="lg:sticky lg:top-8 self-start p-5 rounded-2xl border border-border bg-surface">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-brand" />
            <h2 className="font-medium text-text-primary">我的画像</h2>
          </div>
          <ProfileEditor api={api} />
        </aside>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="">全部地区</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={orgType}
              onChange={(e) => setOrgType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              <option value="">全部单位类型</option>
              {ORG_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <span className="text-sm text-text-secondary">{hydrated && hasEntries ? `${results.length} 个匹配岗位` : ''}</span>
          </div>

          {hydrated && hasEntries ? (
            <RecommendList results={results} />
          ) : (
            <div className="py-16 text-center text-text-secondary">
              <p className="text-lg">填写左侧画像获得推荐</p>
              <p className="mt-2 text-sm">添加教育经历（阶段 + 专业）、工作经历与技能特长后，这里会展示按匹配度排序的岗位与推荐理由。</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
