type Memory = {
  id?: string;
  type: "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
  content: string;
  importance: number;
  createdAt?: string;
};

export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const body = await request.json<{ messages?: { role: string; content: string }[] }>();
    if (!body.messages?.length) {
      return Response.json({ memories: [] });
    }

    const apiKey = (env as Record<string, string | undefined>).OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ memories: [] });
    }

    const model = (env as Record<string, string | undefined>).OPENAI_MODEL ?? "gpt-4o-mini";
    const systemPrompt =
      "あなたは会話から記憶を抽出するアシスタントです。重要な事実・好み・イベント・要約を短文で抽出してください。";

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
    try {
      const parsed = JSON.parse(content) as { memories?: Memory[] };
      return Response.json({ memories: parsed.memories ?? [] });
    } catch {
      return Response.json({ memories: [] });
    }
  } catch (error) {
    console.error(error);
    return Response.json({ memories: [] });
  }
};
