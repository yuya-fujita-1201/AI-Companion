# 記憶画面リデザイン（ミケが覚えたこと）

## 変更概要
- 記憶カテゴリをユーザーフレンドリーな表現に刷新（あなたのこと／好きなもの／思い出／最近の話題）
- 「ミケが覚えたこと 🐱」ヘッダー＋記憶総数メッセージを追加
- 記憶数に応じた「ミケの知識レベル」進捗バーとマイルストーン表示を追加
- 記憶カードにアイコン・重要度バー・日付表示を追加（250msフェードイン）
- 空状態メッセージを温かいトーンに更新

## 進捗ロジック
- レベルは10件ごとに上昇（`lib/memory-progress.ts`）
- `calculateMemoryProgress()` が `level / progress / remaining / nextLevelAt / isLevelUp` を返す

## 影響ファイル
- `types/memory.ts`
- `components/memory-card.tsx`
- `app/(tabs)/memories.tsx`
- `lib/memory-progress.ts`
- `__tests__/memory-progress.test.ts`
- `todo.md`

## テスト
- `pnpm test memory`

## スクリーンショット
- 実機/シミュレータで「記憶」タブを開き、記憶リストと空状態を撮影して添付してください。
