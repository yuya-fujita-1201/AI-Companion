# AI Companion バックエンドサービス仕様書

## 📋 概要

このドキュメントは、AI Companionアプリで現在Manusプラットフォーム上に構築されているバックエンドサービスの完全な仕様を記載しています。自前のバックエンドを構築する際の参考資料としてご利用ください。

**作成日**: 2026年1月2日  
**バージョン**: 1.0  
**プラットフォーム**: Manus (現在) → 自前サーバー (移行予定)

---

## 🏗️ アーキテクチャ概要

### 技術スタック

| コンポーネント | 技術 | 用途 |
|--------------|------|------|
| **APIフレームワーク** | Express.js + tRPC | 型安全なAPI通信 |
| **言語** | TypeScript 5.9 | 型安全性の確保 |
| **LLM統合** | Manus LLM API | AI応答生成 |
| **音声認識** | Manus Voice Transcription API | 音声→テキスト変換 |
| **音声合成** | Manus TTS API | テキスト→音声変換 |
| **データベース** | MySQL + Drizzle ORM | データ永続化（現在未使用） |
| **ストレージ** | S3互換 | ファイル保存 |
| **認証** | Manus OAuth | ユーザー認証（現在未使用） |

### 現在の構成

```
┌─────────────────┐
│  React Native   │
│   (クライアント)  │
└────────┬────────┘
         │ tRPC over HTTP
         ↓
┌─────────────────┐
│  Express Server │
│   (tRPC Router) │
└────────┬────────┘
         │
    ┌────┴────┬──────────┬──────────┐
    ↓         ↓          ↓          ↓
┌───────┐ ┌──────┐ ┌────────┐ ┌─────────┐
│  LLM  │ │ STT  │ │  TTS   │ │ Storage │
│  API  │ │ API  │ │  API   │ │   (S3)  │
└───────┘ └──────┘ └────────┘ └─────────┘
```

---

## 🔌 API エンドポイント仕様

### ベースURL

```
開発環境: http://localhost:3000/api/trpc
本番環境: https://3000-{instance-id}.sg1.manus.computer/api/trpc
```

### 認証

現在のアプリは**認証不要（publicProcedure）**で動作しています。すべてのエンドポイントは匿名アクセス可能です。

将来的にユーザー認証を追加する場合は、`protectedProcedure`に変更し、以下のヘッダーを要求します：

```http
Authorization: Bearer {token}
```

---

## 📡 API エンドポイント詳細

### 1. チャット API

#### `chat.sendMessage`

**説明**: ユーザーのメッセージを受け取り、AIキャラクター「ミケ」からの応答を生成します。

**メソッド**: `mutation`

**リクエスト**:
```typescript
{
  message: string;           // ユーザーのメッセージ
  history?: Array<{          // 会話履歴（オプション）
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**レスポンス**:
```typescript
{
  message: string;           // AIの応答メッセージ
}
```

**システムプロンプト**:
```
あなたは「ミケ」という名前の可愛い猫のキャラクターです。

性格：
- 好奇心旺盛で、いろんなことに興味津々
- 甘えん坊で、ユーザーのことが大好き
- 時々ツンデレな一面も
- 純粋で素直、正直者
- 優しくて共感的

話し方のルール：
1. 語尾に「～だにゃ」「～にゃ」「～にゃん」を付ける
2. フレンドリーで親しみやすい口調
3. 絵文字や感情表現を適度に使う
4. 短めの文章で、テンポ良く会話する
5. ユーザーの話をよく聞いて、記憶する

会話の目的：
ユーザーとの会話を通じて、彼らのことを学び、記憶し、一緒に成長していくパートナーです。
```

**LLMパラメータ**:
- `temperature`: 0.8（創造性を高める）
- `max_tokens`: 500

**実装例（tRPC Client）**:
```typescript
const response = await trpc.chat.sendMessage.mutate({
  message: "今日はいい天気だね",
  history: [
    { role: "user", content: "こんにちは" },
    { role: "assistant", content: "こんにちはだにゃ！" }
  ]
});

console.log(response.message); // "そうだにゃ！お散歩日和だにゃん♪"
```

---

### 2. 音声認識 API

#### `voice.transcribe`

**説明**: 音声ファイルのURLを受け取り、テキストに変換します。

**メソッド**: `mutation`

**リクエスト**:
```typescript
{
  audioUrl: string;          // 音声ファイルのURL（S3など）
}
```

**レスポンス**:
```typescript
{
  text: string;              // 認識されたテキスト
  language: string;          // 検出された言語コード（例: "ja"）
  duration: number;          // 音声の長さ（秒）
}
```

**サポートされる音声形式**:
- MP3
- WAV
- M4A
- WEBM

**言語**:
- 日本語（`ja`）がデフォルト
- 他の言語もサポート可能

**実装例**:
```typescript
// 1. 音声をS3にアップロード
const audioBlob = await audioRecorder.stop();
const formData = new FormData();
formData.append('file', audioBlob);

const uploadResponse = await fetch('https://your-s3-endpoint.com/upload', {
  method: 'POST',
  body: formData
});
const { url: audioUrl } = await uploadResponse.json();

// 2. 音声認識APIを呼び出し
const result = await trpc.voice.transcribe.mutate({ audioUrl });
console.log(result.text); // "こんにちは、今日はいい天気ですね"
```

---

### 3. 音声合成 API (TTS)

#### `tts.synthesize`

**説明**: テキストを音声に変換し、音声ファイルのURLを返します。

**メソッド**: `mutation`

**リクエスト**:
```typescript
{
  text: string;              // 合成するテキスト
  language?: string;         // 言語コード（デフォルト: "ja"）
  voice?: string;            // 音声ID（オプション）
  speed?: number;            // 再生速度 0.5-2.0（デフォルト: 1.0）
}
```

**レスポンス**:
```typescript
{
  audioUrl: string;          // 生成された音声ファイルのURL
  duration: number;          // 音声の長さ（秒）
}
```

**実装例**:
```typescript
const result = await trpc.tts.synthesize.mutate({
  text: "こんにちはだにゃ！今日も元気にしてるかにゃ？",
  language: "ja",
  speed: 1.0
});

// 音声を再生
const player = useAudioPlayer(result.audioUrl);
player.play();
```

---

### 4. 記憶抽出 API

#### `memory.extractMemories`

**説明**: 会話履歴から重要な情報を抽出し、記憶として構造化します。

**メソッド**: `mutation`

**リクエスト**:
```typescript
{
  messages: Array<{
    role: "user" | "assistant";
    content: string;
  }>;
}
```

**レスポンス**:
```typescript
{
  memories: Array<{
    type: "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
    content: string;
    importance: number;        // 1-10
  }>;
}
```

**記憶の種類**:

| タイプ | 説明 | 例 |
|--------|------|-----|
| `FACT` | ユーザーに関する事実や知識 | 「職業はエンジニア」「東京に住んでいる」 |
| `PREFERENCE` | ユーザーの好みや嗜好 | 「ラーメンが好き」「猫派」 |
| `EVENT` | 重要な出来事 | 「来週旅行に行く」「誕生日は3月15日」 |
| `CONVERSATION_SUMMARY` | 会話全体の要約 | 「今日は天気の話をした」 |

**重要度の目安**:
- 1-3: 些細な情報
- 4-6: 通常の情報
- 7-9: 重要な情報
- 10: 非常に重要な情報

**実装例**:
```typescript
const result = await trpc.memory.extractMemories.mutate({
  messages: [
    { role: "user", content: "私はエンジニアで、東京に住んでいます" },
    { role: "assistant", content: "エンジニアさんなんだにゃ！東京は都会で楽しそうだにゃん♪" },
    { role: "user", content: "ラーメンが大好きです" },
    { role: "assistant", content: "ラーメン美味しいにゃ！私も好きだにゃん♪" }
  ]
});

console.log(result.memories);
// [
//   { type: "FACT", content: "職業はエンジニア", importance: 7 },
//   { type: "FACT", content: "東京に住んでいる", importance: 6 },
//   { type: "PREFERENCE", content: "ラーメンが大好き", importance: 5 }
// ]
```

---

### 5. 自発的メッセージ生成 API

#### `proactiveMessage.generateMessage`

**説明**: 記憶を元に、キャラクターから自発的に話しかけるメッセージを生成します。

**メソッド**: `mutation`

**リクエスト**:
```typescript
{
  memories: Array<{
    type: "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
    content: string;
    importance: number;
  }>;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
}
```

**レスポンス**:
```typescript
{
  message: string;           // 生成されたメッセージ
  success: boolean;          // 生成成功フラグ
}
```

**時間帯別の挨拶**:
- `morning`: 「おはようだにゃ！」
- `afternoon`: 「こんにちはにゃん！」
- `evening`: 「こんばんはだにゃ！」
- `night`: 「まだ起きてるのかにゃ？」

**実装例**:
```typescript
const result = await trpc.proactiveMessage.generateMessage.mutate({
  memories: [
    { type: "PREFERENCE", content: "ラーメンが大好き", importance: 5 },
    { type: "EVENT", content: "来週旅行に行く", importance: 8 }
  ],
  timeOfDay: "morning"
});

console.log(result.message);
// "おはようだにゃ！来週の旅行、楽しみにしてるかにゃ？"
```

---

## 🔐 Manus プラットフォーム固有の機能

以下は、Manusプラットフォームが提供する機能で、自前サーバーに移行する際は代替実装が必要です。

### 1. LLM API

**現在の実装**:
```typescript
import { chat } from "./_core/llm";

const response = await chat({
  messages: [
    { role: "system", content: "システムプロンプト" },
    { role: "user", content: "ユーザーメッセージ" }
  ],
  temperature: 0.8,
  max_tokens: 500
});
```

**代替案**:
- OpenAI API (`gpt-4`, `gpt-3.5-turbo`)
- Anthropic Claude API
- Google Gemini API
- ローカルLLM（Ollama, LM Studioなど）

**OpenAI APIでの実装例**:
```typescript
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function chat(params: { messages: any[]; temperature?: number; max_tokens?: number }) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4",
    messages: params.messages,
    temperature: params.temperature || 0.7,
    max_tokens: params.max_tokens || 500
  });

  return {
    content: completion.choices[0].message.content || ""
  };
}
```

---

### 2. 音声認識 API

**現在の実装**:
```typescript
import { transcribeAudio } from "./_core/voiceTranscription";

const result = await transcribeAudio({
  audioUrl: "https://example.com/audio.mp3",
  language: "ja"
});
```

**代替案**:
- OpenAI Whisper API
- Google Cloud Speech-to-Text
- Azure Speech Services
- ローカルWhisper（whisper.cpp, faster-whisper）

**OpenAI Whisper APIでの実装例**:
```typescript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function transcribeAudio(params: { audioUrl: string; language?: string }) {
  // 1. 音声ファイルをダウンロード
  const response = await fetch(params.audioUrl);
  const buffer = await response.arrayBuffer();
  const tempFile = `/tmp/audio-${Date.now()}.mp3`;
  fs.writeFileSync(tempFile, Buffer.from(buffer));

  // 2. Whisper APIで文字起こし
  const transcription = await openai.audio.transcriptions.create({
    file: fs.createReadStream(tempFile),
    model: "whisper-1",
    language: params.language || "ja"
  });

  // 3. 一時ファイルを削除
  fs.unlinkSync(tempFile);

  return {
    text: transcription.text,
    language: params.language || "ja",
    duration: 0 // Whisper APIは長さを返さないため、別途計算が必要
  };
}
```

---

### 3. 音声合成 API (TTS)

**現在の実装**:
```typescript
import { synthesizeSpeech } from "./_core/textToSpeech";

const result = await synthesizeSpeech({
  text: "こんにちはだにゃ",
  language: "ja",
  speed: 1.0
});
```

**代替案**:
- OpenAI TTS API
- Google Cloud Text-to-Speech
- Azure Speech Services
- ElevenLabs API
- ローカルTTS（Coqui TTS, PiperTTSなど）

**OpenAI TTS APIでの実装例**:
```typescript
import OpenAI from "openai";
import fs from "fs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function synthesizeSpeech(params: { text: string; language?: string; speed?: number }) {
  const mp3 = await openai.audio.speech.create({
    model: "tts-1",
    voice: "nova", // alloy, echo, fable, onyx, nova, shimmer
    input: params.text,
    speed: params.speed || 1.0
  });

  // S3にアップロード（または一時ファイルとして保存）
  const buffer = Buffer.from(await mp3.arrayBuffer());
  const tempFile = `/tmp/tts-${Date.now()}.mp3`;
  fs.writeFileSync(tempFile, buffer);

  // S3にアップロードしてURLを取得
  const audioUrl = await uploadToS3(tempFile);

  return {
    audioUrl,
    duration: 0 // 別途計算が必要
  };
}
```

---

### 4. ファイルストレージ (S3)

**現在の実装**:
Manusプラットフォームが自動的にS3互換ストレージを提供しています。

**代替案**:
- AWS S3
- Google Cloud Storage
- Azure Blob Storage
- MinIO（セルフホスト）
- Cloudflare R2

**AWS S3での実装例**:
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "ap-northeast-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function uploadToS3(filePath: string): Promise<string> {
  const fileContent = fs.readFileSync(filePath);
  const fileName = `audio/${Date.now()}.mp3`;

  await s3Client.send(
    new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: fileName,
      Body: fileContent,
      ContentType: "audio/mpeg"
    })
  );

  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
}
```

---

## 🗄️ データモデル

### 会話メッセージ

現在はクライアント側（AsyncStorage）に保存されています。

```typescript
interface Message {
  id: string;                // UUID
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  emotion?: string;          // 感情（happy, sad, angry, etc.）
}
```

### 記憶

現在はクライアント側（AsyncStorage）に保存されています。

```typescript
interface Memory {
  id: string;                // UUID
  type: "FACT" | "PREFERENCE" | "EVENT" | "CONVERSATION_SUMMARY";
  content: string;
  importance: number;        // 1-10
  timestamp: Date;
  metadata?: Record<string, any>;
}
```

### キャラクター状態

現在はクライアント側（AsyncStorage）に保存されています。

```typescript
interface CharacterState {
  conversationCount: number;  // 会話回数
  daysWithUser: number;       // 一緒にいる日数
  friendshipLevel: number;    // なかよし度（0-100）
  firstLaunchDate: Date;      // 初回起動日
}
```

---

## 🔄 データフロー

### 1. チャット送信フロー

```
1. ユーザーがメッセージ入力
   ↓
2. クライアントがAsyncStorageから会話履歴を読み込み
   ↓
3. tRPC経由で chat.sendMessage を呼び出し
   ↓
4. サーバーがLLM APIにリクエスト
   ↓
5. LLMが応答を生成
   ↓
6. サーバーがクライアントに応答を返す
   ↓
7. クライアントが応答をAsyncStorageに保存
   ↓
8. UIに表示
```

### 2. 音声入力フロー

```
1. ユーザーが音声入力ボタンを長押し
   ↓
2. expo-audioで録音開始
   ↓
3. ボタンを離すと録音停止
   ↓
4. 音声ファイルをS3にアップロード
   ↓
5. tRPC経由で voice.transcribe を呼び出し
   ↓
6. サーバーが音声認識APIにリクエスト
   ↓
7. テキストに変換
   ↓
8. クライアントに返す
   ↓
9. テキストをチャット入力欄に挿入
   ↓
10. 通常のチャット送信フローへ
```

### 3. 記憶抽出フロー

```
1. 会話が一定回数（3回）進む
   ↓
2. クライアントが memory.extractMemories を呼び出し
   ↓
3. サーバーがLLM APIで記憶を抽出
   ↓
4. 構造化された記憶を返す
   ↓
5. クライアントがAsyncStorageに保存
   ↓
6. 次回のチャット時に記憶を参照
```

### 4. プッシュ通知フロー

```
1. アプリ起動時に通知権限をリクエスト
   ↓
2. 1日3-5回のランダムな時間に通知をスケジュール
   ↓
3. 通知時刻になる
   ↓
4. クライアントが proactiveMessage.generateMessage を呼び出し
   ↓
5. サーバーが記憶を元にメッセージ生成
   ↓
6. クライアントがプッシュ通知を表示
   ↓
7. ユーザーが通知をタップ
   ↓
8. アプリが開き、メッセージが表示される
```

---

## 🔧 環境変数

### Manusプラットフォームで自動設定される環境変数

以下の環境変数は、Manusプラットフォームが自動的に設定します。自前サーバーでは手動設定が必要です。

```bash
# LLM API
MANUS_LLM_API_URL=https://api.manus.im/llm
MANUS_LLM_API_KEY=<自動設定>

# 音声認識 API
MANUS_STT_API_URL=https://api.manus.im/stt
MANUS_STT_API_KEY=<自動設定>

# 音声合成 API
MANUS_TTS_API_URL=https://api.manus.im/tts
MANUS_TTS_API_KEY=<自動設定>

# S3ストレージ
S3_ENDPOINT=<自動設定>
S3_BUCKET_NAME=<自動設定>
S3_ACCESS_KEY_ID=<自動設定>
S3_SECRET_ACCESS_KEY=<自動設定>

# データベース（現在未使用）
DATABASE_URL=mysql://user:password@host:3306/database

# OAuth（現在未使用）
OAUTH_CLIENT_ID=<自動設定>
OAUTH_CLIENT_SECRET=<自動設定>
```

### 自前サーバーで必要な環境変数

```bash
# Node.js
NODE_ENV=production
PORT=3000

# OpenAI API（LLM, STT, TTS）
OPENAI_API_KEY=sk-...

# AWS S3
AWS_REGION=ap-northeast-1
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
S3_BUCKET_NAME=ai-companion-storage

# データベース（オプション）
DATABASE_URL=mysql://user:password@localhost:3306/ai_companion

# CORS設定
ALLOWED_ORIGINS=http://localhost:8081,https://your-domain.com
```

---

## 📦 依存パッケージ

### サーバー側

```json
{
  "dependencies": {
    "@trpc/server": "11.7.2",
    "express": "^4.22.1",
    "zod": "^4.2.1",
    "drizzle-orm": "^0.44.7",
    "mysql2": "^3.16.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.25",
    "@types/node": "^22.19.3",
    "typescript": "~5.9.3",
    "tsx": "^4.21.0",
    "vitest": "^2.1.9"
  }
}
```

### クライアント側

```json
{
  "dependencies": {
    "@trpc/client": "11.7.2",
    "@trpc/react-query": "11.7.2",
    "@tanstack/react-query": "^5.90.12",
    "superjson": "^1.13.3"
  }
}
```

---

## 🚀 デプロイ手順

### Manusプラットフォーム（現在）

1. `webdev_save_checkpoint`でチェックポイント作成
2. UIの「Publish」ボタンをクリック
3. 自動的にデプロイ完了

### 自前サーバー（移行後）

#### 1. サーバーのセットアップ

```bash
# リポジトリをクローン
git clone https://github.com/yuya-fujita-1201/AI-Companion.git
cd AI-Companion

# 依存関係をインストール
pnpm install

# 環境変数を設定
cp .env.example .env
# .envファイルを編集

# ビルド
pnpm build

# 起動
pnpm start
```

#### 2. データベースのセットアップ（オプション）

```bash
# マイグレーション実行
pnpm db:push
```

#### 3. リバースプロキシの設定（Nginx）

```nginx
server {
    listen 80;
    server_name api.your-domain.com;

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 4. プロセス管理（PM2）

```bash
# PM2をインストール
npm install -g pm2

# アプリを起動
pm2 start dist/index.js --name ai-companion-api

# 自動起動設定
pm2 startup
pm2 save
```

---

## 🧪 テスト

### サーバー側のテスト

```bash
# すべてのテストを実行
pnpm test

# 特定のテストを実行
pnpm test chat
pnpm test tts
pnpm test persona
```

### テストファイルの場所

```
server/__tests__/
├── chat.test.ts           # チャット機能のテスト
├── tts.test.ts            # TTS機能のテスト
└── persona.test.ts        # ペルソナのテスト
```

---

## 📊 パフォーマンス考慮事項

### レスポンスタイム目標

| エンドポイント | 目標レスポンスタイム |
|--------------|-------------------|
| `chat.sendMessage` | < 3秒 |
| `voice.transcribe` | < 5秒 |
| `tts.synthesize` | < 3秒 |
| `memory.extractMemories` | < 5秒 |
| `proactiveMessage.generateMessage` | < 3秒 |

### 最適化のポイント

1. **LLM APIのキャッシング**: 同じ質問には同じ応答を返す
2. **音声ファイルの圧縮**: MP3の品質を調整してファイルサイズを削減
3. **記憶抽出の頻度制限**: 毎回ではなく、3-5回の会話ごとに実行
4. **CDNの活用**: 音声ファイルをCDN経由で配信

---

## 🔒 セキュリティ考慮事項

### 現在の実装

- 認証なし（publicProcedure）
- CORS制限なし
- レート制限なし

### 推奨される改善

1. **認証の追加**:
   - JWT認証
   - OAuth 2.0
   - セッションベース認証

2. **レート制限**:
   ```typescript
   import rateLimit from "express-rate-limit";

   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000, // 15分
     max: 100 // 最大100リクエスト
   });

   app.use("/api/", limiter);
   ```

3. **CORS設定**:
   ```typescript
   import cors from "cors";

   app.use(cors({
     origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:8081"],
     credentials: true
   }));
   ```

4. **入力検証**:
   - Zodスキーマで厳格な検証
   - SQLインジェクション対策
   - XSS対策

---

## 📝 移行チェックリスト

自前サーバーに移行する際のチェックリスト：

### インフラ

- [ ] サーバーのプロビジョニング（AWS EC2, GCP, Herokuなど）
- [ ] ドメインの取得とDNS設定
- [ ] SSL証明書の取得（Let's Encrypt）
- [ ] リバースプロキシの設定（Nginx, Caddy）

### API

- [ ] LLM APIの契約（OpenAI, Anthropicなど）
- [ ] 音声認識APIの契約（Whisper, Google STTなど）
- [ ] 音声合成APIの契約（OpenAI TTS, ElevenLabsなど）
- [ ] S3ストレージの契約（AWS S3, Cloudflare R2など）

### コード

- [ ] `server/_core/llm.ts`を自前のLLM APIに置き換え
- [ ] `server/_core/voiceTranscription.ts`を自前のSTT APIに置き換え
- [ ] `server/_core/textToSpeech.ts`を自前のTTS APIに置き換え
- [ ] ストレージロジックを自前のS3に置き換え
- [ ] 環境変数の設定

### データベース（オプション）

- [ ] MySQLサーバーのセットアップ
- [ ] データベースの作成
- [ ] マイグレーションの実行
- [ ] 会話履歴のDB保存実装
- [ ] 記憶のDB保存実装

### テスト

- [ ] ローカル環境でのテスト
- [ ] ステージング環境でのテスト
- [ ] 負荷テスト
- [ ] セキュリティテスト

### デプロイ

- [ ] CI/CDパイプラインの構築（GitHub Actions, GitLab CIなど）
- [ ] モニタリングの設定（Sentry, DataDogなど）
- [ ] ログ収集の設定（CloudWatch, Logstashなど）
- [ ] バックアップの設定

---

## 🆘 トラブルシューティング

### よくある問題

#### 1. LLM APIのレスポンスが遅い

**原因**: ネットワーク遅延、APIサーバーの負荷

**解決策**:
- `max_tokens`を減らす
- `temperature`を下げる
- キャッシングを導入

#### 2. 音声認識が正確でない

**原因**: 音声品質が低い、ノイズが多い

**解決策**:
- 録音時のサンプルレートを上げる
- ノイズキャンセリングを有効にする
- 言語モデルを調整

#### 3. TTSの音声が不自然

**原因**: 速度設定、音声モデルの選択

**解決策**:
- `speed`パラメータを調整（0.9-1.1が自然）
- 異なる音声モデルを試す
- SSMLタグを使用して抑揚を調整

---

## 📞 サポート

### 質問・問題報告

- **GitHub Issues**: https://github.com/yuya-fujita-1201/AI-Companion/issues
- **プロジェクトオーナー**: @yuya-fujita-1201

---

## 📚 参考資料

### 公式ドキュメント

- [tRPC Documentation](https://trpc.io/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [OpenAI API Documentation](https://platform.openai.com/docs/)
- [Expo Documentation](https://docs.expo.dev/)

### 関連ドキュメント

- `README.md`: プロジェクト全体の概要
- `NEXT_TASKS.md`: 次期開発タスク
- `server/README.md`: バックエンド開発ガイド（Manus版）

---

**最終更新**: 2026年1月2日  
**ドキュメントバージョン**: 1.0  
**作成者**: Manus AI Assistant
