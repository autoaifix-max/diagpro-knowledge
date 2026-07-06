import { SiteHeader } from "@/components/site-header";
import { AdminLogin } from "@/components/admin-login";
import { AdminAddSource } from "@/components/admin-add-source";
import { AdminLogoutButton } from "@/components/admin-logout-button";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase/server";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getDashboardData() {
  const supabase = createServerClient();

  const [{ count: totalQuestions }, { data: brands }, { data: recentLogs }] = await Promise.all([
    supabase.from("query_log").select("*", { count: "exact", head: true }),
    supabase.from("brands").select("id, name_ar, name_en, slug").order("name_ar"),
    supabase
      .from("query_log")
      .select("question, brand_id, created_at")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const brandList = (brands ?? []) as Brand[];
  const brandNameById = Object.fromEntries(brandList.map((b) => [b.id, b.name_ar]));

  const brandCounts = new Map<string, number>();
  for (const log of recentLogs ?? []) {
    const key = log.brand_id ? brandNameById[log.brand_id] ?? "غير محدد" : "غير محدد";
    brandCounts.set(key, (brandCounts.get(key) ?? 0) + 1);
  }

  const topBrands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return {
    totalQuestions: totalQuestions ?? 0,
    recentLogs: recentLogs ?? [],
    brandList,
    topBrands,
  };
}

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return (
      <div className="flex flex-1 flex-col">
        <SiteHeader />
        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10">
          <h1 className="mb-6 text-center text-xl font-bold text-slate-900">
            لوحة إدارة DiagPro
          </h1>
          <AdminLogin />
        </main>
      </div>
    );
  }

  const { totalQuestions, recentLogs, brandList, topBrands } = await getDashboardData();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">لوحة إدارة DiagPro</h1>
          <AdminLogoutButton />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="text-sm text-slate-500">إجمالي الأسئلة</p>
            <p className="text-3xl font-bold text-slate-900">{totalQuestions}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4">
            <p className="mb-2 text-sm text-slate-500">أكثر الماركات سؤالًا (آخر 20)</p>
            <ul className="flex flex-col gap-1">
              {topBrands.map(([name, count]) => (
                <li key={name} className="flex justify-between text-sm">
                  <span>{name}</span>
                  <span className="font-semibold">{count}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <AdminAddSource brands={brandList} />

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="mb-3 font-semibold text-slate-900">آخر الأسئلة</h3>
          <ul className="flex flex-col gap-2">
            {recentLogs.map((log, i) => (
              <li key={i} className="border-b border-slate-100 pb-2 text-sm text-slate-700 last:border-0">
                {log.question}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </div>
  );
}
