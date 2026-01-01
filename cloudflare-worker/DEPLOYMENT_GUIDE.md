# Cloudflare Workers デプロイ & トラブルシューティングガイド

## 📋 目次

1. [デプロイ前のチェックリスト](#デプロイ前のチェックリスト)
2. [本番環境へのデプロイ](#本番環境へのデプロイ)
3. [デプロイ後の確認](#デプロイ後の確認)
4. [カスタムドメインの設定](#カスタムドメインの設定)
5. [モニタリングとログ](#モニタリングとログ)
6. [トラブルシューティング](#トラブルシューティング)
7. [ロールバック手順](#ロールバック手順)

---

## デプロイ前のチェックリスト

デプロイを実行する前に、以下の項目を確認してください。

### ✅ 必須項目

- [ ] Cloudflareアカウントにログイン済み（`wrangler whoami`で確認）
- [ ] OpenAI APIキーが環境変数に設定済み（`wrangler secret list`で確認）
- [ ] ローカルテストが成功している（`npm test`）
- [ ] `wrangler.toml`の設定が正しい（Worker名、互換性日付など）
- [ ] OpenAI APIの課金設定が完了している

### ✅ 推奨項目

- [ ] 使用量アラートを設定済み（Cloudflare & OpenAI）
- [ ] エラー通知を設定済み
- [ ] バックアップ用のAPIキーを準備済み
- [ ] モバイルアプリ側の接続先URLを更新する準備ができている

---

## 本番環境へのデプロイ

### ステップ1: 最終確認

デプロイ前に、コードに問題がないか最終確認を行います。

```bash
# ローカルテストを実行
npm run dev
```

別のターミナルで：

```bash
# テストスイートを実行
npm test
```

すべてのテストが成功することを確認してください。

### ステップ2: デプロイコマンドの実行

以下のコマンドで本番環境にデプロイします。

```bash
npm run deploy
```

または：

```bash
npx wrangler deploy
```

デプロイが開始されると、以下のような出力が表示されます。

```
 ⛅️ wrangler 3.x.x
-------------------
Total Upload: xx.xx KiB / gzip: xx.xx KiB
Uploaded ai-companion-proxy (x.xx sec)
Published ai-companion-proxy (x.xx sec)
  https://ai-companion-proxy.your-subdomain.workers.dev
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

**重要**: 表示された公開URLをメモしてください。この URLをモバイルアプリの設定に使用します。

### ステップ3: デプロイの確認

デプロイが成功したら、すぐに動作確認を行います。

```bash
# ヘルスチェック
curl https://ai-companion-proxy.your-subdomain.workers.dev/health
```

期待される出力：

```json
{
  "status": "ok",
  "timestamp": 1234567890
}
```

次に、チャットエンドポイントをテストします。

```bash
curl -X POST https://ai-companion-proxy.your-subdomain.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "テスト"}
    ]
  }'
```

正常なレスポンスが返れば、デプロイ成功です。

---

## デプロイ後の確認

### 1. Cloudflareダッシュボードでの確認

1. Cloudflareダッシュボード（https://dash.cloudflare.com/）にログイン
2. 「Workers & Pages」を選択
3. デプロイしたWorker（`ai-companion-proxy`）をクリック
4. 「Metrics」タブで以下を確認：
   - リクエスト数が増加しているか
   - エラー率が0%に近いか
   - レスポンス時間が適切か（通常100-500ms）

### 2. リアルタイムログの確認

ターミナルでリアルタイムログを表示します。

```bash
npm run tail
```

または：

```bash
npx wrangler tail
```

実際にモバイルアプリからリクエストを送信し、ログが正しく表示されることを確認してください。

### 3. エラー監視

最初の24時間は、以下の項目を重点的に監視してください。

- **エラー率**: 5%以下が理想（初期は多少高くても問題なし）
- **レスポンス時間**: 500ms以下が理想
- **リクエスト数**: 予想通りの数値か
- **OpenAI APIのエラー**: 認証エラーやレート制限エラーがないか

---

## カスタムドメインの設定

独自ドメイン（例: `api.your-domain.com`）を使用したい場合の設定手順です。

### 前提条件

- Cloudflareでドメインを管理している（DNSがCloudflareに向いている）
- ドメインの所有権を確認済み

### 設定手順

#### 方法1: ダッシュボードから設定（推奨）

1. Cloudflareダッシュボードにログイン
2. 「Workers & Pages」→ デプロイしたWorkerを選択
3. 「Triggers」タブをクリック
4. 「Custom Domains」セクションで「Add Custom Domain」をクリック
5. ドメイン名を入力（例: `api.your-domain.com`）
6. 「Add Domain」をクリック

DNSレコードが自動的に設定され、数分後にカスタムドメインが有効になります。

#### 方法2: wrangler.tomlで設定

`wrangler.toml`に以下を追加：

```toml
routes = [
  { pattern = "api.your-domain.com/*", zone_name = "your-domain.com" }
]
```

その後、再デプロイ：

```bash
npm run deploy
```

### 確認

カスタムドメインが有効になったら、以下のコマンドで確認します。

```bash
curl https://api.your-domain.com/health
```

正常なレスポンスが返れば、設定成功です。

---

## モニタリングとログ

### リアルタイムログの確認

開発中やデバッグ時には、リアルタイムログが便利です。

```bash
npx wrangler tail
```

特定のステータスコードのみをフィルタリング：

```bash
npx wrangler tail --status error
```

特定のメソッドのみをフィルタリング：

```bash
npx wrangler tail --method POST
```

### ダッシュボードでの分析

Cloudflareダッシュボードでは、以下の情報を確認できます。

#### Metricsタブ

- **Requests**: 時間別・日別のリクエスト数
- **Errors**: エラー率とエラーの種類
- **Duration**: レスポンス時間の分布
- **CPU Time**: CPU使用時間の推移

#### Logsタブ

- 最近のリクエストログ
- エラーログ
- コンソール出力（`console.log`など）

### アラート設定

使用量やエラー率が一定の閾値を超えたときに通知を受け取る設定です。

1. Cloudflareダッシュボードの「Notifications」セクションにアクセス
2. 「Add」をクリック
3. 「Workers」カテゴリを選択
4. 通知条件を設定：
   - **リクエスト数**: 80,000/日を超えた場合
   - **エラー率**: 10%を超えた場合
   - **CPU時間**: 制限の80%を超えた場合
5. 通知先のメールアドレスを入力
6. 「Save」をクリック

---

## トラブルシューティング

### エラー1: "Authentication error" または "Incorrect API key"

**症状**: OpenAI APIへのリクエストが認証エラーで失敗する

**原因**:
- OpenAI APIキーが正しく設定されていない
- APIキーが無効または期限切れ
- APIキーの権限が不足している

**解決方法**:

1. 環境変数が設定されているか確認：

```bash
npx wrangler secret list
```

`OPENAI_API_KEY`が表示されることを確認してください。

2. OpenAIダッシュボード（https://platform.openai.com/api-keys）でAPIキーが有効か確認

3. APIキーを再設定：

```bash
npx wrangler secret put OPENAI_API_KEY
```

4. 再デプロイ：

```bash
npm run deploy
```

### エラー2: "CORS policy error"

**症状**: ブラウザまたはモバイルアプリからのリクエストがCORSエラーでブロックされる

**原因**:
- CORS設定が正しくない
- プリフライトリクエスト（OPTIONS）が正しく処理されていない

**解決方法**:

1. `src/index.js`の`corsHeaders`を確認：

```javascript
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // または特定のドメイン
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
```

2. プリフライトリクエストが正しく処理されているか確認：

```bash
curl -X OPTIONS https://your-worker.workers.dev/api/chat -v
```

ステータスコード204が返り、CORSヘッダーが含まれていることを確認してください。

3. 本番環境では、`Access-Control-Allow-Origin`を特定のドメインに制限することを推奨：

```javascript
'Access-Control-Allow-Origin': 'https://your-app-domain.com',
```

### エラー3: "Worker exceeded CPU time limit"

**症状**: リクエストが処理中にタイムアウトする

**原因**:
- Workerの処理時間が制限（無料プラン: 10ms、有料プラン: 50ms）を超えている
- 外部APIへのリクエストが遅い
- 不要な処理が含まれている

**解決方法**:

1. 処理時間を確認：

Cloudflareダッシュボードの「Metrics」タブで「Duration」を確認してください。

2. 不要な処理を削除：

```javascript
// 不要なログ出力を削除
// console.log('Debug info:', data);
```

3. 有料プランにアップグレード（月額$5）：

有料プランでは、CPU時間制限が50msに緩和されます。

### エラー4: "Rate limit exceeded"

**症状**: OpenAI APIからレート制限エラーが返される

**原因**:
- OpenAI APIの使用量が制限を超えている
- 短時間に大量のリクエストを送信している

**解決方法**:

1. OpenAIダッシュボード（https://platform.openai.com/usage）で使用量を確認

2. レート制限を確認：
   - **無料枠**: 3 RPM（リクエスト/分）
   - **有料プラン**: 60 RPM以上（プランによる）

3. モバイルアプリ側でリクエストを制限：

```typescript
// 連続リクエストを防ぐ
let lastRequestTime = 0;
const MIN_INTERVAL = 1000; // 1秒

async function sendMessage(message: string) {
  const now = Date.now();
  if (now - lastRequestTime < MIN_INTERVAL) {
    throw new Error('リクエストが早すぎます。少し待ってから再試行してください。');
  }
  lastRequestTime = now;
  
  // リクエスト送信
  // ...
}
```

4. OpenAIの有料プランにアップグレード

### エラー5: "Deployment failed"

**症状**: デプロイコマンドがエラーで失敗する

**原因**:
- Wranglerがログインしていない
- `wrangler.toml`の設定が間違っている
- Worker名が既に使用されている

**解決方法**:

1. ログイン状態を確認：

```bash
npx wrangler whoami
```

ログインしていない場合：

```bash
npx wrangler logout
npx wrangler login
```

2. `wrangler.toml`の設定を確認：

```toml
name = "ai-companion-proxy"  # ユニークな名前
main = "src/index.js"
compatibility_date = "2024-01-01"
```

3. Worker名を変更して再試行：

```toml
name = "ai-companion-proxy-v2"
```

### エラー6: "Invalid JSON response"

**症状**: OpenAI APIからのレスポンスがJSONとしてパースできない

**原因**:
- OpenAI APIがエラーを返している
- レスポンスが途中で切れている
- ネットワークエラー

**解決方法**:

1. OpenAI APIのステータスを確認：https://status.openai.com/

2. エラーハンドリングを強化：

```javascript
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  // ...
});

if (!response.ok) {
  const errorText = await response.text();
  console.error('OpenAI API error:', errorText);
  return new Response(
    JSON.stringify({ error: 'OpenAI API error', details: errorText }),
    { status: response.status, headers: corsHeaders }
  );
}

const data = await response.json();
```

3. リクエストのタイムアウトを設定：

```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒

const response = await fetch('https://api.openai.com/v1/chat/completions', {
  signal: controller.signal,
  // ...
});

clearTimeout(timeoutId);
```

---

## ロールバック手順

デプロイ後に問題が発生した場合、以前のバージョンにロールバックできます。

### 方法1: ダッシュボードからロールバック

1. Cloudflareダッシュボードにログイン
2. 「Workers & Pages」→ デプロイしたWorkerを選択
3. 「Deployments」タブをクリック
4. 以前のデプロイメントを選択
5. 「Rollback to this deployment」をクリック

### 方法2: Gitからロールバック

1. 以前のコミットに戻る：

```bash
git log --oneline  # コミット履歴を確認
git checkout <commit-hash>  # 以前のコミットに戻る
```

2. 再デプロイ：

```bash
npm run deploy
```

3. 確認後、mainブランチに戻る：

```bash
git checkout main
```

### 緊急時の対応

問題が深刻で、すぐにWorkerを停止したい場合：

1. Cloudflareダッシュボードにログイン
2. 「Workers & Pages」→ デプロイしたWorkerを選択
3. 「Settings」タブ → 「Delete」セクション
4. 「Delete Worker」をクリック

**注意**: この操作は取り消せません。Workerを再度デプロイする必要があります。

---

## ベストプラクティス

### 1. 段階的なデプロイ

大きな変更を加える場合は、以下の手順で段階的にデプロイすることを推奨します。

1. **開発環境でテスト**: `npm run dev`
2. **テストスイートを実行**: `npm test`
3. **ステージング環境にデプロイ**（別のWorker名を使用）
4. **本番環境にデプロイ**

### 2. バージョン管理

Workerの各バージョンにタグを付けて管理します。

```bash
# デプロイ前にGitタグを作成
git tag -a v1.0.0 -m "Initial production release"
git push origin v1.0.0

# デプロイ
npm run deploy
```

### 3. モニタリングの自動化

定期的にヘルスチェックを実行するスクリプトを作成します。

```bash
#!/bin/bash
# health-check.sh

URL="https://your-worker.workers.dev/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $URL)

if [ $RESPONSE -eq 200 ]; then
  echo "✅ Health check passed"
else
  echo "❌ Health check failed: HTTP $RESPONSE"
  # アラート送信（例: Slackに通知）
fi
```

cronで定期実行：

```bash
# 5分ごとに実行
*/5 * * * * /path/to/health-check.sh
```

### 4. コスト管理

使用量を定期的に確認し、予算内に収まっているか確認します。

- **Cloudflare Workers**: ダッシュボードの「Metrics」タブ
- **OpenAI API**: https://platform.openai.com/usage

---

## まとめ

このガイドに従うことで、Cloudflare Workersを安全かつ効率的にデプロイし、運用できます。

**重要なポイント**:

1. デプロイ前に必ずローカルテストを実行
2. デプロイ後は即座に動作確認
3. モニタリングとログを定期的にチェック
4. 問題が発生したら、このガイドのトラブルシューティングセクションを参照
5. 緊急時はロールバックを躊躇しない

何か問題が発生した場合は、Cloudflareのサポート（https://support.cloudflare.com/）またはOpenAIのサポート（https://help.openai.com/）に問い合わせてください。

---

**最終更新**: 2026年1月2日  
**ドキュメントバージョン**: 1.0  
**作成者**: Manus AI
