'use client';

// 画像编辑器（match 模块，第 3 轮）：三组条目的增删编辑。
// 教育经历支持阶段下拉（本科/硕士/博士/自定义——选自定义时显示文本输入）；输入为空时添加按钮禁用。
import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import type { Profile } from '@/lib/match';
import type { useProfile } from '@/lib/use-profile';

type ProfileApi = ReturnType<typeof useProfile>;

const STAGE_OPTIONS = ['本科', '硕士', '博士', '自定义'];

function InputRow({ placeholder, value, onChange, onAdd, disabled }: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onAdd: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter' && !disabled) onAdd(); }}
        placeholder={placeholder}
        className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
      />
      <button
        type="button"
        onClick={onAdd}
        disabled={disabled}
        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <Plus className="w-4 h-4" /> 添加
      </button>
    </div>
  );
}

function EntryChips({ entries, onRemove, format }: {
  entries: { key: string; label: string }[];
  onRemove: (index: number) => void;
  format: (label: string) => string;
}) {
  if (entries.length === 0) {
    return <p className="text-xs text-text-secondary/60">暂无条目，添加后获得更精准的推荐。</p>;
  }
  return (
    <div className="flex flex-wrap gap-2">
      {entries.map((entry, index) => (
        <span key={entry.key} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand/10 text-brand-dark text-xs font-medium">
          {format(entry.label)}
          <button type="button" onClick={() => onRemove(index)} aria-label="删除" className="hover:text-accent">
            <X className="w-3.5 h-3.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

export default function ProfileEditor({ api }: { api: ProfileApi }) {
  const { profile } = api;
  const [stage, setStage] = useState('本科');
  const [customStage, setCustomStage] = useState('');
  const [major, setMajor] = useState('');
  const [workTitle, setWorkTitle] = useState('');
  const [skill, setSkill] = useState('');

  const effectiveStage = stage === '自定义' ? customStage.trim() : stage;
  const educationReady = Boolean(effectiveStage) && Boolean(major.trim());

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-medium text-text-primary mb-2">教育经历</h3>
        <div className="space-y-2">
          <div className="flex gap-2">
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-28 px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            >
              {STAGE_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
            </select>
            {stage === '自定义' && (
              <input
                type="text"
                value={customStage}
                onChange={(e) => setCustomStage(e.target.value)}
                placeholder="阶段名称（如：访学）"
                className="w-32 px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
              />
            )}
            <input
              type="text"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && educationReady) { api.addEducation({ stage: effectiveStage, major: major.trim() }); setMajor(''); } }}
              placeholder="专业名称（如：计算语言学）"
              className="flex-1 px-3 py-2 rounded-lg border border-border text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
            <button
              type="button"
              onClick={() => { api.addEducation({ stage: effectiveStage, major: major.trim() }); setMajor(''); }}
              disabled={!educationReady}
              className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" /> 添加
            </button>
          </div>
          <EntryChips
            entries={profile.education.map((entry, index) => ({ key: `${index}-${entry.major}`, label: `${entry.stage}·${entry.major}` }))}
            onRemove={api.removeEducation}
            format={(label) => label}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-text-primary mb-2">工作经历</h3>
        <div className="space-y-2">
          <InputRow
            placeholder="岗位名称（如：数据分析师）"
            value={workTitle}
            onChange={setWorkTitle}
            onAdd={() => { api.addWork({ title: workTitle.trim() }); setWorkTitle(''); }}
            disabled={!workTitle.trim()}
          />
          <EntryChips
            entries={profile.work.map((entry, index) => ({ key: `${index}-${entry.title}`, label: entry.title }))}
            onRemove={api.removeWork}
            format={(label) => label}
          />
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-text-primary mb-2">技能特长</h3>
        <div className="space-y-2">
          <InputRow
            placeholder="技能名称（如：Python、科技伦理）"
            value={skill}
            onChange={setSkill}
            onAdd={() => { api.addSkill(skill.trim()); setSkill(''); }}
            disabled={!skill.trim()}
          />
          <EntryChips
            entries={profile.skills.map((name, index) => ({ key: `${index}-${name}`, label: name }))}
            onRemove={api.removeSkill}
            format={(label) => label}
          />
        </div>
      </section>

      <button
        type="button"
        onClick={api.clearAll}
        className="text-xs text-accent hover:text-brand-dark transition-colors"
      >
        清空画像
      </button>
      <p className="text-xs text-text-secondary/60 leading-5">
        画像仅保存在你的浏览器本地（不上传）；匹配基于岗位的核验信息与平台标签，推荐结果仅供参考，不构成录用资格判断。
      </p>
    </div>
  );
}
