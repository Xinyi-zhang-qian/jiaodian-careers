import type { Metadata } from "next";
import "./globals.css";
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

export const metadata: Metadata = {
  title: "交点 Careers — 让交叉背景，找到适合的位置",
  description: "面向人文、社会科学与理工科交叉人才，发现重点城市的科研与产业机会。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col bg-background text-text-primary font-sans antialiased">
        <Header />
        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
