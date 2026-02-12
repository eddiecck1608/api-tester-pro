#!/usr/bin/env node
/**
 * API Provider 測試工具 (交互式繁體中文版) v3
 * 用法: node test-api-interactive.js
 */

const readline = require('readline');
const https = require('https');
const fs = require('fs');

// 顏色定義
const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const CYAN = '\x1b[36m';
const NC = '\x1b[0m';

// Provider 預設配置
const providers = {
  1: {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    baseUrl: 'https://api.moonshot.cn/v1',
    testModel: 'kimi-k2.5',
    icon: '🌙'
  },
  2: {
    id: 'openrouter',
    name: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    testModel: 'anthropic/claude-sonnet-4.5',
    icon: '🔄'
  },
  3: {
    id: 'openai',
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com/v1',
    testModel: 'gpt-4o-mini',
    icon: '🧠'
  },
  4: {
    id: 'perplexity',
    name: 'Perplexity',
    baseUrl: 'https://api.perplexity.ai',
    testModel: 'sonar-pro',
    icon: '🔍'
  },
  5: {
    id: 'custom',
    name: '自定義',
    baseUrl: null,
    testModel: null,
    icon: '⚡'
  }
};

// 創建 readline 介面
function createRL() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

// 問題詢問
function ask(rl, prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer.trim());
    });
  });
}

// 確認問題 (Y/N)
async function askConfirm(rl, prompt) {
  while (true) {
    const answer = await ask(rl, prompt);
    const lower = answer.toLowerCase();
    if (lower === 'y' || lower === 'yes') return true;
    if (lower === 'n' || lower === 'no') return false;
    console.log(`${YELLOW}⚠️  請輸入 y 或 n${NC}`);
  }
}

// 顯示輸入（方便檢查，按 Enter 後遮罩）
async function askVisible(prompt) {
  return new Promise((resolve) => {
    const stdin = process.stdin;
    const stdout = process.stdout;
    
    stdout.write(prompt);
    
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let input = '';
    let cursorPos = 0;
    
    const redraw = () => {
      // 清除該行並重新顯示
      stdout.write('\r\x1b[K');
      stdout.write(prompt);
      stdout.write(input);
      // 移動 cursor 到正確位置
      if (cursorPos < input.length) {
        stdout.write(`\x1b[${input.length - cursorPos}D`);
      }
    };
    
    const onData = (ch) => {
      ch = ch + '';
      
      switch(ch) {
        case '\n':
        case '\r':
        case '\u0004':
          stdin.setRawMode(false);
          stdin.pause();
          stdin.removeListener('data', onData);
          // 按 Enter 後用遮罩顯示
          stdout.write('\r\x1b[K');
          stdout.write(prompt);
          if (input.length > 12) {
            stdout.write(input.substring(0, 8) + '***' + input.substring(input.length - 4));
          } else {
            stdout.write('***');
          }
          stdout.write('\n');
          resolve(input);
          return;
          
        case '\u0003': // Ctrl+C
          process.exit();
          break;
          
        case '\u007f': // Backspace
        case '\b':
          if (cursorPos > 0) {
            input = input.slice(0, cursorPos - 1) + input.slice(cursorPos);
            cursorPos--;
            redraw();
          }
          break;
          
        case '\x1b[D': // Left arrow
          if (cursorPos > 0) {
            cursorPos--;
            stdout.write('\x1b[D');
          }
          break;
          
        case '\x1b[C': // Right arrow
          if (cursorPos < input.length) {
            cursorPos++;
            stdout.write('\x1b[C');
          }
          break;
          
        default:
          // 只接受可打印字符
          if (ch >= ' ' && ch <= '~') {
            input = input.slice(0, cursorPos) + ch + input.slice(cursorPos);
            cursorPos++;
            redraw();
          }
          break;
      }
    };
    
    stdin.on('data', onData);
  });
}

// 分隔線
function printLine() {
  console.log('='.repeat(60));
}

// 標題
function printHeader() {
  printLine();
  console.log('        API Provider 測試工具 (交互式 v3)');
  printLine();
  console.log('');
}

// 顯示選單
function showMenu() {
  console.log(`${CYAN}請選擇 Provider：${NC}\n`);
  
  Object.keys(providers).forEach(key => {
    const p = providers[key];
    if (key === '5') {
      console.log(`  ${key}. ${p.icon} ${p.name} (手動輸入 Base URL)`);
    } else {
      console.log(`  ${key}. ${p.icon} ${p.name}`);
      console.log(`     ${YELLOW}→ ${p.baseUrl}${NC}`);
    }
  });
  
  console.log('');
}

// HTTP 請求
async function makeRequest(url, options, postData = null) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const requestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 443,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: 15000
    };

    const req = https.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', (err) => reject(err));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('請求超時'));
    });
    
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

// 測試連接
async function testConnection(baseUrl, apiKey) {
  console.log(`\n${CYAN}🌐 測試 1: 檢查連接...${NC}`);
  
  try {
    const response = await makeRequest(
      `${baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.statusCode === 200) {
      console.log(`${GREEN}✅ 連接成功 (HTTP 200)${NC}`);
      return { ok: true, auth: true, status: 200 };
    } else if (response.statusCode === 401) {
      console.log(`${YELLOW}⚠️  連接成功，但 API Key 無效 (HTTP 401)${NC}`);
      return { ok: true, auth: false, status: 401 };
    } else if (response.statusCode === 403) {
      console.log(`${YELLOW}⚠️  連接成功，但權限不足 (HTTP 403)${NC}`);
      return { ok: true, auth: false, status: 403 };
    } else {
      console.log(`${YELLOW}⚠️  回應碼: HTTP ${response.statusCode}${NC}`);
      return { ok: true, auth: false, status: response.statusCode };
    }
  } catch (err) {
    console.log(`${RED}❌ 連接失敗: ${err.message}${NC}`);
    return { ok: false, auth: false, status: 0, error: err.message };
  }
}

// 獲取 models
async function listModels(baseUrl, apiKey) {
  console.log(`\n${CYAN}📊 測試 2: 獲取可用 Models...${NC}`);
  
  try {
    const response = await makeRequest(
      `${baseUrl}/models`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const data = JSON.parse(response.body);

    if (data.error) {
      console.log(`${RED}❌ 獲取失敗: ${data.error.message}${NC}`);
      return { ok: false, error: data.error.message };
    }

    if (data.data && Array.isArray(data.data)) {
      console.log(`${GREEN}✅ 成功獲取 ${data.data.length} 個 Models${NC}\n`);
      printLine();
      console.log('📋 可用 Models (顯示首 15 個):');
      printLine();
      
      data.data.slice(0, 15).forEach((model, i) => {
        const name = model.id || model.name || 'Unknown';
        console.log(`  ${String(i + 1).padStart(2)}. ${name}`);
      });
      
      if (data.data.length > 15) {
        console.log(`     ... 還有 ${data.data.length - 15} 個`);
      }
      
      printLine();
      return { ok: true, count: data.data.length, models: data.data.slice(0, 5).map(m => m.id || m.name) };
    }

    return { ok: false, error: '無法解析回應' };
  } catch (err) {
    console.log(`${RED}❌ 獲取失敗: ${err.message}${NC}`);
    return { ok: false, error: err.message };
  }
}

// 測試 chat completion
async function testChat(baseUrl, apiKey, model) {
  console.log(`\n${CYAN}💬 測試 3: Chat Completion...${NC}`);
  console.log(`   Model: ${YELLOW}${model}${NC}`);
  
  const postData = JSON.stringify({
    model: model,
    messages: [
      { role: 'system', content: 'You are a helpful assistant' },
      { role: 'user', content: 'Say "API test successful" in Chinese' }
    ],
    max_tokens: 50,
    temperature: 0.7
  });

  try {
    const response = await makeRequest(
      `${baseUrl}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      postData
    );

    const data = JSON.parse(response.body);

    if (data.error) {
      console.log(`${RED}❌ 測試失敗: ${data.error.message}${NC}`);
      return { ok: false, error: data.error.message };
    }

    if (data.choices && data.choices[0]) {
      const content = data.choices[0].message?.content;
      console.log(`${GREEN}✅ Chat 測試成功${NC}`);
      console.log(`   回應: "${content}"`);
      
      if (data.usage) {
        console.log(`   Tokens: ${data.usage.total_tokens} (輸入: ${data.usage.prompt_tokens}, 輸出: ${data.usage.completion_tokens})`);
      }
      
      // Perplexity citations
      if (data.citations && data.citations.length > 0) {
        console.log(`\n   ${BLUE}📚 Citations (Perplexity 特有):${NC}`);
        data.citations.slice(0, 3).forEach((cite, i) => {
          console.log(`      ${i + 1}. ${cite.substring(0, 60)}...`);
        });
      }
      
      return { ok: true, response: content, usage: data.usage };
    }

    return { ok: false, error: '無法解析回應' };
  } catch (err) {
    console.log(`${RED}❌ 測試失敗: ${err.message}${NC}`);
    return { ok: false, error: err.message };
  }
}

// 寫入 OpenClaw config
async function writeToConfig(providerId, baseUrl, apiKey, model) {
  console.log(`\n${CYAN}📝 正在更新 OpenClaw Config...${NC}`);
  
  const configPath = '/root/.openclaw/openclaw.json';
  
  try {
    // 讀取現有 config
    let config = {};
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      config = JSON.parse(content);
    }
    
    // 確保結構存在
    if (!config.models) config.models = { mode: 'merge', providers: {} };
    if (!config.models.providers) config.models.providers = {};
    if (!config.agents) config.agents = { defaults: { model: {}, models: {} } };
    if (!config.agents.defaults) config.agents.defaults = { model: {}, models: {} };
    if (!config.agents.defaults.model) config.agents.defaults.model = {};
    if (!config.agents.defaults.models) config.agents.defaults.models = {};
    
    // 加入新 provider
    config.models.providers[providerId] = {
      baseUrl: baseUrl,
      apiKey: apiKey,
      api: 'openai-completions',
      models: [
        {
          id: model,
          name: model,
          reasoning: false,
          input: ['text'],
          cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
          contextWindow: 128000,
          maxTokens: 4096
        }
      ]
    };
    
    // 設定為 primary
    config.agents.defaults.model.primary = `${providerId}/${model}`;
    
    // 加入 alias
    config.agents.defaults.models[`${providerId}/${model}`] = {
      alias: providerId.charAt(0).toUpperCase() + providerId.slice(1)
    };
    
    // 寫入檔案
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    
    console.log(`${GREEN}✅ Config 更新成功！${NC}`);
    console.log(`   檔案: ${configPath}`);
    console.log(`   Primary Model: ${YELLOW}${providerId}/${model}${NC}`);
    console.log(`\n${CYAN}請運行以下指令重啟 Gateway：${NC}`);
    console.log(`   openclaw gateway restart`);
    
    return true;
  } catch (err) {
    console.log(`${RED}❌ 寫入 Config 失敗: ${err.message}${NC}`);
    return false;
  }
}

// 更新 Moonshot API key
async function updateMoonshotKey(newKey) {
  const keyPath = '/root/.openclaw/credentials/moonshot.default.key';
  
  try {
    fs.writeFileSync(keyPath, newKey);
    fs.chmodSync(keyPath, 0o600);
    console.log(`${GREEN}✅ Moonshot API Key 已更新${NC}`);
    console.log(`   檔案: ${keyPath}`);
  } catch (err) {
    console.log(`${RED}❌ 更新失敗: ${err.message}${NC}`);
  }
}

// 主程式
async function main() {
  printHeader();
  
  // 檢查命令行參數（更新 key 模式）
  if (process.argv[2] === '--update-key' && process.argv[3]) {
    console.log(`${CYAN}更新 Moonshot API Key...${NC}\n`);
    await updateMoonshotKey(process.argv[3]);
    console.log(`\n請運行: openclaw gateway restart`);
    return;
  }
  
  showMenu();
  
  const rl = createRL();
  
  try {
    // 選擇 Provider
    let choice;
    while (true) {
      choice = await ask(rl, `${CYAN}選擇 (1-5): ${NC}`);
      if (providers[choice]) break;
      console.log(`${RED}❌ 無效選擇，請輸入 1-5${NC}`);
    }
    
    const provider = providers[choice];
    
    // 設定 Base URL
    let baseUrl = provider.baseUrl;
    
    if (choice === '5') {
      while (true) {
        baseUrl = await ask(rl, `\n${CYAN}請輸入 Base URL: ${NC}`);
        if (baseUrl.startsWith('http')) break;
        console.log(`${RED}❌ Base URL 必須以 http 或 https 開頭${NC}`);
      }
      
      if (!baseUrl.endsWith('/v1')) {
        baseUrl = baseUrl.replace(/\/$/, '') + '/v1';
      }
    }
    
    // 設定 Test Model
    let testModel = provider.testModel;
    if (choice === '5') {
      testModel = await ask(rl, `${CYAN}請輸入測試 Model ID: ${NC}`);
    }
    
    console.log(`\n${CYAN}📋 設定資訊:${NC}`);
    console.log(`   Provider: ${provider.icon} ${provider.name}`);
    console.log(`   Base URL: ${YELLOW}${baseUrl}${NC}`);
    console.log(`   測試 Model: ${YELLOW}${testModel}${NC}`);
    
    // 輸入 API Key
    console.log('');
    
    // 關閉 rl 先，因為 visible input 會接管 stdin
    rl.close();
    
    const apiKey = await askVisible(`${CYAN}🔑 請輸入 API Key (顯示模式，按 Enter 後遮罩): ${NC}`);
    
    if (!apiKey) {
      console.log(`${RED}❌ API Key 不能為空${NC}`);
      return;
    }
    
    console.log(`   API Key: ${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 6)}`);
    
    // 重新創建 rl 做確認
    const rl2 = createRL();
    
    // 確認
    console.log('');
    const confirmed = await askConfirm(rl2, `${CYAN}確認開始測試? (y/n): ${NC}`);
    
    if (!confirmed) {
      console.log(`${YELLOW}已取消${NC}`);
      rl2.close();
      return;
    }
    
    rl2.close();
    
    console.log('');
    printLine();
    console.log('                    開始測試');
    printLine();
    
    // 執行測試
    const connection = await testConnection(baseUrl, apiKey);
    
    if (!connection.ok) {
      printLine();
      console.log(`${RED}❌ 無法連接到伺服器${NC}`);
      console.log(`   錯誤: ${connection.error || '未知錯誤'}`);
      return;
    }
    
    const modelsResult = await listModels(baseUrl, apiKey);
    const chatResult = await testChat(baseUrl, apiKey, testModel);
    
    // 總結
    printLine();
    console.log('                    測試結果');
    printLine();
    
    const allSuccess = connection.ok && modelsResult.ok && chatResult.ok;
    
    if (allSuccess) {
      console.log(`${GREEN}✅ 所有測試通過！API 完全正常${NC}\n`);
      
      console.log(`${CYAN}💡 測試摘要:${NC}`);
      console.log(`   ✅ 連接測試: HTTP ${connection.status}`);
      console.log(`   ✅ Models: ${modelsResult.count} 個可用`);
      console.log(`   ✅ Chat: ${chatResult.response?.substring(0, 30)}...`);
      if (chatResult.usage) {
        console.log(`   ✅ Tokens: ${chatResult.usage.total_tokens}`);
      }
      
      console.log(`\n${CYAN}💡 建議設定:${NC}`);
      console.log(`   Provider: ${provider.name}`);
      console.log(`   Base URL: ${baseUrl}`);
      console.log(`   Model: ${testModel}\n`);
      
      console.log(`${CYAN}📝 OpenClaw Config:${NC}`);
      console.log(`   "primary": "${provider.id}/${testModel}"`);
      
      // 詢問是否寫入 config
      const rl3 = createRL();
      const writeConfig = await askConfirm(rl3, `\n${CYAN}是否直接寫入 OpenClaw Config? (y/n): ${NC}`);
      rl3.close();
      
      if (writeConfig) {
        const written = await writeToConfig(provider.id, baseUrl, apiKey, testModel);
        if (written) {
          console.log(`\n${GREEN}✅ 完成！請重啟 Gateway 以套用新設定${NC}`);
        }
      } else {
        console.log(`\n${YELLOW}ℹ️  已跳過寫入 Config${NC}`);
        console.log(`   你可以手動將以上設定加入 /root/.openclaw/openclaw.json`);
      }
      
    } else {
      console.log(`${YELLOW}⚠️  部分測試未完成${NC}\n`);
      
      if (!connection.ok) {
        console.log(`${RED}   ❌ 連接失敗${NC}`);
      } else if (!modelsResult.ok) {
        console.log(`${YELLOW}   ⚠️  Models 獲取失敗: ${modelsResult.error}${NC}`);
      } else if (!chatResult.ok) {
        console.log(`${YELLOW}   ⚠️  Chat 測試失敗: ${chatResult.error}${NC}`);
      }
      
      console.log(`\n${YELLOW}請檢查:${NC}`);
      console.log(`   • API Key 是否正確`);
      console.log(`   • Base URL 是否正確`);
      console.log(`   • 網絡連接是否正常`);
      console.log(`   • Provider 是否支援該 Model`);
    }
    
    printLine();
    
  } catch (err) {
    console.error(`${RED}\n錯誤: ${err.message}${NC}`);
    console.error(err.stack);
  } finally {
    rl.close();
  }
}

// 錯誤處理
main().catch(err => {
  console.error(`${RED}\n錯誤: ${err.message}${NC}`);
  console.error(err.stack);
  process.exit(1);
});
