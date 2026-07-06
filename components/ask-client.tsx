"use client";

import { useState } from "react";
import type { Brand, AskResponse } from "@/lib/types";

export function AskClient({
  brands,
  initialQuestion,
  initialBrand,
}: {
  brands: Brand[];
  initialQuestion: string;
  initialBrand: string;
}) {
  const [question, setQuestion] = useState(initialQuestion);
  const [brandSlug, setBrandSlug] = useState(initialBrand);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, brandSlug: brandSlug || undefined }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "حدث خطأ أثناء المعالجة");
      }

      const data: AskResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="اكتب سؤالك بالعربي أو الإنجليزي... مثال: أعطال ناقل حركة كامري 2015"
          rows={3}
          className="w-full resize-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-right shadow-sm focus:border-sky-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={brandSlug}
            onChange={(e) => setBrandSlug(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="">كل الماركات</option>
            {brands.map((b) => (
              <option key={b.id} value={b.slug}>
                {b.name_ar}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-sky-600 px-6 py-2 font-semibold text-white transition hover:bg-sky-700 disabled:opacity-50"
          >
            {loading ? "جارٍ البحث..." : "اسأل"}
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="whitespace-pre-wrap leading-relaxed text-slate-900">
            {result.answer}
          </p>

          {result.sources.length > 0 && (
            <div className="mt-5 border-t border-slate-100 pt-4">
              <h3 className="mb-2 text-sm font-semibold text-slate-600">
                المصادر المستخدمة:
              </h3>
              <ul className="flex flex-col gap-2">
                {result.sources.map((s, i) => (
                  <li key={i}>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-sky-600 hover:underline"
                    >
                      {s.title ?? s.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
