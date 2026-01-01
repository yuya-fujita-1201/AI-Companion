# Cloudflare Workers 構築手順書

## 📋 概要

本ドキュメントは、AI Companionアプリのために**Cloudflare Workers**を使用した軽量プロキシサーバーを構築する手順を詳しく説明します。このプロキシは、モバイルアプリとOpenAI API間の通信を仲介し、APIキーを安全に管理します。

### なぜCloudflare Workersなのか

Cloudflare Workersは、エッジコンピューティングプラットフォームとして以下の利点があります。

**コスト面の優位性**として、無料プランで1日あたり100,000リクエストまで処理可能であり、有料プランでも月額5ドルで1,000万リクエストまで対応できます。これは従来のVPSやクラウドサーバーと比較して圧倒的に低コストです。

**パフォーマンス面**では、世界中に分散されたエッジロケーション（300以上のデータセンター）で実行されるため、ユーザーに最も近いサーバーから応答が返され、レイテンシが最小化されます。

**運用面**においても、サーバーの管理が不要で、自動スケーリングに対応しており、デプロイも数秒で完了します。インフラの保守やアップデートを気にする必要がありません。

**セキュリティ面**では、環境変数としてAPIキーを安全に保存でき、アプリケーションコードに埋め込む必要がありません。また、Cloudflareの強力なDDoS保護も自動的に適用されます。

---

## 🎯 アーキテクチャ

```
┌─────────────────┐
│  モバイルアプリ  │
│  (React Native) │
└────────┬────────┘
         │ HTTPS
         │ POST /api/chat
         │ POST /api/transcribe (オプション)
         │ POST /api/tts (オプション)
         ↓
┌─────────────────────────┐
│  Cloudflare Workers     │
│  ┌───────────────────┐  │
│  │ APIキー管理        │  │
│  │ リクエスト検証     │  │
│  │ レート制限         │  │
│  │ エラーハンドリング │  │
│  └───────────────────┘  │
└────────┬────────────────┘
         │ HTTPS
         ↓
┌─────────────────┐
│   OpenAI API    │
│  - Chat         │
│  - Whisper      │
│  - TTS          │
└─────────────────┘
```

### エンドポイント設計

本プロキシは以下の3つのエンドポイントを提供します。

**チャットエンドポイント** (`POST /api/chat`) は、ユーザーのメッセージをOpenAI Chat APIに転送し、AI応答を返します。リクエストボディには`messages`配列（ChatGPT形式）が含まれ、レスポンスとしてOpenAI APIの完全なレスポンスがJSON形式で返されます。

**音声認識エンドポイント** (`POST /api/transcribe`) は、音声ファイルをOpenAI Whisper APIに転送し、テキストに変換します。リクエストボディは`multipart/form-data`形式で音声ファイルを含み、レスポンスとして文字起こしされたテキストがJSON形式で返されます。このエンドポイントはオプションであり、Expo Speechを使用する場合は不要です。

**音声合成エンドポイント** (`POST /api/tts`) は、テキストをOpenAI TTS APIに転送し、音声ファイルを生成します。リクエストボディには`text`フィールドが含まれ、レスポンスとして音声データ（MP3形式）がバイナリで返されます。このエンドポイントもオプションであり、Expo Speechを使用する場合は不要です。

---

## 🚀 ステップ1: Cloudflareアカウントの作成

### 1.1 アカウント登録

Cloudflareの公式サイト（https://dash.cloudflare.com/sign-up）にアクセスし、無料アカウントを作成します。

必要な情報は以下の通りです。

- メールアドレス
- パスワード
- 電話番号（2段階認証用、推奨）

登録後、メールアドレスの確認を行います。受信したメール内のリンクをクリックして、アカウントを有効化してください。

### 1.2 Workersプランの選択

Cloudflareダッシュボードにログイン後、左サイドバーから「Workers & Pages」を選択します。

初回アクセス時には、プラン選択画面が表示されます。まずは**無料プラン（Free）**を選択してください。無料プランでも以下の機能が利用できます。

- 1日あたり100,000リクエスト
- 10ミリ秒のCPU時間/リクエスト
- 1MBのスクリプトサイズ
- 無制限のWorkers数

これは小規模から中規模のアプリケーションには十分な容量です。将来的にユーザー数が増加した場合は、有料プラン（月額5ドル）にアップグレードすることで、1,000万リクエスト/月まで対応できます。

---

## 🛠️ ステップ2: Wrangler CLIのセットアップ

Wranglerは、Cloudflare Workers用の公式コマンドラインツールです。ローカル開発、テスト、デプロイを簡単に行えます。

### 2.1 Node.jsのバージョン確認

WranglerはNode.js 16.13.0以上が必要です。以下のコマンドでバージョンを確認してください。

```bash
node --version
```

もしNode.jsがインストールされていない場合、または古いバージョンの場合は、公式サイト（https://nodejs.org/）から最新のLTS版をインストールしてください。

### 2.2 Wranglerのインストール

グローバルにWranglerをインストールします。

```bash
npm install -g wrangler
```

インストールが完了したら、バージョンを確認します。

```bash
wrangler --version
```

`wrangler 3.x.x`のような出力が表示されれば成功です。

### 2.3 Cloudflareアカウントへのログイン

以下のコマンドでCloudflareアカウントにログインします。

```bash
wrangler login
```

ブラウザが自動的に開き、認証画面が表示されます。「Allow」ボタンをクリックして、Wranglerに権限を付与してください。

認証が完了すると、ターミナルに「Successfully logged in」と表示されます。

---

## 📁 ステップ3: プロジェクトの作成

### 3.1 プロジェクトディレクトリの作成

AI Companionアプリのルートディレクトリに、Cloudflare Workers用のディレクトリを作成します。

```bash
cd /home/ubuntu/ai-companion-app
mkdir cloudflare-worker
cd cloudflare-worker
```

### 3.2 Wranglerプロジェクトの初期化

Wranglerを使用して新しいプロジェクトを初期化します。

```bash
wrangler init
```

対話形式で以下の質問が表示されます。

1. **Would you like to use TypeScript?** → `No`（JavaScriptで実装）
2. **Would you like to use git?** → `Yes`（バージョン管理）
3. **Would you like to install dependencies?** → `Yes`（必要なパッケージをインストール）

初期化が完了すると、以下のファイルが生成されます。

```
cloudflare-worker/
├── wrangler.toml        # Wrangler設定ファイル
├── src/
│   └── index.js         # Workerのメインコード
├── package.json         # Node.jsパッケージ設定
└── .gitignore           # Git除外設定
```

### 3.3 wrangler.tomlの設定

`wrangler.toml`ファイルを開き、以下のように編集します。

```toml
name = "ai-companion-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"

# 環境変数（後でダッシュボードから設定）
[vars]
# OPENAI_API_KEY は環境変数として設定（コードに含めない）

# カスタムドメイン（オプション）
# routes = [
#   { pattern = "api.your-domain.com/*", zone_name = "your-domain.com" }
# ]
```

**設定項目の説明**

- `name`: Workerの名前（ユニークである必要があります）
- `main`: エントリーポイントのファイルパス
- `compatibility_date`: Workers APIのバージョン日付
- `vars`: 環境変数（機密情報は含めない）

---

## 🔐 ステップ4: OpenAI APIキーの取得

### 4.1 OpenAIアカウントの作成

OpenAIの公式サイト（https://platform.openai.com/signup）にアクセスし、アカウントを作成します。

既にChatGPTのアカウントを持っている場合でも、API用のアカウントは別途作成する必要があります。

### 4.2 APIキーの生成

OpenAIダッシュボード（https://platform.openai.com/api-keys）にアクセスし、「Create new secret key」ボタンをクリックします。

APIキーの名前を入力（例: `AI-Companion-App`）し、「Create secret key」をクリックします。

生成されたAPIキーは**一度しか表示されません**。必ず安全な場所にコピーして保存してください。形式は`sk-proj-...`のような文字列です。

### 4.3 課金設定

OpenAI APIは従量課金制です。使用するには、クレジットカードを登録する必要があります。

ダッシュボードの「Billing」セクションから、支払い方法を追加してください。

**コスト管理のヒント**

使用量の上限を設定することで、予期しない高額請求を防げます。「Usage limits」から月額の上限を設定してください（例: $10/月）。

また、使用量アラートを設定することで、一定の使用量に達したときにメール通知を受け取れます。

---

## 🔧 ステップ5: 環境変数の設定

APIキーは**絶対にコードに含めてはいけません**。Cloudflare Workersの環境変数機能を使用して安全に管理します。

### 5.1 Wrangler経由での設定（推奨）

ターミナルで以下のコマンドを実行します。

```bash
wrangler secret put OPENAI_API_KEY
```

プロンプトが表示されたら、OpenAI APIキーを貼り付けて、Enterキーを押します。

入力した内容は画面に表示されず、暗号化されてCloudflareに保存されます。

### 5.2 ダッシュボードからの設定（代替方法）

Cloudflareダッシュボードからも環境変数を設定できます。

1. Cloudflareダッシュボードにログイン
2. 「Workers & Pages」→ 作成したWorkerを選択
3. 「Settings」タブ → 「Variables」セクション
4. 「Add variable」をクリック
5. Variable name: `OPENAI_API_KEY`
6. Value: OpenAI APIキーを貼り付け
7. 「Encrypt」にチェックを入れる（重要）
8. 「Save」をクリック

### 5.3 環境変数の確認

設定した環境変数は、以下のコマンドで確認できます（値は表示されません）。

```bash
wrangler secret list
```

出力例：

```
OPENAI_API_KEY
```

---

## 💻 ステップ6: プロキシコードの実装

### 6.1 基本構造

`src/index.js`ファイルを開き、以下のコードを実装します。

```javascript
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
```

### 6.2 コードの説明

**CORS対応**により、モバイルアプリからのクロスオリジンリクエストを許可しています。`Access-Control-Allow-Origin: *`は開発環境では便利ですが、本番環境では特定のドメインに制限することを推奨します。

**エラーハンドリング**では、すべてのエラーをキャッチし、適切なHTTPステータスコードとエラーメッセージを返します。これにより、クライアント側でエラーの原因を特定しやすくなります。

**リクエストバリデーション**により、必須フィールドの存在確認を行い、不正なリクエストを早期に拒否します。

**環境変数の使用**では、`env.OPENAI_API_KEY`で安全にAPIキーにアクセスします。コードに直接APIキーを書くことは絶対に避けてください。

---

## 🧪 ステップ7: ローカルテスト

### 7.1 開発サーバーの起動

Wranglerには、ローカルで開発サーバーを起動する機能があります。

```bash
cd /home/ubuntu/ai-companion-app/cloudflare-worker
wrangler dev
```

サーバーが起動すると、以下のようなメッセージが表示されます。

```
⛅️ wrangler 3.x.x
-------------------
⎔ Starting local server...
[wrangler:inf] Ready on http://localhost:8787
```

これで、`http://localhost:8787`でWorkerにアクセスできます。

### 7.2 curlでのテスト

別のターミナルを開き、以下のコマンドでチャットエンドポイントをテストします。

```bash
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "あなたは猫のミケです。語尾に「にゃ」をつけて話します。"},
      {"role": "user", "content": "こんにちは！"}
    ]
  }'
```

正常に動作すれば、以下のようなレスポンスが返ります。

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "こんにちは！元気にゃ？"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 30,
    "completion_tokens": 10,
    "total_tokens": 40
  }
}
```

### 7.3 エラーケースのテスト

不正なリクエストをテストして、エラーハンドリングが正しく動作するか確認します。

```bash
# messagesフィールドなし
curl -X POST http://localhost:8787/api/chat \
  -H "Content-Type: application/json" \
  -d '{}'
```

期待されるレスポンス：

```json
{
  "error": "Invalid request: messages array required"
}
```

---

## 🚀 ステップ8: デプロイ

### 8.1 本番環境へのデプロイ

ローカルテストが成功したら、本番環境にデプロイします。

```bash
wrangler deploy
```

デプロイが完了すると、以下のようなメッセージが表示されます。

```
✨ Success! Uploaded 1 file (2.34 sec)
Published ai-companion-proxy (0.12 sec)
  https://ai-companion-proxy.your-subdomain.workers.dev
```

表示されたURLが、あなたのWorkerの公開URLです。この URLをモバイルアプリの設定に使用します。

### 8.2 デプロイの確認

公開URLにアクセスして、Workerが正常に動作しているか確認します。

```bash
curl -X POST https://ai-companion-proxy.your-subdomain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "テスト"}
    ]
  }'
```

正常にレスポンスが返れば、デプロイ成功です。

### 8.3 カスタムドメインの設定（オプション）

独自ドメインを使用したい場合は、Cloudflareダッシュボードから設定できます。

1. Cloudflareダッシュボードにログイン
2. 「Workers & Pages」→ 作成したWorkerを選択
3. 「Triggers」タブ → 「Custom Domains」セクション
4. 「Add Custom Domain」をクリック
5. ドメイン名を入力（例: `api.your-domain.com`）
6. 「Add Domain」をクリック

DNSレコードが自動的に設定され、数分後にカスタムドメインが有効になります。

---

## 📊 ステップ9: モニタリングとログ

### 9.1 リアルタイムログの確認

Wranglerを使用して、リアルタイムでログを確認できます。

```bash
wrangler tail
```

これにより、Workerへのすべてのリクエストとレスポンス、エラーログがターミナルに表示されます。

### 9.2 ダッシュボードでの分析

Cloudflareダッシュボードでは、以下の情報を確認できます。

- リクエスト数（時間別、日別）
- エラー率
- レスポンス時間
- 使用量（CPU時間、メモリ）

「Workers & Pages」→ 作成したWorkerを選択 → 「Metrics」タブから確認できます。

### 9.3 アラート設定

使用量が一定の閾値を超えたときにメール通知を受け取るよう設定できます。

1. ダッシュボードの「Notifications」セクションにアクセス
2. 「Add」をクリック
3. 「Workers」カテゴリを選択
4. 通知条件を設定（例: リクエスト数が80,000/日を超えた場合）
5. 通知先のメールアドレスを入力
6. 「Save」をクリック

---

## 🔒 セキュリティのベストプラクティス

### APIキーの保護

APIキーは**絶対にコードに含めない**でください。必ず環境変数として管理し、Gitリポジトリにコミットしないようにしてください。

### CORS設定の厳格化

開発環境では`Access-Control-Allow-Origin: *`で問題ありませんが、本番環境では特定のドメインに制限することを推奨します。

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://your-app-domain.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

### レート制限の実装

悪意のあるユーザーからの大量リクエストを防ぐため、レート制限を実装することを推奨します。Cloudflare Workersには、KVストアを使用したレート制限の実装例があります。

### HTTPS通信の強制

Cloudflare WorkersはデフォルトでHTTPSを使用しますが、モバイルアプリ側でもHTTPS通信を強制してください。

---

## 💰 コスト管理

### 無料プランの制限

無料プランでは、1日あたり100,000リクエストまで処理できます。これは以下のような使用量に相当します。

- 1,000ユーザー × 100リクエスト/日
- 10,000ユーザー × 10リクエスト/日

### 有料プランへのアップグレード

ユーザー数が増加し、無料プランの制限を超える場合は、有料プラン（月額5ドル）にアップグレードしてください。

有料プランでは、1,000万リクエスト/月まで対応でき、それを超える場合は追加料金（$0.50/100万リクエスト）が発生します。

### OpenAI APIのコスト

Cloudflare Workersのコストに加えて、OpenAI APIの使用料金が発生します。

- GPT-4o-mini: $0.15/1M入力トークン、$0.60/1M出力トークン
- Whisper: $0.006/分
- TTS: $15/1M文字

コストを最小限に抑えるため、以下の対策を推奨します。

1. **モデルの選択**: GPT-4ではなくGPT-4o-miniを使用（コストが約1/10）
2. **トークン制限**: `max_tokens`パラメータで応答の長さを制限
3. **キャッシュ活用**: 同じ質問への応答をクライアント側でキャッシュ
4. **音声処理**: 可能な限りExpo Speechを使用（無料）

---

## 🐛 トラブルシューティング

### エラー: "Authentication error"

**原因**: OpenAI APIキーが正しく設定されていない、または無効です。

**解決方法**:
1. `wrangler secret list`でAPIキーが設定されているか確認
2. OpenAIダッシュボードでAPIキーが有効か確認
3. 必要に応じて`wrangler secret put OPENAI_API_KEY`で再設定

### エラー: "CORS policy error"

**原因**: CORS設定が正しくないため、ブラウザがリクエストをブロックしています。

**解決方法**:
1. `corsHeaders`の設定を確認
2. プリフライトリクエスト（OPTIONS）が正しく処理されているか確認
3. モバイルアプリからのリクエストヘッダーを確認

### エラー: "Worker exceeded CPU time limit"

**原因**: Workerの処理時間が制限（10ms）を超えています。

**解決方法**:
1. 不要な処理を削除
2. 外部APIへのリクエストを最適化
3. 有料プランにアップグレード（CPU時間制限が緩和）

### デプロイエラー: "Unauthorized"

**原因**: Wranglerがクラウドフレアアカウントにログインしていません。

**解決方法**:
1. `wrangler logout`で一度ログアウト
2. `wrangler login`で再ログイン
3. ブラウザで認証を完了

---

## 📚 次のステップ

Cloudflare Workersのセットアップが完了したら、次は**モバイルアプリ側の実装**に進みます。

1. `lib/api-client.ts`の実装
2. Workerの公開URLを設定
3. tRPCからfetch APIへの移行
4. 全機能のテスト

詳細は、次のドキュメント「クライアント側実装ガイド」を参照してください。

---

## 📖 参考資料

- [Cloudflare Workers公式ドキュメント](https://developers.cloudflare.com/workers/)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/)
- [OpenAI API リファレンス](https://platform.openai.com/docs/api-reference)
- [Workers料金プラン](https://developers.cloudflare.com/workers/platform/pricing/)

---

**最終更新**: 2026年1月2日  
**ドキュメントバージョン**: 1.0  
**作成者**: Manus AI
