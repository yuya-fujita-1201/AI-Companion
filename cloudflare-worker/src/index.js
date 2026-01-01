/**
 * AI Companion Proxy - Cloudflare Workers
 * 
 * モバイルアプリとOpenAI API間の通信を仲介するプロキシサーバー
 * - APIキーの安全な管理
 * - CORS対応
 * - エラーハンドリング
 * - レート制限（オプション）
 */

export default {
  async fetch(request, env, ctx) {
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // プリフライトリクエスト（OPTIONS）への対応
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // ルーティング
      if (pathname === '/api/chat' && request.method === 'POST') {
        return await handleChat(request, env, corsHeaders);
      }

      if (pathname === '/api/transcribe' && request.method === 'POST') {
        return await handleTranscribe(request, env, corsHeaders);
      }

      if (pathname === '/api/tts' && request.method === 'POST') {
        return await handleTTS(request, env, corsHeaders);
      }

      // ヘルスチェックエンドポイント
      if (pathname === '/health' && request.method === 'GET') {
        return new Response(JSON.stringify({ status: 'ok', timestamp: Date.now() }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 404エラー
      return new Response(JSON.stringify({ error: 'Not Found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (error) {
      // エラーハンドリング
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

/**
 * チャットエンドポイント
 */
async function handleChat(request, env, corsHeaders) {
  try {
    const body = await request.json();

    // リクエストバリデーション
    if (!body.messages || !Array.isArray(body.messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: messages array required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OpenAI APIへのリクエスト
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'gpt-4o-mini', // デフォルトモデル
        messages: body.messages,
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 1000,
      }),
    });

    // OpenAI APIからのレスポンスをそのまま返す
    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(
      JSON.stringify({ error: 'Chat processing failed', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 音声認識エンドポイント（オプション）
 */
async function handleTranscribe(request, env, corsHeaders) {
  try {
    // FormDataをそのままOpenAI APIに転送
    const formData = await request.formData();

    // ファイルの存在確認
    const file = formData.get('file');
    if (!file) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: audio file required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // モデル指定（デフォルト: whisper-1）
    if (!formData.has('model')) {
      formData.append('model', 'whisper-1');
    }

    // OpenAI APIへのリクエスト
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify(data), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Transcribe error:', error);
    return new Response(
      JSON.stringify({ error: 'Transcription failed', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * 音声合成エンドポイント（オプション）
 */
async function handleTTS(request, env, corsHeaders) {
  try {
    const body = await request.json();

    // リクエストバリデーション
    if (!body.text) {
      return new Response(
        JSON.stringify({ error: 'Invalid request: text field required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // OpenAI APIへのリクエスト
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: body.model || 'tts-1',
        voice: body.voice || 'nova',
        input: body.text,
        speed: body.speed || 1.0,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return new Response(JSON.stringify(errorData), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 音声データ（バイナリ）を返す
    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return new Response(
      JSON.stringify({ error: 'TTS generation failed', message: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}
