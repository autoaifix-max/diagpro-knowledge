import { createBrowserClient } from "@/lib/supabase/client";
import { SiteHeader } from "@/components/site-header";
import { AskClient } from "@/components/ask-client";
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

export default async function AskPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; brand?: string }>;
}) {
  const params = await searchParams;
  const brands = await getBrands();

  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
        <h1 className="text-xl font-bold text-slate-900">اسأل عن أي عطل</h1>
        <AskClient
          brands={brands}
          initialQuestion={params.q ?? ""}
          initialBrand={params.brand ?? ""}
        />
      </main>
    </div>
  );
}
