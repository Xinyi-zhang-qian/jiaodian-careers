'use client';

import { Heart } from 'lucide-react';
import { useFavorites } from '@/lib/use-favorites';

// 详情页收藏切换按钮（需求 §10：列表页与详情页均可收藏；交互规格 docs/interaction.md §7）。
export default function FavoriteButton({ jobId }: { jobId: number }) {
  const { isFavorited, toggleFavorite } = useFavorites();
  const favorited = isFavorited(jobId);

  return (
    <button
      onClick={() => toggleFavorite(jobId)}
      className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl border font-medium transition-colors ${
        favorited
          ? 'border-accent bg-accent/10 text-accent'
          : 'border-border bg-surface text-text-secondary hover:border-accent hover:text-accent'
      }`}
      aria-label={favorited ? '取消收藏' : '收藏'}
    >
      <Heart className="w-4 h-4" fill={favorited ? 'currentColor' : 'none'} />
      {favorited ? '已收藏' : '收藏'}
    </button>
  );
}
