import Link from "next/link";
import type { Brand } from "@/lib/types";

export function BrandGrid({ brands }: { brands: Brand[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
      {brands.map((brand) => (
        <Link
          key={brand.id}
          href={`/ask?brand=${brand.slug}`}
          className="flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-6 text-center shadow-sm transition hover:border-sky-400 hover:shadow-md"
        >
          <span className="font-semibold text-slate-900">{brand.name_ar}</span>
          <span className="text-xs text-slate-500">{brand.name_en}</span>
        </Link>
      ))}
    </div>
  );
}
