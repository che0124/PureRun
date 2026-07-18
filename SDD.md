# 軟體需求設計文件 (SDD)：PureRun (AI Runner Companion)

## 1. 專案概述
本專案 (PureRun) 旨在解決跑者在諮詢 AI 訓練規劃時，缺乏數據聯動與長期訓練追蹤的問題。透過與 Garmin Connect 整合，系統能根據跑者的實際生理數值（如活動紀錄、心率、配速）動態調整並生成 AI 課表，並提供前端可視化的追蹤介面與互動式路線圖 (GPX)。系統主打隱私優先 (Privacy First)，所有資料儲存於本地端。

## 2. 系統架構設計

### 2.1 核心模組
* **前端介面 (Client UI)：** 訓練日曆、儀表板、互動式路線地圖與 AI 建議展示介面。
* **後端中樞 (API Routes/Server Actions)：** 處理 Garmin 數據同步與建構 AI 請求的 Prompt Context。
* **本地狀態引擎 (Database)：** 使用本地 SQLite 儲存跑者的訓練紀錄、活動詳情、與課表執行狀態，不需雲端資料庫。
* **AI 規劃引擎 (AI Engine)：** 串接 Google Gemini AI，讀取跑者的生理數據與活動表現，輸出結構化的訓練課表。
* **數據同步模組 (Integration)：** 透過 Garmin Connect 帳密即時拉取用戶的活動數據與統計。

## 3. 關鍵功能需求 (Functional Requirements)

### 3.1 數據同步機制
* **本地憑證：** 於系統設定頁面輸入 Garmin 帳號密碼進行即時驗證與拉取（憑證不存入資料庫）。
* **活動拉取與解析：** 系統同步近期訓練活動、統計數據 (GarminStats)，以及解析 GPX 路線。

### 3.2 具備記憶的 AI 交互
* **上下文管理：** 產出課表時，動態注入「近期訓練負荷 (Training Load)」、「近期配速/心率」等本地分析的 Garmin 生理指標。
* **結構化輸出：** 強制 AI 輸出符合前端日曆與計畫清單所需之 JSON 格式。
* **執行狀態追蹤：** 支援「待執行 (Pending)」、「已完成 (Completed)」、「未達標 (Missed)」狀態。

## 4. 資料模型設計 (Data Schema - Prisma/SQLite)

* **GarminStats:** 記錄每週總跑量、平均心率、配速及預估 VDOT。
* **GarminActivity:** 記錄單次活動詳細數據（距離、時間、心率、配速、步頻、步幅、高階訓練指標）及 GPX 路徑關聯。
* **TrainingPlan:** 記錄計畫起始時間與 AI 分析建議 (weeklyAnalysis)。
* **Workout:** 記錄每日具體課表內容（類型、目標配速、目標心率）與實際執行結果（達成率、AI 回饋）。
* **FitnessStatus:** 記錄跑者的 CTL (體能)、ATL (疲勞)、TSB (狀況) 等高階長期負荷指標。

## 5. 技術堆疊建議 (MVP 版本)

| 模組 | 選用技術 | 說明 |
| :--- | :--- | :--- |
| **全端框架** | Next.js (React) | 使用 TypeScript，以 App Router 與 Tailwind CSS 建構 PWA 就緒的前端。 |
| **資料庫 & ORM**| SQLite + Prisma | 實現本地端「隱私優先」資料儲存，依賴 Prisma 進行資料關聯映射。 |
| **第三方整合** | Garmin Connect API | 獲取活動紀錄、統計數值與 GPX 資料。 |
| **AI 引擎** | Google Gemini | 利用長上下文處理序列活動數據，提供高度個人化的教練分析。 |

## 6. 系統執行流程
1. **初始化與設定：** 用戶透過設定頁面輸入 Garmin 憑證與 Gemini API Key。
2. **數據拉取與基準建立：** 觸發同步，透過 API 抓取近期的 Garmin 跑步數據存入本地 SQLite。
3. **課表生成 (Prompting)：** 將 SQLite 中的體能狀況與歷史活動轉為上下文，請求 Gemini 生成訓練計畫與課表。
4. **前端渲染：** 儲存結構化課表至本地庫，並渲染於 Next.js 儀表板與日曆元件上。
5. **回饋迴圈：** 實際訓練同步後，系統計算課表達成率 (Compliance Rate)，作為後續 AI 調整的參考。

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
```