"use client";

import { useState } from "react";
import type { Brand } from "@/lib/types";

const SOURCE_TYPES = [
  { value: "forum", label: "منتدى" },
  { value: "youtube", label: "يوتيوب" },
  { value: "diagnostic_site", label: "موقع تشخيص" },
  { value: "guide", label: "دليل" },
];

const SPECIALTIES = [
  { value: "diagnostics", label: "تشخيص أعطال" },
  { value: "electrical", label: "كهرباء" },
  { value: "ecu_programming", label: "برمجة ECU" },
  { value: "mechanical", label: "ميكانيك" },
  { value: "transmission", label: "ناقل الحركة" },
  { value: "general", label: "عام" },
];

export function AdminAddSource({ brands }: { brands: Brand[] }) {
  const [form, setForm] = useState({
    name: "",
    url: "",
    source_type: "forum",
    brand_slug: "",
    specialty: "general",
    language: "en",
  });
  const [status, setStatus] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("جارٍ الحفظ...");

    const res = await fetch("/api/admin/sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      setStatus("تمت الإضافة بنجاح");
      setForm({ ...form, name: "", url: "" });
    } else {
      const body = await res.json().catch(() => ({}));
      setStatus(body.error ?? "حدث خطأ");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold text-slate-900">إضافة مصدر جديد</h3>
      <input
        placeholder="اسم المصدر"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2"
        required
      />
      <input
        placeholder="الرابط"
        value={form.url}
        onChange={(e) => setForm({ ...form, url: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2"
        required
      />
      <div className="flex gap-3">
        <select
          value={form.source_type}
          onChange={(e) => setForm({ ...form, source_type: e.target.value })}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
        <select
          value={form.specialty}
          onChange={(e) => setForm({ ...form, specialty: e.target.value })}
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
        >
          {SPECIALTIES.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>
      <select
        value={form.brand_slug}
        onChange={(e) => setForm({ ...form, brand_slug: e.target.value })}
        className="rounded-lg border border-slate-300 px-3 py-2"
      >
        <option value="">بدون ماركة محددة (عام)</option>
        {brands.map((b) => (
          <option key={b.id} value={b.slug}>
            {b.name_ar}
          </option>
        ))}
      </select>
      <button type="submit" className="rounded-lg bg-sky-600 px-4 py-2 font-semibold text-white hover:bg-sky-700">
        حفظ المصدر
      </button>
      {status && <p className="text-sm text-slate-600">{status}</p>}
    </form>
  );
}
