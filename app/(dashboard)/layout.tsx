import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 사이드바 */}
      <aside className="w-52 bg-white border-r border-gray-200 flex flex-col">
        <div className="px-5 py-4 border-b border-gray-100">
          <h1 className="text-sm font-bold text-gray-900">카페 송출 시스템</h1>
          <p className="text-xs text-gray-400 mt-0.5">{session.user?.name}</p>
        </div>
        <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
          <Link href="/" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            📋 예약 현황
          </Link>
          <Link href="/drafts" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            📝 원고 관리
          </Link>
          <Link href="/accounts" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            👤 계정 관리
          </Link>
          <Link href="/cafes" className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg">
            🏠 카페 관리
          </Link>
        </nav>
      </aside>
      {/* 메인 */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
