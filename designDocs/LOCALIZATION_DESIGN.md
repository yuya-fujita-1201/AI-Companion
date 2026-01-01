# AI Companion アプリ - ローカル化設計書

## 📋 目的

AI Companionアプリを**サーバーレス・ローカルファースト**のアーキテクチャに変更し、以下の目標を達成する：

1. **App Store & Google Playでの公開**（多くのユーザーに届ける）
2. **サーバーコストの削減**（ユーザー数増加に対応）
3. **マネタイズの実現**（収益化）

---

## 🎯 設計方針

### ハイブリッド型：ローカル優先 + 軽量プロキシ

```
┌─────────────────────────┐
│    スマホアプリ          │
│  ┌──────────────────┐   │
│  │ AsyncStorage     │   │  ← すべてローカル保存
│  │ (会話・記憶)      │   │
│  │ Expo FileSystem  │   │  ← 音声ファイル
│  └──────────────────┘   │
└───────────┬─────────────┘
            │ HTTPS
            ↓
      ┌──────────┐
      │軽量プロキシ│  ← APIキー管理のみ
      │(Cloudflare│     （無料枠で運用可能）
      │ Workers) │
      └─────┬────┘
            │
            ↓
      ┌──────────┐
      │ LLM API  │  ← 従量課金
      │(OpenAI等)│
      └──────────┘
```

---

## 🔄 アーキテクチャ変更

### 現在（サーバー依存）

```
┌─────────────┐
│スマホアプリ  │
└──────┬──────┘
       │ tRPC
       ↓
┌─────────────┐
│Manusサーバー │  ← 削除対象
└──────┬──────┘
       │
   ┌───┴───┬──────┬──────┐
   ↓       ↓      ↓      ↓
 LLM     STT    TTS     S3
 API     API    API    (削除)
```

### 変更後（ローカル + LLMのみ外部）

```
┌─────────────────────────┐
│    スマホアプリ          │
│  ┌──────────────────┐   │
│  │ AsyncStorage     │   │
│  │ - 会話履歴        │   │
│  │ - 記憶データ      │   │
│  │ - キャラクター状態│   │
│  │ - 設定情報        │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ FileSystem       │   │
│  │ - 音声ファイル    │   │
│  └──────────────────┘   │
│  ┌──────────────────┐   │
│  │ Expo Speech      │   │
│  │ - STT (音声認識)  │   │
│  │ - TTS (音声合成)  │   │
│  └──────────────────┘   │
└───────────┬─────────────┘
            │ HTTPS
            ↓
      ┌──────────┐
      │Cloudflare│
      │ Workers  │  ← APIキー管理
      └─────┬────┘
            │
            ↓
      ┌──────────┐
      │OpenAI API│
      │- Chat    │
      │- Whisper │  ← オプション
      │- TTS     │  ← オプション
      └──────────┘
```

---

## 📦 削除するコンポーネント

### 1. バックエンドサーバー（完全削除）

**削除対象ファイル:**
```
server/
├── _core/
│   ├── index.ts                 # Expressサーバー
│   ├── trpc.ts                  # tRPC設定
│   ├── trpc-router.ts           # ルーター統合
│   ├── llm.ts                   # LLM統合（一部ロジックは移植）
│   ├── textToSpeech.ts          # TTS機能（移植）
│   └── voiceTranscription.ts    # STT機能（移植）
├── routers/
│   ├── chat.ts                  # チャットルーター
│   ├── voice.ts                 # 音声ルーター
│   ├── memory.ts                # 記憶ルーター
│   ├── tts.ts                   # TTSルーター
│   └── proactive-message.ts     # 自発的メッセージルーター
└── README.md
```

**削除理由:**
- すべての処理をクライアント側で実行
- LLM APIは直接呼び出し（Cloudflare Workers経由）

### 2. tRPCクライアント

**削除対象ファイル:**
```
lib/trpc.ts                      # tRPCクライアント設定
```

**置き換え:**
- 直接HTTP fetch呼び出し（Cloudflare Workers経由）

### 3. データベース関連

**削除対象:**
- MySQL/PostgreSQL接続
- Drizzle ORM設定

**置き換え:**
- AsyncStorage（軽量データ）
- SQLite（オプション、複雑なクエリが必要な場合）

---

## 🆕 新規追加するコンポーネント

### 1. Cloudflare Workers プロキシ

**ファイル:** `cloudflare-worker/index.js`

```javascript
// Cloudflare Workers
export default {
  async fetch(request, env) {
    const { pathname } = new URL(request.url);
    
    // CORS設定
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    // チャットエンドポイント
    if (pathname === '/api/chat' && request.method === 'POST') {
      const body = await request.json();
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: body.messages,
          temperature: 0.7,
        }),
      });
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 音声認識エンドポイント（オプション）
    if (pathname === '/api/transcribe' && request.method === 'POST') {
      const formData = await request.formData();
      
      const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: formData,
      });
      
      const data = await response.json();
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // 音声合成エンドポイント（オプション）
    if (pathname === '/api/tts' && request.method === 'POST') {
      const body = await request.json();
      
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'nova',
          input: body.text,
        }),
      });
      
      const audioBuffer = await response.arrayBuffer();
      return new Response(audioBuffer, {
        headers: { ...corsHeaders, 'Content-Type': 'audio/mpeg' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
};
```

**環境変数設定:**
```bash
# Cloudflare Workersの環境変数
OPENAI_API_KEY=sk-...
```

**デプロイ:**
```bash
# Cloudflare Workers CLI (Wrangler)
npm install -g wrangler
wrangler login
wrangler deploy
```

**コスト:**
- 無料枠: 100,000リクエスト/日
- 有料プラン: $5/月（10,000,000リクエスト）

### 2. ローカルAPIクライアント

**ファイル:** `lib/api-client.ts`

```typescript
import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'https://your-worker.workers.dev';

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  message: string;
}

/**
 * チャットメッセージを送信してAI応答を取得
 */
export async function sendChatMessage(messages: ChatMessage[]): Promise<ChatResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messages }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      message: data.choices[0].message.content,
    };
  } catch (error) {
    console.error('Chat API error:', error);
    throw error;
  }
}

/**
 * 音声ファイルをテキストに変換（オプション：Expo Speechを使う場合は不要）
 */
export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('file', {
      uri: audioUri,
      type: 'audio/m4a',
      name: 'audio.m4a',
    } as any);
    formData.append('model', 'whisper-1');

    const response = await fetch(`${API_BASE_URL}/api/transcribe`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription error: ${response.status}`);
    }

    const data = await response.json();
    return data.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw error;
  }
}

/**
 * テキストを音声に変換（オプション：Expo Speechを使う場合は不要）
 */
export async function textToSpeech(text: string): Promise<string> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`TTS error: ${response.status}`);
    }

    // 音声データをBlobとして取得
    const blob = await response.blob();
    
    // Expo FileSystemに保存
    const FileSystem = await import('expo-file-system');
    const audioPath = `${FileSystem.documentDirectory}tts_${Date.now()}.mp3`;
    
    // BlobをBase64に変換して保存
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const base64 = base64data.split(',')[1];
        
        await FileSystem.writeAsStringAsync(audioPath, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        resolve(audioPath);
      };
      reader.onerror = reject;
    });
  } catch (error) {
    console.error('TTS error:', error);
    throw error;
  }
}
```

### 3. ローカル音声処理（Expo Speech使用）

**ファイル:** `lib/local-speech.ts`

```typescript
import * as Speech from 'expo-speech';
import * as ExpoSpeech from 'expo-speech-recognition';

/**
 * テキストを音声で読み上げ（Expo Speech使用）
 */
export async function speakText(text: string): Promise<void> {
  try {
    await Speech.speak(text, {
      language: 'ja-JP',
      pitch: 1.2,      // 少し高めの声（猫っぽい）
      rate: 1.0,       // 通常速度
    });
  } catch (error) {
    console.error('Speech error:', error);
    throw error;
  }
}

/**
 * 音声認識を開始（Expo Speech Recognition使用）
 */
export async function startSpeechRecognition(): Promise<string> {
  try {
    // 権限チェック
    const { status } = await ExpoSpeech.requestPermissionsAsync();
    if (status !== 'granted') {
      throw new Error('Speech recognition permission denied');
    }

    // 音声認識開始
    const result = await ExpoSpeech.recognizeAsync({
      lang: 'ja-JP',
    });

    return result.transcription || '';
  } catch (error) {
    console.error('Speech recognition error:', error);
    throw error;
  }
}
```

**注意:** Expo Speech Recognitionはまだ実験的機能のため、OpenAI Whisper APIを使う方が安定している場合があります。

---

## 🔧 変更が必要なファイル

### 1. チャット画面

**ファイル:** `app/(tabs)/index.tsx`

**変更内容:**
```typescript
// 変更前
import { trpc } from "@/lib/trpc";

const chatMutation = trpc.chat.sendMessage.useMutation();
const response = await chatMutation.mutateAsync({ ... });

// 変更後
import { sendChatMessage } from "@/lib/api-client";
import { getMemories } from "@/lib/memory-storage";
import { searchRelevantConversations } from "@/lib/conversation-search";

const response = await sendChatMessage([
  {
    role: 'system',
    content: '猫キャラクター「ミケ」のシステムプロンプト...',
  },
  ...relevantMemories.map(m => ({
    role: 'system' as const,
    content: `記憶: ${m.content}`,
  })),
  ...relevantConversations,
  ...recentMessages.map(m => ({
    role: m.role,
    content: m.content,
  })),
  {
    role: 'user',
    content: userMessage,
  },
]);
```

### 2. 音声入力

**ファイル:** `components/voice-input-button.tsx`

**オプション1: Expo Speechを使う（無料、オフライン）**
```typescript
import { startSpeechRecognition } from "@/lib/local-speech";

const handleVoiceInput = async () => {
  try {
    const transcription = await startSpeechRecognition();
    onTranscriptionComplete(transcription);
  } catch (error) {
    console.error('Voice input error:', error);
  }
};
```

**オプション2: OpenAI Whisperを使う（有料、高品質）**
```typescript
import { transcribeAudio } from "@/lib/api-client";
import { audioRecorder } from "@/lib/audio-recorder";

const handleVoiceInput = async () => {
  try {
    // 録音開始
    await audioRecorder.start();
    
    // ユーザーが録音停止するまで待機
    // ...
    
    // 録音停止
    const audioUri = await audioRecorder.stop();
    
    // 文字起こし
    const transcription = await transcribeAudio(audioUri);
    onTranscriptionComplete(transcription);
  } catch (error) {
    console.error('Voice input error:', error);
  }
};
```

### 3. 音声読み上げ

**ファイル:** `app/(tabs)/index.tsx`

**オプション1: Expo Speechを使う（無料、オフライン）**
```typescript
import { speakText } from "@/lib/local-speech";

const playTTS = async (text: string) => {
  try {
    await speakText(text);
  } catch (error) {
    console.error('TTS error:', error);
  }
};
```

**オプション2: OpenAI TTSを使う（有料、高品質）**
```typescript
import { textToSpeech } from "@/lib/api-client";
import { useAudioPlayer } from 'expo-audio';

const playTTS = async (text: string) => {
  try {
    const audioPath = await textToSpeech(text);
    const player = useAudioPlayer(audioPath);
    player.play();
  } catch (error) {
    console.error('TTS error:', error);
  }
};
```

### 4. 記憶抽出

**ファイル:** `app/(tabs)/index.tsx`

**変更内容:**
```typescript
// 変更前
const memoryMutation = trpc.memory.extractMemories.useMutation();
await memoryMutation.mutateAsync({ ... });

// 変更後
import { sendChatMessage } from "@/lib/api-client";
import { saveMemories } from "@/lib/memory-storage";

const extractMemories = async (conversation: string) => {
  const response = await sendChatMessage([
    {
      role: 'system',
      content: '会話から重要な記憶を抽出してJSON形式で返してください...',
    },
    {
      role: 'user',
      content: conversation,
    },
  ]);
  
  const memories = JSON.parse(response.message);
  await saveMemories(memories);
};
```

### 5. 自発的メッセージ生成

**ファイル:** `lib/proactive-notification-scheduler.ts`

**変更内容:**
```typescript
// 変更前
const messageMutation = trpc.proactiveMessage.generate.useMutation();
const message = await messageMutation.mutateAsync();

// 変更後
import { sendChatMessage } from "@/lib/api-client";
import { getMemories } from "@/lib/memory-storage";

const generateProactiveMessage = async () => {
  const memories = await getMemories();
  const hour = new Date().getHours();
  
  let greeting = 'こんにちは';
  if (hour < 12) greeting = 'おはよう';
  else if (hour < 18) greeting = 'こんにちは';
  else greeting = 'こんばんは';
  
  const response = await sendChatMessage([
    {
      role: 'system',
      content: '猫キャラクター「ミケ」として、記憶を元に自発的に話しかけてください...',
    },
    ...memories.slice(0, 5).map(m => ({
      role: 'system' as const,
      content: `記憶: ${m.content}`,
    })),
    {
      role: 'user',
      content: `${greeting}、何か話しかけてにゃ`,
    },
  ]);
  
  return response.message;
};
```

---

## 💰 マネタイズ戦略

### フリーミアム + BYOK のハイブリッド

```
┌─────────────────────────┐
│   無料プラン              │
│   - 1日10会話まで         │
│   - Expo Speech使用      │
│   - 広告表示（オプション） │
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│   プレミアム $4.99/月     │
│   - 無制限会話            │
│   - OpenAI TTS使用       │
│   - 広告なし              │
└─────────────────────────┘
            ↓
┌─────────────────────────┐
│   BYOK（上級者向け）      │
│   - 自分のAPIキーを使用   │
│   - 完全無料              │
└─────────────────────────┘
```

### 実装方法

**1. 会話回数制限**

**ファイル:** `lib/usage-limiter.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const DAILY_LIMIT_FREE = 10;
const STORAGE_KEY = 'daily_usage';

export interface DailyUsage {
  date: string;
  count: number;
}

/**
 * 今日の使用回数を取得
 */
export async function getTodayUsage(): Promise<number> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    
    if (!stored) return 0;
    
    const usage: DailyUsage = JSON.parse(stored);
    
    // 日付が変わったらリセット
    if (usage.date !== today) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, count: 0 }));
      return 0;
    }
    
    return usage.count;
  } catch (error) {
    console.error('Failed to get usage:', error);
    return 0;
  }
}

/**
 * 使用回数を増やす
 */
export async function incrementUsage(): Promise<void> {
  try {
    const today = new Date().toISOString().split('T')[0];
    const count = await getTodayUsage();
    
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({
      date: today,
      count: count + 1,
    }));
  } catch (error) {
    console.error('Failed to increment usage:', error);
  }
}

/**
 * 使用制限をチェック
 */
export async function checkUsageLimit(isPremium: boolean): Promise<boolean> {
  if (isPremium) return true;
  
  const count = await getTodayUsage();
  return count < DAILY_LIMIT_FREE;
}
```

**2. プレミアム機能管理**

**ファイル:** `lib/premium-manager.ts`

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as InAppPurchases from 'expo-in-app-purchases';

const PREMIUM_KEY = 'is_premium';
const BYOK_KEY = 'byok_api_key';

/**
 * プレミアムステータスを確認
 */
export async function isPremiumUser(): Promise<boolean> {
  try {
    const premium = await AsyncStorage.getItem(PREMIUM_KEY);
    return premium === 'true';
  } catch (error) {
    return false;
  }
}

/**
 * プレミアムステータスを設定
 */
export async function setPremiumStatus(isPremium: boolean): Promise<void> {
  await AsyncStorage.setItem(PREMIUM_KEY, isPremium ? 'true' : 'false');
}

/**
 * BYOK APIキーを取得
 */
export async function getBYOKApiKey(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(BYOK_KEY);
  } catch (error) {
    return null;
  }
}

/**
 * BYOK APIキーを設定
 */
export async function setBYOKApiKey(apiKey: string): Promise<void> {
  await AsyncStorage.setItem(BYOK_KEY, apiKey);
}

/**
 * アプリ内課金を初期化
 */
export async function initializeIAP(): Promise<void> {
  try {
    await InAppPurchases.connectAsync();
    
    // 購入履歴を確認
    const { results } = await InAppPurchases.getPurchaseHistoryAsync();
    
    // プレミアムプランの購入があるかチェック
    const hasPremium = results.some(p => p.productId === 'premium_monthly');
    await setPremiumStatus(hasPremium);
  } catch (error) {
    console.error('IAP initialization error:', error);
  }
}

/**
 * プレミアムプランを購入
 */
export async function purchasePremium(): Promise<boolean> {
  try {
    await InAppPurchases.purchaseItemAsync('premium_monthly');
    await setPremiumStatus(true);
    return true;
  } catch (error) {
    console.error('Purchase error:', error);
    return false;
  }
}
```

**3. 設定画面に追加**

**ファイル:** `app/(tabs)/settings.tsx`

```typescript
import { isPremiumUser, purchasePremium, getBYOKApiKey, setBYOKApiKey } from "@/lib/premium-manager";

export default function SettingsScreen() {
  const [isPremium, setIsPremium] = useState(false);
  const [byokKey, setBYOKKey] = useState('');
  
  useEffect(() => {
    (async () => {
      const premium = await isPremiumUser();
      setIsPremium(premium);
      
      const key = await getBYOKApiKey();
      if (key) setBYOKKey(key);
    })();
  }, []);
  
  const handlePurchase = async () => {
    const success = await purchasePremium();
    if (success) {
      setIsPremium(true);
      Alert.alert('成功', 'プレミアムプランに登録しました！');
    }
  };
  
  const handleSaveBYOK = async () => {
    await setBYOKApiKey(byokKey);
    Alert.alert('成功', 'APIキーを保存しました');
  };
  
  return (
    <ScreenContainer>
      {/* プレミアムプラン */}
      {!isPremium && (
        <View className="bg-surface p-4 rounded-lg mb-4">
          <Text className="text-lg font-bold text-foreground mb-2">
            プレミアムプラン 🌟
          </Text>
          <Text className="text-muted mb-4">
            無制限会話 + 高品質音声 + 広告なし
          </Text>
          <TouchableOpacity
            onPress={handlePurchase}
            className="bg-primary px-6 py-3 rounded-full"
          >
            <Text className="text-background font-semibold text-center">
              ¥490/月で登録
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* BYOK設定 */}
      <View className="bg-surface p-4 rounded-lg">
        <Text className="text-lg font-bold text-foreground mb-2">
          上級者向け: 自分のAPIキー 🔑
        </Text>
        <Text className="text-muted mb-4">
          OpenAI APIキーを設定すると完全無料で使用できます
        </Text>
        <TextInput
          value={byokKey}
          onChangeText={setBYOKKey}
          placeholder="sk-..."
          secureTextEntry
          className="bg-background p-3 rounded-lg mb-2"
        />
        <TouchableOpacity
          onPress={handleSaveBYOK}
          className="bg-primary px-6 py-3 rounded-full"
        >
          <Text className="text-background font-semibold text-center">
            保存
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
```

---

## 📊 コスト試算

### Cloudflare Workers

| プラン | リクエスト数 | 価格 |
|--------|-------------|------|
| 無料 | 100,000/日 | $0 |
| 有料 | 10,000,000/月 | $5/月 |

### OpenAI API（ユーザー負担に転嫁）

| サービス | 価格 | 使用量目安 |
|---------|------|-----------|
| GPT-4 | $0.03/1K tokens | 1会話 = 約500 tokens = $0.015 |
| Whisper | $0.006/分 | 1分の音声 = $0.006 |
| TTS | $0.015/1K文字 | 100文字の応答 = $0.0015 |

**1ユーザー/月のコスト:**
- 100会話 × $0.015 = $1.50
- 50回の音声入力 × $0.006 = $0.30
- 100回のTTS × $0.0015 = $0.15
- **合計: 約$2.00/月**

**収益シミュレーション（1,000ユーザー）:**
- 無料ユーザー: 900人（コスト: $0）
- プレミアム: 100人（収益: $499/月、コスト: $200）
- **純利益: 約$300/月**

---

## 🚀 実装ロードマップ

### フェーズ1: Cloudflare Workers構築（1週間）

- [ ] Cloudflare Workersアカウント作成
- [ ] プロキシコードの実装
- [ ] OpenAI APIキーの設定
- [ ] デプロイとテスト

### フェーズ2: クライアント側の変更（2週間）

- [ ] `lib/api-client.ts`の実装
- [ ] `lib/local-speech.ts`の実装（Expo Speech）
- [ ] tRPCクライアントの削除
- [ ] チャット画面の変更
- [ ] 音声入力の変更
- [ ] 音声読み上げの変更
- [ ] 記憶抽出の変更
- [ ] 自発的メッセージ生成の変更

### フェーズ3: バックエンド削除（1週間）

- [ ] `server/`ディレクトリの削除
- [ ] `package.json`から不要な依存関係を削除
- [ ] ビルドスクリプトの更新
- [ ] テストの更新

### フェーズ4: マネタイズ実装（1週間）

- [ ] `lib/usage-limiter.ts`の実装
- [ ] `lib/premium-manager.ts`の実装
- [ ] `expo-in-app-purchases`の統合
- [ ] 設定画面にプレミアム機能を追加
- [ ] BYOK機能の実装

### フェーズ5: テストとデバッグ（1週間）

- [ ] 全機能の動作確認
- [ ] 実機テスト（iOS/Android）
- [ ] パフォーマンステスト
- [ ] バグ修正

### フェーズ6: App Store申請（1-2週間）

- [ ] App Store Connectアカウント作成
- [ ] アプリアイコン・スクリーンショット準備
- [ ] プライバシーポリシー作成
- [ ] 審査提出
- [ ] 審査対応

**合計期間: 約7-8週間**

---

## ⚠️ 注意事項

### セキュリティ

1. **APIキーの管理**
   - Cloudflare Workersの環境変数に保存
   - アプリには絶対に埋め込まない
   - BYOK機能ではユーザーのキーを暗号化して保存

2. **データプライバシー**
   - すべてのデータはデバイスに保存
   - OpenAI APIへの通信のみ外部送信
   - プライバシーポリシーに明記

### App Store審査対策

1. **プライバシーポリシー必須**
   - データはすべてローカル保存
   - OpenAI APIへの通信のみ明記
   - ユーザーの同意を取得

2. **アプリ内課金の設定**
   - App Store Connect で商品登録
   - 自動更新サブスクリプション
   - 価格: ¥490/月（$4.99/月）

3. **年齢制限**
   - 4+（すべての年齢）
   - コンテンツフィルタリング不要

---

## 📚 参考資料

### Cloudflare Workers
- [公式ドキュメント](https://developers.cloudflare.com/workers/)
- [料金プラン](https://developers.cloudflare.com/workers/platform/pricing/)

### OpenAI API
- [API リファレンス](https://platform.openai.com/docs/api-reference)
- [料金](https://openai.com/pricing)

### Expo
- [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/)
- [Expo In-App Purchases](https://docs.expo.dev/versions/latest/sdk/in-app-purchases/)
- [Expo FileSystem](https://docs.expo.dev/versions/latest/sdk/filesystem/)

### App Store
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase](https://developer.apple.com/in-app-purchase/)

---

**最終更新**: 2026年1月2日  
**ドキュメントバージョン**: 1.0
