import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-bold text-slate-900">
          DiagPro <span className="text-sky-600">Knowledge</span>
        </Link>
        <nav className="flex gap-4 text-sm font-medium text-slate-600">
          <Link href="/" className="hover:text-sky-600">
            الرئيسية
          </Link>
          <Link href="/sources" className="hover:text-sky-600">
            المصادر
          </Link>
          <Link href="/admin" className="hover:text-sky-600">
            الإدارة
          </Link>
        </nav>
      </div>
    </header>
  );
}
