# API Tester Pro

> 一鍵測試 AI API 連接，專為 OpenClaw 用戶設計

[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0-brightgreen)](https://nodejs.org/)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

## ✨ 功能特色

- 🔍 **三步測試**：連接 → Models → Chat，快速驗證 API 可用性
- 🌐 **多 Provider 支援**：Moonshot、OpenRouter、Perplexity、OpenAI、自定義
- 📝 **顯示輸入模式**：打字時見到 characters，按 Enter 後遮罩，防錯又安全
- ⚙️ **一鍵配置**：測試成功直接寫入 OpenClaw config
- 🎨 **中文界面**：繁體中文提示，清楚易明
- 🔒 **本地執行**：API key 唔會上傳到任何伺服器

## 🚀 快速開始

方法1：GIT 直接執行（無需安裝）

```bash
curl -fsSL https://raw.githubusercontent.com/eddiecck1608/api-tester-pro/main/test-api-interactive.js | node

npx直接執行（npm）
npx github:eddiecck1608/api-tester-pro

方法2：GITHUB下載安裝後執行
git clone https://github.com/eddiecck1608/api-tester-pro.git
cd api-tester-pro
node test-api-interactive.js

npx下載安裝後執行（npm）
# 1. 安裝（好似普通用戶咁）
npm install -g api-tester-pro

# 2. 執行
api-tester

============================================================
        API Provider 測試工具 (PRO)
============================================================

請選擇 Provider：

  1. 🌙 Moonshot (Kimi)
     → https://api.moonshot.cn/v1
  2. 🔄 OpenRouter
     → https://openrouter.ai/api/v1
  3. 🧠 OpenAI
     → https://api.openai.com/v1
  4. 🔍 Perplexity
     → https://api.perplexity.ai
  5. ⚡ 自定義 (手動輸入 Base URL)

選擇 (1-5): 1

📋 設定資訊:
   Provider: 🌙 Moonshot (Kimi)
   Base URL: https://api.moonshot.cn/v1
   測試 Model: kimi-k2.5

🔑 請輸入 API Key (顯示模式，按 Enter 後遮罩): sk-xxx
   API Key: sk-xxx...xxx

確認開始測試? (y/n): y

============================================================
                    開始測試
============================================================

🌐 測試 1: 檢查連接...
✅ 連接成功 (HTTP 200)

📊 測試 2: 獲取可用 Models...
✅ 成功獲取 15 個 Models

📋 可用 Models (顯示首 15 個):
------------------------------------------------------------
  01. kimi-k2.5
  02. kimi-k2-turbo-preview
  ...
------------------------------------------------------------

💬 測試 3: Chat Completion...
   Model: kimi-k2.5
✅ Chat 測試成功
   回應: "API test successful"
   Tokens: 18 (輸入: 8, 輸出: 10)

============================================================
                    測試結果
============================================================
✅ 所有測試通過！API 完全正常

💡 建議設定:
   Provider: Moonshot (Kimi)
   Base URL: https://api.moonshot.cn/v1
   Model: kimi-k2.5

📝 OpenClaw Config:
   "primary": "moonshot/kimi-k2.5"

是否直接寫入 OpenClaw Config? (y/n): y

📝 正在更新 OpenClaw Config...
✅ Config 更新成功！
   檔案: /root/.openclaw/openclaw.json
   Primary Model: moonshot/kimi-k2.5

請運行以下指令重啟 Gateway：
   openclaw gateway restart
```

## 🎯 適合邊個用？

| 用戶類型 | 使用場景 |
|---------|---------|
| 🆕 OpenClaw 新手 | 第一次設定 API，唔知 key 啱唔啱 |
| 🔄 轉 Provider | 由 Moonshot 轉去 OpenRouter，快速驗證 |
| 🧪 開發者 | 測試新 API provider 嘅連接性 |
| 👨‍🏫 教育用途 | 學生學習 API 運作原理 |
| ⏱️ 效率追求者 | 唔想逐個手動改 config 嚟試 |

## 📋 系統要求

- Node.js 16.0+
- OpenClaw（選擇性，用於自動寫入 config）

## 🔧 支援 Provider

| Provider | 預設 Base URL | 預設 Model |
|----------|--------------|-----------|
| Moonshot | `https://api.moonshot.cn/v1` | `kimi-k2.5` |
| OpenRouter | `https://openrouter.ai/api/v1` | `anthropic/claude-sonnet-4.5` |
| OpenAI | `https://api.openai.com/v1` | `gpt-4o-mini` |
| Perplexity | `https://api.perplexity.ai` | `sonar-pro` |
| 自定義 | 手動輸入 | 手動輸入 |

## 💡 常見問題

### Q: 測試失敗，點算？
**A:** 檢查以下幾點：
1. API Key 是否正確（有冇多咗或漏咗字符）
2. Base URL 是否正確（注意要有 `/v1` 結尾）
3. 網絡連接是否正常（試下 `ping api.xxx.com`）
4. Provider 是否支援該 Model

### Q: 會唔會儲存咗我嘅 API Key？
**A:** 唔會。除非你選擇「寫入 OpenClaw Config」，否則 key 只會喺記憶體內，程式結束後就消失。

### Q: 可以測試自定義 Provider 嗎？
**A:** 可以！揀選項 5「自定義」，然後輸入你嘅 Base URL 同 Model ID。

## 📝 License

MIT License - 自由使用、修改、分享

## 🙏 鳴謝

特別鳴謝 C3 Eddie MR_Chi 提供寶貴意見，令呢個工具更加易用。

---

**有問題或建議？** 歡迎開 Issue 或 Pull Request！
