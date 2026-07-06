# DiagPro Knowledge

قاعدة معرفة ذكية لتشخيص وإصلاح السيارات (تويوتا، هيونداي، كيا، جنرال موتورز، فورد،
دودج تشارجر، كرايسلر 300، نيسان، هوندا أكورد، والسيارات الصينية) — Next.js + Supabase
(pgvector) + Claude API، بواجهة عربية RTL وتعمل كتطبيق PWA.

## التشغيل محليًا

```bash
npm install
cp .env.local.example .env.local   # ثم عبّي القيم
npm run dev
```

## متغيرات البيئة

راجع `.env.local.example`. المطلوب:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` — للإجابة الذكية (Claude)
- `OPENAI_API_KEY` — لتوليد embeddings (`text-embedding-3-small`, 1536 بُعد)
- `YOUTUBE_API_KEY` — لسكربت الجلب (اختياري، فقط عند تشغيل `npm run ingest`)
- `ADMIN_PASSWORD` — كلمة مرور لوحة `/admin`

## قاعدة البيانات

المخطط والبيانات الأولية مطبّقة على مشروع Supabase عبر migrations:
`brands`, `sources`, `content_chunks` (مع `pgvector` وfunction `match_content_chunks`
للبحث بالتشابه الدلالي), و`query_log`.

## سكربت جلب المحتوى

```bash
npm run ingest -- --video <youtube_url_or_id> --source-id <uuid>
```

يجلب عنوان الفيديو (YouTube Data API v3) والترجمة النصية المتاحة، يقسّمها إلى
أجزاء من 500-800 كلمة، يولّد embeddings، ويخزّنها في `content_chunks`.

## البنية

- `/` الصفحة الرئيسية — شبكة الماركات + بحث ذكي
- `/ask` صفحة السؤال والجواب (RAG: embedding → بحث pgvector → Claude → إجابة + مصادر)
- `/sources` تصفح المصادر مع فلترة حسب الماركة والتخصص
- `/admin` لوحة إدارة بسيطة (محمية بكلمة مرور `ADMIN_PASSWORD`): إضافة مصدر، إحصائيات الأسئلة
- `scripts/ingest.mjs` سكربت جلب محتوى يوتيوب
