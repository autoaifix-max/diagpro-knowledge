import { createBrowserClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { BrandGrid } from "@/components/brand-grid";
import type { Brand } from "@/lib/types";

export const dynamic = "force-dynamic";

async function getBrands(): Promise<Brand[]> {
  const supabase = createBrowserClient();
  const { data, error } = await supabase
    .from("brands")
    .select("id, name_ar, name_en, slug")
    .order("name_ar");

  if (error) {
    console.error(error);
    return [];
  }

  return data ?? [];
}

export default async function Home() {
  const brands = await getBrands();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-4 py-10">
        <section className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
            اسأل عن أي عطل في سيارتك
          </h1>
          <p className="mt-2 text-slate-600">
            قاعدة معرفة ذكية لتشخيص وإصلاح السيارات — تويوتا، هيونداي، كيا، جي إم،
            فورد، دودج، كرايسلر، نيسان، هوندا، والسيارات الصينية
          </p>

          <form action="/ask" method="GET" className="mx-auto mt-6 flex max-w-2xl gap-2">
            <input
              type="text"
              name="q"
              placeholder="مثال: أعطال ناقل حركة كامري 2015 أو P0741 Toyota Camry"
              className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-right shadow-sm focus:border-sky-500 focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-lg bg-sky-600 px-6 py-3 font-semibold text-white transition hover:bg-sky-700"
            >
              اسأل
            </button>
          </form>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-bold text-slate-900">تصفح حسب الماركة</h2>
          <BrandGrid brands={brands} />
        </section>
      </main>
    </div>
  );
}
