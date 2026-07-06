import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { embedText } from "@/lib/embeddings";
import { answerFromContext } from "@/lib/claude";
import type { ContentChunkMatch } from "@/lib/types";

export async function POST(request: Request) {
  let body: { question?: string; brandSlug?: string };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return NextResponse.json({ error: "الرجاء كتابة سؤال" }, { status: 400 });
  }

  const supabase = createServerClient();

  let brandId: string | null = null;
  if (body.brandSlug) {
    const { data: brand } = await supabase
      .from("brands")
      .select("id")
      .eq("slug", body.brandSlug)
      .maybeSingle();
    brandId = brand?.id ?? null;
  }

  try {
    const embedding = await embedText(question);

    const { data: matches, error: matchError } = await supabase.rpc(
      "match_content_chunks",
      {
        query_embedding: embedding,
        match_count: 5,
        filter_brand_id: brandId,
      }
    );

    if (matchError) {
      throw new Error(matchError.message);
    }

    const chunks = (matches ?? []) as ContentChunkMatch[];
    const answer = await answerFromContext(question, chunks);

    const sourceIds = [...new Set(chunks.map((c) => c.source_id).filter(Boolean))];
    let sourcesById: Record<string, { name: string; url: string }> = {};
    if (sourceIds.length > 0) {
      const { data: sourceRows } = await supabase
        .from("sources")
        .select("id, name, url")
        .in("id", sourceIds as string[]);
      sourcesById = Object.fromEntries(
        (sourceRows ?? []).map((s) => [s.id, { name: s.name, url: s.url }])
      );
    }

    const sources = chunks.map((c) => ({
      title: c.title,
      name: c.source_id ? sourcesById[c.source_id]?.name ?? "مصدر" : "مصدر",
      url: c.video_url ?? (c.source_id ? sourcesById[c.source_id]?.url : "") ?? "",
    }));

    await supabase.from("query_log").insert({
      question,
      answer,
      brand_id: brandId,
    });

    return NextResponse.json({ answer, sources });
  } catch (err) {
    console.error(err);
    const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
