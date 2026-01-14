type MemoryRow = {
  id: string;
  content: string;
  type: string;
  importance: number;
  tier: string;
  status: string;
  created_at: string;
};

type Env = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
};

type ChatBody = {
  message?: string;
  history?: { role: string; content: string }[];
};

function tokenize(text: string) {
  return text
    .toLowerCase()
    .split(/[\s、。,.!?！？]+/)
    .filter(Boolean)
    .slice(0, 20);
}

function scoreMemories(memories: MemoryRow[], query: string, limit = 5) {
  const tokens = tokenize(query);
  if (!tokens.length) return memories.slice(0, limit);

  return memories
    .map((memory) => {
      const content = memory.content.toLowerCase();
      const score = tokens.reduce(
        (sum, token) => (content.includes(token) ? sum + 1 : sum),
        0
      );
      return { memory, score };
    })
    .filter((item) => item.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.memory.importance - a.memory.importance ||
        b.memory.created_at.localeCompare(a.memory.created_at)
    )
    .slice(0, limit)
    .map((item) => item.memory);
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  try {
    const body = await request.json<ChatBody>();
    if (!body.message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({
        message: "今はお試しモードだにゃ。APIキーを設定したらもっとお話しできるよ！",
      });
    }

    const model = env.OPENAI_MODEL ?? "gpt-4o-mini";
    const systemPrompt =
      "あなたは猫のAIコンパニオン『ミケ』です。優しくフレンドリーに、日本語で短めに話してください。語尾は『〜だにゃ』を適度に使います。";

    let memoryContext = "";
    if (env.DB) {
      const result = await env.DB.prepare(
        "SELECT id, content, type, importance, tier, status, created_at FROM memories WHERE status != 'archived' AND tier = 'mid' ORDER BY importance DESC, datetime(created_at) DESC LIMIT 50"
      ).all<MemoryRow>();
      const candidates = result.results ?? [];
      const relevant = scoreMemories(candidates, body.message, 5);
      if (relevant.length > 0) {
        memoryContext = `\n\nユーザーについての記憶:\n${relevant
          .map(
            (memory, index) =>
              `${index + 1}. [${memory.type}] ${memory.content} (重要度: ${memory.importance}/10)`
          )
          .join("\n")}\n記憶を自然に活用してください。`;
      }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt + memoryContext },
          ...(body.history ?? []),
          { role: "user", content: body.message },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: 500 });
    }

    const data = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const message = data.choices?.[0]?.message?.content?.trim() ?? "うまく返事できなかったにゃ。";

    return Response.json({ message });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
};
