type MemoryType = "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
type MemoryTier = "short" | "mid" | "long";
type MemoryStatus = "active" | "archived";

type ExtractedMemory = {
  type?: MemoryType;
  content?: string;
  importance?: number;
};

type StoredMemory = {
  id: string;
  type: MemoryType;
  content: string;
  importance: number;
  tier: MemoryTier;
  status: MemoryStatus;
  createdAt: string;
};

type Env = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

function normalizeImportance(value: unknown) {
  const parsed = typeof value === "number" ? value : Number(value ?? 5);
  if (!Number.isFinite(parsed)) return 5;
  return Math.min(10, Math.max(1, Math.round(parsed)));
}

function classifyTier(memory: { type: MemoryType; importance: number }) {
  // Lower threshold to 5 to increase "Gain" (retention rate)
  if (memory.importance >= 5 || memory.type === "FACT" || memory.type === "PREFERENCE") {
    return { tier: "mid" as MemoryTier, status: "active" as MemoryStatus };
  }
  return { tier: "long" as MemoryTier, status: "archived" as MemoryStatus };
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<{ messages?: { role: string; content: string }[] }>();
    if (!body.messages?.length) {
      return Response.json({ memories: [] });
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ memories: [] });
    }

    const model = env.OPENAI_MODEL ?? "gpt-4o-mini";
    const systemPrompt =
      "あなたは日記アプリの裏方です。ユーザーの入力から「今日の一言タイトル（10文字以内）」と「感情（Emotion）」を抽出してください。余計な推測はせず、事実と感情のみを抽出します。";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `以下の会話から記憶を抽出してください。JSONのみで返してください。\n\n会話:\n${body.messages
              .map((m) => `${m.role}: ${m.content}`)
              .join("\n")}\n\n出力フォーマット:\n{"memories":[{"type":"FACT|PREFERENCE|EVENT|CONVERSATION_SUMMARY","content":"...","importance":1-10}]}`,
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: 500 });
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = data.choices?.[0]?.message?.content?.trim() ?? "";

    let extracted: ExtractedMemory[] = [];
    try {
      const parsed = JSON.parse(content) as { memories?: ExtractedMemory[] };
      extracted = parsed.memories ?? [];
    } catch {
      extracted = [];
    }

    if (!env.DB || extracted.length === 0) {
      return Response.json({ memories: [] });
    }

    const stored: StoredMemory[] = [];

    for (const memory of extracted) {
      const type = memory.type ?? "CONVERSATION_SUMMARY";
      const contentText = memory.content?.trim();
      if (!contentText) continue;

      const existing = await env.DB.prepare(
        "SELECT id FROM memories WHERE content = ? AND type = ? LIMIT 1"
      ).bind(contentText, type).first<{ id: string }>();
      if (existing?.id) continue;

      const importance = normalizeImportance(memory.importance ?? 5);
      const { tier, status } = classifyTier({ type, importance });
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      await env.DB.prepare(
        "INSERT INTO memories (id, content, type, importance, tier, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)"
      )
        .bind(id, contentText, type, importance, tier, status, createdAt)
        .run();

      stored.push({
        id,
        type,
        content: contentText,
        importance,
        tier,
        status,
        createdAt,
      });
    }

    return Response.json({ memories: stored });
  } catch (error) {
    console.error(error);
    return Response.json({ memories: [] });
  }
};
