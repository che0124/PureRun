# 跑步追蹤與視覺化應用 - 系統架構與開發計畫

## 1. 系統架構圖與資料流程 (System Architecture)

### 核心技術選型建議
*   **後端 (Backend)**: Node.js (Express 或 NestJS，適合處理非同步 I/O 與 API 請求)。
*   **前端 (Frontend)**: React.js (推薦 Next.js 或 Vite) 或 Vue.js。
*   **資料庫 (Database)**: PostgreSQL (強烈推薦，能同時良好處理關聯資料與 JSONB 格式的時間序列資料)。
*   **圖表套件 (Charts)**: **Apache ECharts** (效能極佳，原生支援時間軸 `time` 類型，且對於大量數據渲染與 X 軸自動縮放支援度極高)。
*   **地圖套件 (Map)**: Leaflet 搭配 `leaflet-gpx` 套件。

### 資料交流與儲存流程
1.  **資料同步觸發**: 應用啟動或使用者點擊「同步」時，前端發送請求給後端 API。
2.  **獲取活動列表 (Stage 1)**: 後端透過 `@flow-js/garmin-connect` 呼叫 Garmin API 取得使用者的 Activities 列表，這份列表包含了活動摘要（`activityId`, 距離, 時間, 消耗卡路里等），直接將摘要更新/寫入資料庫。
3.  **防封鎖下載機制 (Stage 2)**: 針對資料庫中標記為「未獲取 GPX」的新 `activityId`，後端將其排入一個下載佇列 (Queue)。利用非同步的 `for...of` 迴圈搭配延遲函數 (如 `await delay(3000)`)，確保每下載一個 GPX 檔案間隔 3~5 秒，避免觸發 Garmin 的 Rate Limit。
4.  **檔案儲存與解析**:
    *   **儲存 GPX**: 將下載的原始 `.gpx` 檔案存入伺服器檔案系統 (如 `/uploads/gpx/`) 或雲端物件儲存 (如 AWS S3)，並將檔案路徑存入資料庫的 `gpx_file_url` 欄位。**絕對不要將幾十 MB 的 XML 原始字串直接塞進關聯式資料庫**。
    *   **預先解析 (選用但推薦)**: 在後端儲存檔案後，可透過 `xmldom` 等工具初步提取出時間、心率、配速等「時間序列數據」，將其轉化為精簡的 JSON 陣列存入 PostgreSQL 的 `JSONB` 欄位，可大幅減輕前端每次載入時的運算負擔。
5.  **前端渲染**:
    *   地圖區塊取得 `gpx_file_url` 後交由 `leaflet-gpx` 解析渲染，並監聽載入完成事件，呼叫 `map.fitBounds()` 自動將視野縮放至完整軌跡。
    *   圖表區塊讀取時間序列資料，餵給 ECharts 進行心率與配速的渲染，並設定 X 軸邊界以解決比例問題。

---

## 2. 資料庫結構設計 (Database Schema)

建議採用 **PostgreSQL**，將「關聯摘要數據」與「龐大的時間序列數據」適度分離或利用 `JSONB` 儲存以優化效能。

### Table: `Users` (使用者表)
*   `id` (UUID, PK)
*   `username` (String)
*   `garmin_username` (String)
*   `garmin_session_token` (String, 加密儲存)
*   `created_at` (Timestamp)

### Table: `Activities` (活動摘要表)
儲存 Garmin 列表 API 回傳的核心摘要，用於快速呈現歷史紀錄與統計。
*   `id` (UUID, PK)
*   `user_id` (UUID, FK -> Users.id)
*   `garmin_activity_id` (BigInt, Unique) - 用於去重與對應
*   `activity_name` (String) - 活動名稱
*   `start_time_local` (Timestamp) - 開始時間
*   `duration_seconds` (Integer) - 運動持續時間
*   `distance_meters` (Float) - 總距離
*   `average_pace` (Float) - 平均配速 (分:秒/公里 轉換為秒數儲存)
*   `calories` (Integer) - 總消耗卡路里
*   `elevation_gain` (Float) - 總爬升高度
*   `gpx_file_url` (String) - 實體 GPX 檔案的存放路徑
*   `sync_status` (Enum: `PENDING`, `GPX_DOWNLOADED`, `FAILED`) - 用於追蹤兩階段下載狀態

### Table: `ActivityTimeSeries` (時間序列數據表 - 效能優化層)
為避免前端每次都要解析龐大 GPX，將圖表需要的陣列資料獨立儲存 (可為 1-to-1 關聯)。
*   `id` (UUID, PK)
*   `activity_id` (UUID, FK -> Activities.id)
*   `heart_rate_data` (JSONB) - 格式如 `[[unix_timestamp, bpm], [unix_timestamp, bpm], ...]`
*   `pace_data` (JSONB) - 格式如 `[[unix_timestamp, pace], ...]`
*   `cadence_data` (JSONB) - 格式如 `[[unix_timestamp, spm], ...]`

---

## 3. API 端點設計 (RESTful API Endpoints)

### A. 同步與管理 API
*   **POST `/api/sync/garmin`**
    *   **用途**：觸發兩階段同步。先拉取活動列表更新 `Activities`，針對缺乏 GPX 的紀錄啟動 Rate-Limited 下載任務。
    *   **回傳**：`{ status: "syncing", new_activities_found: 5 }`
*   **GET `/api/sync/status`**
    *   **用途**：輪詢當前 GPX 下載佇列的進度 (如處理中、剩餘數量)。

### B. 核心數據存取 API
*   **GET `/api/activities`**
    *   **用途**：獲取個人的活動列表摘要 (支援 `page`, `limit`, `date_from`, `date_to` 查詢參數)。
*   **GET `/api/activities/:id`**
    *   **用途**：取得單一活動的完整摘要資訊。
*   **GET `/api/activities/:id/gpx`**
    *   **用途**：代理或重定向至實體的 GPX 檔案網址，供前端 `leaflet-gpx` 下載。
*   **GET `/api/activities/:id/time-series`**
    *   **用途**：回傳用於 ECharts 繪製圖表的輕量化 JSON 時間序列資料。

---

## 4. 三階段開發衝刺計畫 (Sprint Plan)

### Phase 1: MVP 資料管道與後端建設 (Data Pipeline Foundation)
**目標**：確保能穩定從 Garmin 拉取資料、防封鎖下載 GPX 並存入資料庫。
*   **Task 1**: 專案初始化 (Node.js + Express) 與 PostgreSQL Schema 建立。
*   **Task 2**: 實作 Garmin Connect 第一階段 API，成功拉取 Activities 列表並解析寫入 `Activities` Table。
*   **Task 3**: 實作第二階段 GPX 下載 Queue，導入 `async/await` 與 `delay` 機制處理防封鎖限制。
*   **Task 4**: 將 GPX 存檔至本機目錄，更新資料庫的 `gpx_file_url`，並完成對應的 RESTful APIs。

### Phase 2: 視覺化與互動防呆實作 (Visualization & UX)
**目標**：前端介面成型，地圖與圖表能順暢運作並解決 X 軸顯示痛點。
*   **Task 1**: 前端專案建置，完成左右分割/上下分割的基本 Dashboard 版面。
*   **Task 2**: 整合 Leaflet 與 `leaflet-gpx`。透過 `gpx_file_url` 載入軌跡，並實作自動縮放 (`map.fitBounds(e.target.getBounds())`)。
*   **Task 3 (關鍵防呆)**: 整合 ECharts 繪製心率與配速圖表。
    *   確保資料格式為 `[時間戳記, 數值]`。
    *   設定 X 軸 `type: 'time'`。
    *   **強制作為防呆條件**：配置 `xAxis: { min: 'dataMin', max: 'dataMax' }`，這會讓 X 軸嚴格貼齊第一筆與最後一筆數據的時間，徹底解決折線擠壓在左側的問題。
*   **Task 4**: 處理極端值防呆。例如配速圖表可能會因為 GPS 飄移出現極端峰值，需實作簡單的 Outlier 過濾 (如濾除配速 < 2分/公里的不合理數據)，或使用 ECharts 的 `dataZoom` 讓使用者可以自行放大細節。

### Phase 3: 效能優化與進階聯動 (Optimization & Advanced Interactivity)
**目標**：系統升級，解決大檔案效能瓶頸，加入酷炫的互動功能。
*   **Task 1**: 後端預解析 GPX 機制。在 Phase 1 的基礎上，儲存 GPX 時一併將核心數據抽樣 (Downsampling) 解析成 JSON，存入 `ActivityTimeSeries` Table。前端改接 JSON API，提升圖表渲染速度十倍以上。
*   **Task 2**: 地圖與圖表的游標聯動 (Cross-Interaction)。當使用者滑鼠在 ECharts 圖表上移動時，取得當下時間戳記，同步在 Leaflet 地圖上對應的 GPS 座標點繪製一個「移動標記 (Marker)」，大幅提升專業感。
*   **Task 3**: 統計儀表板 (Analytics Dashboard)。利用 `Activities` 表內的資料，使用 ECharts 繪製月跑量堆疊圖、平均心率分佈等聚合數據。
