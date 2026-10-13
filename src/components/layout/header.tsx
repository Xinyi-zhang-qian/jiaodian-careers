import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="relative text-xl font-semibold text-text-primary tracking-tight transition-colors group-hover:text-brand">
              <span className="relative z-10">交点</span>
              <span className="absolute inset-0 -z-0 rounded-md bg-brand/0 blur-sm transition-all group-hover:bg-brand/20" style={{ boxShadow: '0 0 12px 2px rgba(97,118,107,0.3), 0 0 4px 1px rgba(97,118,107,0.15)' }}></span>
            </span>
            <span className="text-sm font-medium text-text-secondary/60 tracking-wide group-hover:text-brand/70 transition-colors">
              Careers
            </span>
          </Link>
          <nav className="flex items-center gap-1 text-[10px] text-text-secondary sm:gap-6 sm:text-sm">
            <Link href="/jobs" className="hover:text-brand transition-colors">探索岗位</Link>
            <Link href="/market" className="hover:text-brand transition-colors">市场观察</Link>
            <Link href="/internships" className="hover:text-brand transition-colors">实习岗位</Link>
            <Link href="/directions" className="hover:text-brand transition-colors">交叉方向</Link>
            <Link href="/favorites" className="hover:text-brand transition-colors">收藏</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
