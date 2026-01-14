export const onRequestPost: PagesFunction = async ({ request, env }) => {
  try {
    const apiKey = (env as Record<string, string | undefined>).OPENAI_API_KEY;
    if (!apiKey) {
      return Response.json({ text: "" });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || typeof file === "string") {
      return Response.json({ error: "file is required" }, { status: 400 });
    }

    const transcriptionForm = new FormData();
    transcriptionForm.append("file", file, "voice.webm");
    transcriptionForm.append("model", "whisper-1");
    transcriptionForm.append("language", "ja");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: transcriptionForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: 500 });
    }

    const data = (await response.json()) as { text?: string };
    return Response.json({ text: data.text ?? "" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Unexpected error" }, { status: 500 });
  }
};
