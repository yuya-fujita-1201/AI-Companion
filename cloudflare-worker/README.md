# AI Companion Proxy - Cloudflare Workers

モバイルアプリとOpenAI API間の通信を仲介する軽量プロキシサーバー

## 📋 概要

このCloudflare Workerは、AI Companionアプリのために以下の機能を提供します：

- **APIキーの安全な管理**: OpenAI APIキーをサーバー側で管理し、モバイルアプリに露出させない
- **CORS対応**: クロスオリジンリクエストを許可
- **エラーハンドリング**: 適切なエラーメッセージとHTTPステータスコードを返す
- **エッジコンピューティング**: 世界中のユーザーに低レイテンシで応答

## 🚀 クイックスタート

### 前提条件

- Node.js 16.13.0以上
- Cloudflareアカウント
- OpenAI APIキー

### セットアップ

1. **依存関係のインストール**

```bash
npm install
```

2. **Cloudflareアカウントへのログイン**

```bash
npx wrangler login
```

3. **環境変数の設定**

```bash
npx wrangler secret put OPENAI_API_KEY
```

プロンプトが表示されたら、OpenAI APIキーを貼り付けてEnterキーを押します。

### 開発

ローカル開発サーバーを起動：

```bash
npm run dev
```

サーバーは `http://localhost:8787` で起動します。

### テスト

別のターミナルでテストを実行：

```bash
npm test
```

### デプロイ

本番環境にデプロイ：

```bash
npm run deploy
```

デプロイが完了すると、公開URLが表示されます：

```
https://ai-companion-proxy.your-subdomain.workers.dev
```

## 📡 エンドポイント

### 1. ヘルスチェック

```
GET /health
```

**レスポンス:**

```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

### 2. チャット

```
POST /api/chat
```

**リクエストボディ:**

```json
{
  "messages": [
    {
      "role": "system",
      "content": "あなたは猫のミケです。"
    },
    {
      "role": "user",
      "content": "こんにちは！"
    }
  ],
  "model": "gpt-4o-mini",
  "temperature": 0.7,
  "max_tokens": 1000
}
```

**レスポンス:**

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

### 3. 音声認識（オプション）

```
POST /api/transcribe
```

**リクエストボディ:** `multipart/form-data`

- `file`: 音声ファイル（m4a, mp3, wav など）
- `model`: `whisper-1`（デフォルト）

**レスポンス:**

```json
{
  "text": "こんにちは、元気ですか？"
}
```

### 4. 音声合成（オプション）

```
POST /api/tts
```

**リクエストボディ:**

```json
{
  "text": "こんにちは！元気にゃ？",
  "model": "tts-1",
  "voice": "nova",
  "speed": 1.0
}
```

**レスポンス:** 音声データ（MP3形式、バイナリ）

## 🔧 設定

### wrangler.toml

Workerの設定は `wrangler.toml` で管理します：

```toml
name = "ai-companion-proxy"
main = "src/index.js"
compatibility_date = "2024-01-01"
```

### 環境変数

以下の環境変数が必要です：

- `OPENAI_API_KEY`: OpenAI APIキー（必須）

環境変数は `wrangler secret` コマンドで設定します：

```bash
npx wrangler secret put OPENAI_API_KEY
```

## 📊 モニタリング

### リアルタイムログ

```bash
npm run tail
```

### ダッシュボード

Cloudflareダッシュボードで以下の情報を確認できます：

- リクエスト数
- エラー率
- レスポンス時間
- CPU使用量

## 💰 コスト

### 無料プラン

- 1日あたり100,000リクエスト
- 10ミリ秒のCPU時間/リクエスト

### 有料プラン（$5/月）

- 1,000万リクエスト/月
- 50ミリ秒のCPU時間/リクエスト

## 🔒 セキュリティ

- APIキーは環境変数として管理し、コードに含めない
- CORS設定を適切に設定（本番環境では特定のドメインに制限）
- レート制限の実装を推奨

## 🐛 トラブルシューティング

### エラー: "Authentication error"

OpenAI APIキーが正しく設定されているか確認：

```bash
npx wrangler secret list
```

### エラー: "CORS policy error"

CORS設定を確認し、必要に応じて `corsHeaders` を修正してください。

### デプロイエラー

Wranglerが正しくログインしているか確認：

```bash
npx wrangler logout
npx wrangler login
```

## 📚 参考資料

- [Cloudflare Workers公式ドキュメント](https://developers.cloudflare.com/workers/)
- [Wrangler CLI リファレンス](https://developers.cloudflare.com/workers/wrangler/)
- [OpenAI API リファレンス](https://platform.openai.com/docs/api-reference)

## 📄 ライセンス

MIT
