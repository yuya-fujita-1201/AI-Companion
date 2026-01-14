export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const body = await request.json<{
      message?: string;
      history?: { role: string; content: string }[];
      memoryContext?: string;
    }>();
    if (!body.message) {
      return Response.json({ error: "message is required" }, { status: 400 });
    }

    const apiKey = (env as Record<string, string | undefined>).OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({
        message: "今はお試しモードだにゃ。APIキーを設定したらもっとお話しできるよ！",
      });
    }

    const model = (env as Record<string, string | undefined>).OPENAI_MODEL ?? "gpt-4o-mini";
    const systemPrompt =
      "あなたは猫のAIコンパニオン『ミケ』です。優しくフレンドリーに、日本語で短めに話してください。語尾は『〜だにゃ』を適度に使います。";
    const memoryPrompt = body.memoryContext
      ? `\n\nユーザーについての記憶:\n${body.memoryContext}\n記憶を自然に活用してください。`
      : "";

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt + memoryPrompt },
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
