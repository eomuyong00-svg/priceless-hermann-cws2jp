import './globals.css'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'PAYDAY — 페이데이',
  description: '초보 친화 · 버튼 중심 · 실시간 차트 · 교육 허브',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <nav className="sticky top-0 z-10 bg-white/80 dark:bg-neutral-925/80 backdrop-blur border-b">
          <div className="max-w-6xl mx-auto flex items-center justify-between p-3">
            <div className="font-semibold">PAYDAY — 페이데이</div>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/" className="px-3 py-2 rounded-xl border">대시보드</Link>
              <Link href="/education" className="px-3 py-2 rounded-xl border">교육 허브</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  )
}
