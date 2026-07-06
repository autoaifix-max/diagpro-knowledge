import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body?.name || !body?.url || !body?.source_type) {
    return NextResponse.json({ error: "بيانات ناقصة" }, { status: 400 });
  }

  const supabase = createServerClient();

  let brandId: string | null = null;
  if (body.brand_slug) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", body.brand_slug)
      .maybeSingle();
    brandId = brand?.id ?? null;
  }

  const { error } = await supabase.from("sources").insert({
    name: body.name,
    url: body.url,
    source_type: body.source_type,
    specialty: body.specialty || null,
    language: body.language || "en",
    brand_id: brandId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
