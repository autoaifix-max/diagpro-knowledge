#!/usr/bin/env node
// سكربت جلب محتوى فيديوهات يوتيوب وتحويلها إلى content_chunks مع embeddings.
//
// الاستخدام:
//   node scripts/ingest.mjs --video <youtube_url_or_id> --source-id <uuid>
//
// المتغيرات المطلوبة في البيئة:
//   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, YOUTUBE_API_KEY
//
// ملاحظة: YouTube Data API v3 لا يسمح بتنزيل الترجمة (captions.download) إلا لمالك
// القناة عبر OAuth. لذلك هذا السكربت يستخدم Data API v3 لجلب بيانات الفيديو (العنوان)،
// ونقطة timedtext العامة لجلب نص الترجمة المتاحة تلقائيًا لليوتيوب.

import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i].startsWith("--")) {
      const key = argv[i].slice(2);
      args[key] = argv[i + 1];
      i++;
    }
  }
  return args;
}

function extractVideoId(input) {
  if (!input.includes("/") && !input.includes("=")) return input;
  const url = new URL(input);
  if (url.hostname.includes("youtu.be")) return url.pathname.slice(1);
  return url.searchParams.get("v");
}

async function fetchVideoTitle(videoId, apiKey) {
  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
  );
  const json = await res.json();
  return json.items?.[0]?.snippet?.title ?? null;
}

async function fetchTranscript(videoId) {
  for (const lang of ["ar", "en"]) {
    const res = await fetch(
      `https://video.google.com/timedtext?lang=${lang}&v=${videoId}`
    );
    const xml = await res.text();
    if (xml && xml.includes("<text")) {
      const matches = [...xml.matchAll(/<text[^>]*>([\s\S]*?)<\/text>/g)];
      const text = matches
        .map((m) =>
          m[1]
            .replace(/&#39;/g, "'")
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
        )
        .join(" ");
      if (text.trim().length > 0) return text;
    }
  }
  return null;
}

function chunkText(text, minWords = 500, maxWords = 800) {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks = [];
  for (let i = 0; i < words.length; i += maxWords) {
    const slice = words.slice(i, i + maxWords);
    if (slice.length < minWords && chunks.length > 0) {
      chunks[chunks.length - 1] += " " + slice.join(" ");
    } else {
      chunks.push(slice.join(" "));
    }
  }
  return chunks;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.video || !args["source-id"]) {
    console.error("الاستخدام: node scripts/ingest.mjs --video <url_or_id> --source-id <uuid>");
    process.exit(1);
  }

  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY, YOUTUBE_API_KEY } = process.env;

  for (const [name, value] of Object.entries({
    NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    OPENAI_API_KEY,
    YOUTUBE_API_KEY,
  })) {
    if (!value) {
      console.error(`متغير البيئة ${name} غير مضبوط`);
      process.exit(1);
    }
  }

  const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const videoId = extractVideoId(args.video);
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

  console.log(`جلب بيانات الفيديو ${videoId} ...`);
  const title = await fetchVideoTitle(videoId, YOUTUBE_API_KEY);

  console.log("جلب الترجمة النصية ...");
  const transcript = await fetchTranscript(videoId);
  if (!transcript) {
    console.error("تعذر العثور على ترجمة نصية لهذا الفيديو.");
    process.exit(1);
  }

  const { data: source, error: sourceError } = await supabase
    .from("sources")
    .select("id, brand_id")
    .eq("id", args["source-id"])
    .maybeSingle();

  if (sourceError || !source) {
    console.error("source-id غير موجود في جدول sources");
    process.exit(1);
  }

  const chunks = chunkText(transcript);
  console.log(`تم تقسيم النص إلى ${chunks.length} جزء (chunk)`);

  for (const [index, content] of chunks.entries()) {
    console.log(`توليد embedding للجزء ${index + 1}/${chunks.length} ...`);
    const embeddingResponse = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: content,
    });
    const embedding = embeddingResponse.data[0].embedding;

    const { error: insertError } = await supabase.from("content_chunks").insert({
      source_id: source.id,
      brand_id: source.brand_id,
      title,
      content,
      embedding,
      video_url: videoUrl,
      metadata: { chunk_index: index },
    });

    if (insertError) {
      console.error("خطأ أثناء الحفظ:", insertError.message);
    }
  }

  console.log("اكتمل الجلب بنجاح.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
