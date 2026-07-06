import Anthropic from "@anthropic-ai/sdk";
import type { ContentChunkMatch } from "./types";

const MODEL = "claude-sonnet-4-6";

export async function answerFromContext(question: string, chunks: ContentChunkMatch[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY غير مضبوط");
  }

  const anthropic = new Anthropic({ apiKey });

  const context = chunks.length
    ? chunks
        .map(
          (c, i) =>
            `[مصدر ${i + 1}] ${c.title ?? "بدون عنوان"}\n${c.content}`
        )
        .join("\n\n---\n\n")
    : "لا يوجد سياق متاح في قاعدة المعرفة حاليًا.";

  const message = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "أنت مساعد تشخيص سيارات لفني اسمه أشرف يعمل في مركز DiagPro بحفر الباطن. " +
      "جاوب دائمًا باللغة العربية بشكل واضح ومباشر ومفيد لفني مبتدئ. " +
      "استخدم فقط المعلومات الموجودة في السياق المرفق أدناه ولا تختلق معلومات غير موجودة فيه. " +
      "إذا كان السياق لا يحتوي على إجابة كافية، قل ذلك بصراحة واطلب من الفني مراجعة مصدر متخصص. " +
      "اذكر رقم المصدر [مصدر N] عند الاستشهاد بمعلومة.",
    messages: [
      {
        role: "user",
        content: `السياق من قاعدة المعرفة:\n\n${context}\n\nسؤال الفني: ${question}`,
      },
    ],
  });

  const text = message.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  return text;
}
