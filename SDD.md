# 軟體需求設計文件 (SDD)：AI Runner Companion (MVP 階段)

## 1. 專案概述
本專案旨在解決跑者在諮詢 AI 訓練規劃時，缺乏數據聯動與長期訓練追蹤的問題。透過與 Garmin Connect API 整合，系統能根據跑者的生理數值（如活動紀錄、心率、配速）動態調整並生成 AI 課表，並提供前端可視化的追蹤介面。

## 2. 系統架構設計

### 2.1 核心模組
* **前端介面 (Client UI)：** 訓練日曆、儀表板與 AI 建議展示介面。
* **後端中樞 (API Routes)：** 處理 Garmin 數據回呼 (Webhook/Sync) 與建構 AI 請求的 Prompt Context。
* **使用者與狀態引擎 (Database)：** 儲存跑者的歷史紀錄、目標、身體素質及課表執行狀態。
* **AI 規劃引擎 (AI Engine)：** 讀取用戶目標與生理數據，輸出結構化的每日訓練課表。
* **數據同步模組 (Integration)：** 透過 Garmin Health API 獲取每日訓練活動與健康數據。

## 3. 關鍵功能需求 (Functional Requirements)

### 3.1 數據同步機制
* **API 授權：** 使用 OAuth 2.0 處理 Garmin Connect 用戶授權。
* **定期拉取/接收：** 系統同步跑者訓練數據，將 JSON 格式的活動紀錄轉換為 AI 易讀的摘要。

### 3.2 具備記憶的 AI 交互
* **上下文管理：** 產出課表時，動態注入「用戶目標」、「近 7 天訓練狀態」與「Garmin 生理指標」。
* **結構化輸出：** 強制 AI 輸出符合前端日曆元件所需之 JSON 格式。
* **執行狀態追蹤：** 支援「待執行」、「已完成」、「未達標」狀態標記，作為下次回饋迴圈的依據。

## 4. 資料模型設計 (Data Schema - Supabase 規劃)

* **users:** `id` (UUID), `goal`, `vdot_score`, `garmin_token`, `created_at`
* **training_plans:** `id`, `user_id`, `start_date`, `end_date`, `status`, `ai_summary`
* **workouts:** `id`, `plan_id`, `date`, `workout_type`, `target_metrics` (JSONB), `garmin_activity_id` (可為空), `actual_metrics` (JSONB), `status`

## 5. 技術堆疊建議 (MVP 版本)

| 模組 | 選用技術 | 說明 |
| :--- | :--- | :--- |
| **全端框架** | Next.js (React) | 使用 TypeScript 統一前後端開發，利用 API Routes 處理後端邏輯。 |
| **資料庫 & 驗證**| Supabase (PostgreSQL) | 處理關聯資料與 JSONB 儲存，內建 Auth 解決用戶登入。 |
| **第三方整合** | Garmin Health API | 獲取每日活動紀錄與健康狀態。 |
| **AI 引擎** | Gemini 1.5 Flash / Pro (開發初期可於地端環境呼叫 API 或測試 Gemma 模型) | 利用超大 Context Window 處理長時間序列的 Garmin 數據，並強制輸出 JSON 格式。 |

## 6. 系統執行流程
1. **初始化與授權：** 用戶登入系統並完成 Garmin 帳戶綁定。
2. **數據拉取與基準建立：** 系統取得近期歷史數據，交由 Gemini 建立跑者當前體能基準。
3. **課表生成 (Prompting)：** Next.js 後端組合數據上下文，請求 Gemini 生成未來一週課表 (JSON 格式)。
4. **前端渲染：** 將結構化課表存入 Supabase，並渲染至前端的 React 日曆元件上。
5. **回饋迴圈：** 實際訓練完成後，Garmin 數據同步回 Supabase，作為下週 AI 生成課表的修正依據。

## 7. AI 整合規範 (JSON Schema)
為確保 Next.js 前端穩定渲染，AI 必須嚴格輸出以下 JSON 結構：

```json
{
  "weekly_analysis": "字串：基於近期數據的綜合評估與本週重點提醒",
  "training_plan": [
    {
      "date": "YYYY-MM-DD",
      "workout_type": "Recovery | Interval | Tempo | LongRun | Rest",
      "title": "字串：課表簡稱",
      "target_pace": "字串：建議配速區間",
      "target_hr_zone": "數字：目標心率區間",
      "description": "字串：詳細訓練步驟與注意事項"
    }
  ]
}