'use client';

// 用户画像管理 hook（match 模块，第 3 轮）。
// 画像存 localStorage 键 jiaodian-profile（契约 20），全部读写本地完成、不上传；
// SSR/预渲染环境安全（window 守卫），解析失败按空画像处理（与 use-favorites 同模式）。
import { useState, useEffect, useCallback } from 'react';
import type { Profile, EducationEntry, WorkEntry } from './match';

const STORAGE_KEY = 'jiaodian-profile';

const EMPTY_PROFILE: Profile = { education: [], work: [], skills: [] };

function readProfile(): Profile {
  if (typeof window === 'undefined') return EMPTY_PROFILE;
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return EMPTY_PROFILE;
    const parsed = JSON.parse(stored) as Profile;
    if (!Array.isArray(parsed.education) || !Array.isArray(parsed.work) || !Array.isArray(parsed.skills)) {
      return EMPTY_PROFILE;
    }
    return parsed;
  } catch {
    return EMPTY_PROFILE;
  }
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(readProfile());
    setHydrated(true);
  }, []);

  const persist = useCallback((next: Profile) => {
    setProfile(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // 写失败静默（与收藏同语义）
    }
  }, []);

  const addEducation = useCallback((entry: EducationEntry) => {
    setProfile((prev) => {
      const next = { ...prev, education: [...prev.education, entry] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeEducation = useCallback((index: number) => {
    setProfile((prev) => {
      const next = { ...prev, education: prev.education.filter((_, i) => i !== index) };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addWork = useCallback((entry: WorkEntry) => {
    setProfile((prev) => {
      const next = { ...prev, work: [...prev.work, entry] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeWork = useCallback((index: number) => {
    setProfile((prev) => {
      const next = { ...prev, work: prev.work.filter((_, i) => i !== index) };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const addSkill = useCallback((name: string) => {
    setProfile((prev) => {
      const next = { ...prev, skills: [...prev.skills, name] };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const removeSkill = useCallback((index: number) => {
    setProfile((prev) => {
      const next = { ...prev, skills: prev.skills.filter((_, i) => i !== index) };
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    persist(EMPTY_PROFILE);
  }, [persist]);

  return {
    profile,
    hydrated,
    addEducation,
    removeEducation,
    addWork,
    removeWork,
    addSkill,
    removeSkill,
    clearAll,
  };
}
