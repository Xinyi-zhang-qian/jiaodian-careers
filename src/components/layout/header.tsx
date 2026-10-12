import Link from 'next/link';

export default function Header() {
  return (
    <header className="border-b border-border bg-surface">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="text-xl font-semibold text-text-primary tracking-tight hover:text-brand transition-colors">
            交点
          </Link>
          <nav className="flex items-center gap-6 text-sm text-text-secondary">
            <Link href="/jobs" className="hover:text-brand transition-colors">探索岗位</Link>
            <Link href="/directions" className="hover:text-brand transition-colors">交叉方向</Link>
            <Link href="/favorites" className="hover:text-brand transition-colors">收藏</Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
