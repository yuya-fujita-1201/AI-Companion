# AI Companion アプリ - 次期開発タスク指示書

## 📋 プロジェクト概要

**プロジェクト名**: AI Companion（ミケ）  
**プロジェクトタイプ**: React Native モバイルアプリ (Expo SDK 54)  
**GitHubリポジトリ**: https://github.com/yuya-fujita-1201/AI-Companion.git  
**コンセプト**: 「どこでもいっしょ」風の猫キャラクター「ミケ」と会話して育てていくAIコンパニオンアプリ

### 技術スタック
- **フロントエンド**: React Native 0.81, Expo Router 6, TypeScript 5.9
- **スタイリング**: NativeWind 4 (Tailwind CSS)
- **アニメーション**: react-native-reanimated 4.x
- **状態管理**: React Context + AsyncStorage
- **バックエンド**: Express + tRPC + LLM API (サーバー内蔵)
- **音声**: expo-audio (録音・再生)
- **通知**: expo-notifications

### 現在の実装状況
✅ チャット機能（テキスト・音声入力）  
✅ AI応答の音声読み上げ（TTS）  
✅ 記憶システム（自動抽出・保存・検索）  
✅ 猫キャラクター「ミケ」のペルソナ（「〜だにゃ」語尾）  
✅ 感情表現とアニメーション（7種類の表情）  
✅ プッシュ通知（1日数回の自発的な話しかけ）  
✅ なかよし度システム（会話回数ベース）

---

## 🎯 優先度別タスクリスト

### 【優先度: 高】記憶画面のリデザイン

**目的**: 記憶を「ミケが覚えたこと」として、よりキャラクターアプリらしく可視化する

**現状の問題点**:
- 現在の記憶画面は機能的だが、キャラクターアプリとしての温かみが不足
- カテゴリが技術的（FACT, PREFERENCE, EVENT）で、ユーザーフレンドリーではない
- 記憶の成長感や達成感が感じられない

**実装要件**:

1. **カテゴリの再定義**
   - `FACT` → 「あなたのこと」（名前、誕生日、仕事など）
   - `PREFERENCE` → 「好きなもの」（食べ物、趣味、音楽など）
   - `EVENT` → 「思い出」（一緒に話したこと、特別な出来事）
   - `CONVERSATION_SUMMARY` → 「最近の話題」

2. **UI/UXの改善**
   - ヘッダーに「ミケが覚えたこと 🐱」というタイトル
   - 記憶の総数を表示（例: 「ミケは〇〇個のことを覚えているにゃ！」）
   - カテゴリごとにアイコンを追加:
     - あなたのこと: 👤
     - 好きなもの: ❤️
     - 思い出: 📖
     - 最近の話題: 💬
   - 記憶カードに日付と重要度を視覚的に表示
   - 空の状態（記憶がない場合）に温かいメッセージを表示

3. **成長の可視化**
   - 記憶の数に応じた進捗バー（例: 10個ごとにレベルアップ）
   - マイルストーン達成時のお祝いメッセージ
   - 「ミケの知識レベル」のような表現

**ファイル構成**:
```
app/(tabs)/memories.tsx          # メイン画面（要修正）
components/memory-card.tsx       # 記憶カードコンポーネント（要修正）
types/memory.ts                  # 型定義（カテゴリ名の変更）
lib/memory-storage.ts            # ストレージロジック（変更不要）
```

**実装手順**:
1. `types/memory.ts`のカテゴリ定義を更新
2. `components/memory-card.tsx`にアイコンと視覚的改善を追加
3. `app/(tabs)/memories.tsx`のヘッダーと統計表示を実装
4. 空の状態のUIを追加
5. 成長の可視化（進捗バー）を実装

**デザイン指針**:
- 温かみのあるオレンジ・茶色・クリーム色の配色を維持
- 丸みを帯びたカード形式
- アニメーション: カードの表示時にフェードイン（250ms）

---

### 【優先度: 高】会話統計ダッシュボード

**目的**: ミケとの関係性を数値化・可視化し、ユーザーのエンゲージメントを高める

**実装要件**:

1. **新しいタブの追加**
   - タブ名: 「統計」または「なかよし」
   - アイコン: 📊 または ❤️
   - パス: `app/(tabs)/stats.tsx`（新規作成）

2. **表示する統計情報**
   - **総会話回数**: チャットメッセージの総数
   - **一緒にいる日数**: 初回起動からの経過日数
   - **なかよし度**: 0-100%（会話回数ベース）
   - **今週の会話回数**: 過去7日間の会話数
   - **最長連続日数**: 毎日会話した最長記録
   - **よく話すトピック**: 記憶から抽出したキーワードTOP5

3. **グラフの実装**
   - 過去7日間の会話回数の棒グラフ
   - なかよし度の円グラフ
   - ライブラリ: `react-native-svg` + `react-native-chart-kit`（既にインストール済み）

4. **マイルストーン表示**
   - 達成済みのバッジ（例: 「初めての会話」「10回会話」「毎日会話7日間」）
   - 次の目標の表示

**ファイル構成**:
```
app/(tabs)/stats.tsx             # 新規作成
app/(tabs)/_layout.tsx           # タブ追加（要修正）
components/stat-card.tsx         # 統計カードコンポーネント（新規作成）
components/milestone-badge.tsx   # バッジコンポーネント（新規作成）
lib/stats-calculator.ts          # 統計計算ロジック（新規作成）
```

**実装手順**:
1. `lib/stats-calculator.ts`を作成し、統計計算ロジックを実装
2. `components/stat-card.tsx`を作成（数値表示用）
3. `components/milestone-badge.tsx`を作成（バッジ表示用）
4. `app/(tabs)/stats.tsx`を作成し、レイアウトを実装
5. グラフを追加（`react-native-chart-kit`を使用）
6. `app/(tabs)/_layout.tsx`に新しいタブを追加

**データソース**:
- 会話履歴: `AsyncStorage.getItem("chat_messages")`
- 記憶データ: `AsyncStorage.getItem("memories")`
- 初回起動日: `AsyncStorage.getItem("first_launch_date")`（新規追加が必要）

---

### 【優先度: 中】キャラクターの成長システム

**目的**: 会話回数に応じてミケが成長し、新しい話題や反応を学習する

**実装要件**:

1. **レベルシステムの導入**
   - レベル1: 0-50回の会話（基本的な応答）
   - レベル2: 51-150回の会話（より詳細な応答、新しい語尾パターン）
   - レベル3: 151-300回の会話（複雑な話題、感情表現が豊かに）
   - レベル4: 301回以上（最高レベル、すべての機能解放）

2. **レベルに応じた変化**
   - **語尾のバリエーション**: 「だにゃ」→「にゃん」「にゃー」「だにゃん」
   - **話題の提案**: レベル2以上で「こんな話をしてみない？」と提案
   - **感情表現**: レベル3以上でより細かい感情の変化
   - **記憶の活用**: レベル4で過去の会話をより深く参照

3. **レベルアップ演出**
   - レベルアップ時にアニメーション（キラキラエフェクト）
   - お祝いメッセージ「レベルアップしたにゃ！」
   - 新しい機能の解放通知

**ファイル構成**:
```
lib/character-level.ts           # レベル計算ロジック（新規作成）
components/level-up-modal.tsx    # レベルアップモーダル（新規作成）
server/routers.ts                # システムプロンプトにレベル情報を追加（要修正）
```

**実装手順**:
1. `lib/character-level.ts`を作成し、レベル計算ロジックを実装
2. レベル情報をAsyncStorageに保存
3. `components/level-up-modal.tsx`を作成
4. `app/(tabs)/index.tsx`でレベルアップ判定を追加
5. サーバー側のシステムプロンプトにレベル情報を渡す

---

### 【優先度: 中】ダークモード対応

**目的**: ユーザーの好みに応じてライト/ダークモードを切り替え可能にする

**現状**:
- `theme.config.js`にライト/ダークの色定義は存在
- `lib/theme-provider.tsx`でテーマ管理は実装済み
- 設定画面にトグルが未実装

**実装要件**:

1. **設定画面にトグルを追加**
   - ファイル: `app/(tabs)/settings.tsx`
   - トグルの位置: 「音声設定」セクションの下
   - ラベル: 「ダークモード」

2. **テーマの永続化**
   - AsyncStorageに保存: `theme_mode` (light/dark/auto)
   - アプリ起動時に読み込み

3. **自動モード対応**
   - システムのダークモード設定に追従
   - オプション: ライト、ダーク、自動

**ファイル構成**:
```
app/(tabs)/settings.tsx          # トグル追加（要修正）
lib/theme-provider.tsx           # 永続化ロジック追加（要修正）
```

**実装手順**:
1. `app/(tabs)/settings.tsx`にダークモードトグルを追加
2. `lib/theme-provider.tsx`にAsyncStorageの読み書きを追加
3. 動作確認（全画面でテーマが正しく適用されるか）

---

### 【優先度: 低】データのエクスポート/インポート機能

**目的**: ユーザーが会話履歴と記憶をバックアップ・復元できるようにする

**実装要件**:

1. **エクスポート機能**
   - 会話履歴と記憶をJSON形式でエクスポート
   - ファイル名: `ai-companion-backup-YYYYMMDD.json`
   - 保存先: デバイスのダウンロードフォルダ
   - ライブラリ: `expo-file-system`, `expo-sharing`

2. **インポート機能**
   - JSONファイルを選択して読み込み
   - データの検証（フォーマットチェック）
   - 既存データとの統合オプション（上書き/マージ）

3. **設定画面に追加**
   - 「データ管理」セクションに2つのボタン
   - 「データをエクスポート」
   - 「データをインポート」

**ファイル構成**:
```
lib/data-export.ts               # エクスポートロジック（新規作成）
lib/data-import.ts               # インポートロジック（新規作成）
app/(tabs)/settings.tsx          # ボタン追加（要修正）
```

**実装手順**:
1. `lib/data-export.ts`を作成し、エクスポートロジックを実装
2. `lib/data-import.ts`を作成し、インポートロジックを実装
3. `app/(tabs)/settings.tsx`にボタンを追加
4. エラーハンドリングと確認ダイアログを実装

---

## 🛠️ 開発環境のセットアップ

### 前提条件
- Node.js 22.13.0
- pnpm 9.12.0
- Git

### セットアップ手順

```bash
# リポジトリをクローン
git clone https://github.com/yuya-fujita-1201/AI-Companion.git
cd AI-Companion

# 依存関係をインストール
pnpm install

# 開発サーバーを起動
pnpm dev

# 別のターミナルでテストを実行
pnpm test
```

### ディレクトリ構造

```
ai-companion-app/
├── app/                         # Expo Router画面
│   ├── (tabs)/                  # タブナビゲーション
│   │   ├── index.tsx            # チャット画面
│   │   ├── memories.tsx         # 記憶画面
│   │   └── settings.tsx         # 設定画面
│   └── _layout.tsx              # ルートレイアウト
├── components/                  # 再利用可能なコンポーネント
│   ├── message-bubble.tsx       # メッセージ吹き出し
│   ├── memory-card.tsx          # 記憶カード
│   └── character-status.tsx     # キャラクター状態表示
├── lib/                         # ユーティリティとヘルパー
│   ├── memory-storage.ts        # 記憶の保存・読み込み
│   ├── notification-manager.ts  # 通知管理
│   └── emotion-analyzer.ts      # 感情分析
├── server/                      # バックエンドAPI
│   ├── routers/                 # tRPCルーター
│   │   ├── chat.ts              # チャットAPI
│   │   ├── memory.ts            # 記憶API
│   │   └── tts.ts               # 音声読み上げAPI
│   └── _core/                   # コア機能
│       ├── llm.ts               # LLM統合
│       └── textToSpeech.ts      # TTS機能
├── types/                       # TypeScript型定義
│   ├── chat.ts                  # チャット関連の型
│   └── memory.ts                # 記憶関連の型
├── assets/images/               # 画像アセット
│   ├── cat-character.png        # キャラクター画像
│   └── cat-character-*.png      # 表情バリエーション
└── __tests__/                   # テストファイル
```

---

## 📝 コーディング規約

### TypeScript
- 厳格な型チェックを使用（`strict: true`）
- `any`型の使用は最小限に
- インターフェースよりも型エイリアスを優先

### React Native / Expo
- 関数コンポーネントとHooksを使用
- `ScreenContainer`コンポーネントで画面をラップ
- NativeWind (Tailwind CSS) でスタイリング
- `className`を使用（`style`プロパティは最小限に）

### スタイリング
- Tailwind CSS クラスを使用
- カスタムカラー: `primary`, `background`, `foreground`, `muted`, `surface`, `border`
- ダークモード: 色トークンを直接使用（`dark:`プレフィックス不要）

### 命名規則
- コンポーネント: PascalCase（例: `MessageBubble`）
- 関数: camelCase（例: `handleSendMessage`）
- ファイル: kebab-case（例: `message-bubble.tsx`）
- 定数: UPPER_SNAKE_CASE（例: `MAX_MESSAGE_LENGTH`）

### テスト
- Vitestを使用
- ファイル名: `*.test.ts`
- カバレッジ目標: 主要ロジックは80%以上

---

## 🚀 デプロイとテスト

### テストの実行

```bash
# すべてのテストを実行
pnpm test

# 特定のテストファイルを実行
pnpm test memory

# ウォッチモード
pnpm test --watch
```

### ビルド

```bash
# プロダクションビルド
pnpm build

# 型チェック
pnpm check

# リンター
pnpm lint
```

### 実機テスト

1. Expo Goアプリをインストール（iOS/Android）
2. 開発サーバーのQRコードをスキャン
3. アプリが実機で起動

---

## 📚 参考資料

### 公式ドキュメント
- [Expo Documentation](https://docs.expo.dev/)
- [React Native Documentation](https://reactnative.dev/)
- [NativeWind Documentation](https://www.nativewind.dev/)
- [tRPC Documentation](https://trpc.io/)

### プロジェクト固有のドキュメント
- `README.md`: プロジェクト全体の概要
- `design.md`: UI/UXデザインの設計書
- `todo.md`: 現在のタスクリスト
- `server/README.md`: バックエンドAPIのドキュメント

---

## ⚠️ 注意事項

### 必ず守ること
1. **todo.mdの更新**: タスク完了時は必ず`[ ]`を`[x]`に変更
2. **型安全性**: TypeScriptの型エラーは必ず解決
3. **テストの実行**: 変更後は必ずテストを実行
4. **コミットメッセージ**: 明確で具体的なメッセージを記述
5. **既存機能の破壊**: 既存の動作を壊さないこと

### 避けるべきこと
1. **直接的なgit操作**: `webdev_save_checkpoint`を使用
2. **ハードコーディング**: 設定値は定数化
3. **過度な最適化**: 動作確認が優先
4. **無駄な依存関係**: 新しいパッケージは慎重に
5. **グローバル状態の乱用**: 必要最小限に

---

## 🤝 コンペ形式での開発について

### タスクの選択
- 上記のタスクから1つ以上を選択して実装してください
- 優先度が高いものから取り組むことを推奨します
- 複数のタスクを組み合わせても構いません

### 提出物
1. **実装コード**: 変更したすべてのファイル
2. **テストコード**: 新機能のテスト
3. **ドキュメント**: 実装内容の説明（Markdown形式）
4. **スクリーンショット**: UI変更がある場合

### 評価基準
- **機能の完成度**: 要件を満たしているか
- **コード品質**: 読みやすく保守しやすいか
- **テストカバレッジ**: 適切にテストされているか
- **デザイン**: UIが美しく使いやすいか
- **パフォーマンス**: 動作が快適か

---

## 📞 質問・サポート

- **GitHub Issues**: https://github.com/yuya-fujita-1201/AI-Companion/issues
- **プロジェクトオーナー**: @yuya-fujita-1201

---

**最終更新**: 2026年1月2日  
**ドキュメントバージョン**: 1.0
