import { createBrowserClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import type { Brand, Source } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getBrands(): Promise<Brand[]> {
  const supabase = createBrowserClient();
  const { data } = await supabase.from("brands").select("id, name_ar, name_en, slug").order("name_ar");
  return data ?? [];
}

async function getSources(brandSlug?: string, specialty?: string): Promise<(Source & { brands: Brand | null })[]> {
  const supabase = createBrowserClient();
  let query = supabase
    .from("sources")
    .select("*, brands(id, name_ar, name_en, slug)")
    .order("name");

  if (brandSlug) {
    const { data: brand } = await supabase.from("brands").select("id").eq("slug", brandSlug).maybeSingle();
    if (brand) query = query.eq("brand_id", brand.id);
  }
  if (specialty) {
    query = query.eq("specialty", specialty);
  }

  const { data, error } = await query;
  if (error) {
    console.error(error);
    return [];
  }
  return data ?? [];
}

const SPECIALTIES = [
  { value: "diagnostics", label: "تشخيص أعطال" },
  { value: "electrical", label: "كهرباء" },
  { value: "ecu_programming", label: "برمجة ECU" },
  { value: "mechanical", label: "ميكانيك" },
  { value: "transmission", label: "ناقل الحركة" },
  { value: "general", label: "عام" },
];

const SOURCE_TYPE_LABELS: Record<string, string> = {
  forum: "منتدى",
  youtube: "يوتيوب",
  diagnostic_site: "موقع تشخيص",
  guide: "دليل",
};

export default async function SourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string; specialty?: string }>;
}) {
  const params = await searchParams;
  const [brands, sources] = await Promise.all([
    getBrands(),
    getSources(params.brand, params.specialty),
  ]);

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-xl font-bold text-slate-900">تصفح المصادر</h1>

        <form className="flex flex-wrap gap-3" method="GET">
          <select name="brand" defaultValue={params.brand ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">كل الماركات</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name_ar}
              </option>
            ))}
          </select>
          <select name="specialty" defaultValue={params.specialty ?? ""} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm">
            <option value="">كل التخصصات</option>
            {SPECIALTIES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700">
            فلترة
          </button>
        </form>

        <div className="flex flex-col gap-3">
          {sources.length === 0 && (
            <p className="text-slate-500">لا توجد مصادر مطابقة.</p>
          )}
          {sources.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="font-semibold text-slate-900">{s.name}</p>
                <p className="text-xs text-slate-500">
                  {s.brands?.name_ar ?? "عام"} · {SOURCE_TYPE_LABELS[s.source_type] ?? s.source_type}
                  {s.specialty ? ` · ${SPECIALTIES.find((sp) => sp.value === s.specialty)?.label ?? s.specialty}` : ""}
                </p>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-sky-600 px-3 py-1.5 text-sm font-semibold text-sky-600 hover:bg-sky-50"
              >
                افتح المصدر
              </a>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
