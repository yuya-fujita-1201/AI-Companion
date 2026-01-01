/**
 * Cloudflare Workers プロキシのテストスクリプト
 * 
 * 使用方法:
 * 1. ローカル開発サーバーを起動: wrangler dev
 * 2. 別のターミナルでテストを実行: npm test
 * 
 * または本番環境のテスト:
 * node test/test.js https://your-worker.workers.dev
 */

const BASE_URL = process.argv[2] || 'http://localhost:8787';

console.log(`Testing Cloudflare Workers proxy at: ${BASE_URL}\n`);

/**
 * テストヘルパー関数
 */
async function runTest(name, testFn) {
  try {
    console.log(`🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASS: ${name}\n`);
  } catch (error) {
    console.error(`❌ FAIL: ${name}`);
    console.error(`   Error: ${error.message}\n`);
  }
}

/**
 * テスト1: ヘルスチェック
 */
async function testHealthCheck() {
  const response = await fetch(`${BASE_URL}/health`);
  const data = await response.json();
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}`);
  }
  
  if (data.status !== 'ok') {
    throw new Error(`Expected status 'ok', got '${data.status}'`);
  }
  
  console.log(`   Response: ${JSON.stringify(data)}`);
}

/**
 * テスト2: チャットエンドポイント（正常系）
 */
async function testChatSuccess() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'あなたは猫のミケです。語尾に「にゃ」をつけて話します。' },
        { role: 'user', content: 'こんにちは！' },
      ],
    }),
  });
  
  const data = await response.json();
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}: ${JSON.stringify(data)}`);
  }
  
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response structure');
  }
  
  console.log(`   AI Response: ${data.choices[0].message.content}`);
  console.log(`   Tokens used: ${data.usage.total_tokens}`);
}

/**
 * テスト3: チャットエンドポイント（エラー系 - messagesなし）
 */
async function testChatError() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });
  
  const data = await response.json();
  
  if (response.status !== 400) {
    throw new Error(`Expected status 400, got ${response.status}`);
  }
  
  if (!data.error) {
    throw new Error('Expected error field in response');
  }
  
  console.log(`   Error message: ${data.error}`);
}

/**
 * テスト4: 404エラー
 */
async function testNotFound() {
  const response = await fetch(`${BASE_URL}/api/nonexistent`, {
    method: 'POST',
  });
  
  const data = await response.json();
  
  if (response.status !== 404) {
    throw new Error(`Expected status 404, got ${response.status}`);
  }
  
  if (data.error !== 'Not Found') {
    throw new Error(`Expected error 'Not Found', got '${data.error}'`);
  }
  
  console.log(`   Error message: ${data.error}`);
}

/**
 * テスト5: CORS対応確認
 */
async function testCORS() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'OPTIONS',
  });
  
  if (response.status !== 204) {
    throw new Error(`Expected status 204, got ${response.status}`);
  }
  
  const allowOrigin = response.headers.get('Access-Control-Allow-Origin');
  const allowMethods = response.headers.get('Access-Control-Allow-Methods');
  
  if (!allowOrigin) {
    throw new Error('Missing Access-Control-Allow-Origin header');
  }
  
  if (!allowMethods) {
    throw new Error('Missing Access-Control-Allow-Methods header');
  }
  
  console.log(`   Allow-Origin: ${allowOrigin}`);
  console.log(`   Allow-Methods: ${allowMethods}`);
}

/**
 * テスト6: モデル指定
 */
async function testCustomModel() {
  const response = await fetch(`${BASE_URL}/api/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'user', content: 'Say "test"' },
      ],
      max_tokens: 10,
    }),
  });
  
  const data = await response.json();
  
  if (response.status !== 200) {
    throw new Error(`Expected status 200, got ${response.status}: ${JSON.stringify(data)}`);
  }
  
  if (data.model !== 'gpt-4o-mini') {
    throw new Error(`Expected model 'gpt-4o-mini', got '${data.model}'`);
  }
  
  console.log(`   Model used: ${data.model}`);
  console.log(`   Response: ${data.choices[0].message.content}`);
}

/**
 * すべてのテストを実行
 */
async function runAllTests() {
  console.log('='.repeat(60));
  console.log('Cloudflare Workers Proxy - Test Suite');
  console.log('='.repeat(60));
  console.log();
  
  await runTest('Health Check', testHealthCheck);
  await runTest('Chat Endpoint - Success', testChatSuccess);
  await runTest('Chat Endpoint - Error (missing messages)', testChatError);
  await runTest('404 Not Found', testNotFound);
  await runTest('CORS Support', testCORS);
  await runTest('Custom Model', testCustomModel);
  
  console.log('='.repeat(60));
  console.log('Test suite completed!');
  console.log('='.repeat(60));
}

// テスト実行
runAllTests().catch(error => {
  console.error('Test suite failed:', error);
  process.exit(1);
});
