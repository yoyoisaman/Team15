# 進度報告 - Team 15, Week 7

我們這次作業進一步完善了「書籤管理系統」的功能，提供可自訂的網站書籤收藏工具。系統支援階層式資料夾分類、標籤篩選、快捷鍵存取與跨裝置同步，並採用 React 搭配 IndexedDB 作為前端架構，後端則使用 Django，實現離線可用、本地快取與雲端同步的整合功能。此外，平台也支援快速搜尋與 UI/UX 優化，提供使用者流暢便捷的書籤管理體驗。


## 課內技術練習

### (1) UI Event

| 使用者動作             | Event Listener                 | 描述 |
|------------------------|------------------------------|------|
| 點擊新增書籤           | `#addBookmark.onclick`       | 開啟輸入表單並新增資料至前端資料庫 |
| 拖曳書籤進入資料夾     | `dragstart`, `dragover`, `drop` | 更新前端資料結構並同步至後端 |
| 點擊標籤進行篩選       | `.tag-button.onclick`        | 篩選畫面中相關的書籤 |
| 搜尋框輸入關鍵字       | `#searchInput.oninput`       | 即時搜尋書籤名稱與網址 |
| 展開/收起資料夾        | `.folder-toggle.onclick`     | 動態更改 BookmarksTree 顯示狀態 |
| 快捷鍵跳轉網址         | `document.onkeydown`         | 判斷按鍵是否與設定相符，如是則開啟網址 |


### (2) BookmarksTree

系統使用樹狀結構管理書籤，具備下列結構：

```json
{
  "id": "folder_1",
  "type": "folder",
  "title": "開發工具",
  "children": [
    {
      "id": "bookmark_1",
      "type": "bookmark",
      "title": "GitHub",
      "url": "https://github.com",
      "tags": ["程式", "工具"]
    }
  ]
}
```

- 支援層層相關的資料夾 (Nested Folder)
- 每個節點具備唯一 `id`
- 書籤節點可設定多個 `tags`
- 用戶可拖曳更改排序與結構


### (3)前後端資料庫

#### a.前端資料庫 (IndexedDB)

使用 **IndexedDB** 管理書籤資料，提供跨頁使用、優先顯示的成本很低。

| 資料結構  | 用途                           |
|-----------|--------------------------------|
| `bookmarks` | 儲存書籤樹狀資料             |
| `tags`     | 儲存所有標籤列表               |
| `hotkeys`  | 儲存用戶自訂快捷鍵設定           |

前端資料流程：

```
1. 操作 UI (ex: 新增書籤)
2. 更新 IndexedDB
3. 重新顯示畫面
4. 開啟 API 傳送同步至後端
```


#### b.後端資料庫 (MySQL)

系統後端使用 PHP + MySQL 儲存用戶書籤、標籤、快捷鍵等資料，支援跨裝置同步。

| 資料表        | 欄位                                          |
|----------------|-----------------------------------------------|
| `users`        | id, username, password_hash                   |
| `bookmarks`    | id, user_id, parent_id, title, url, type, sort_order |
| `tags`         | id, bookmark_id, tag_name                     |
| `hotkeys`      | id, user_id, bookmark_id, key_combination     |



## 額外相關技術

### 同步與非同步的溝通機制
後端 Django API (同步) → 前端初始化資料（非同步載入 IndexedDB） → 使用者操作（非同步寫入 IndexedDB） → 顯示結果（同步於記憶體中）

(1)IndexedDB 非同步處理算法

- 所有 IndexedDB 操作為非同步，使用 Promise + `async/await` 來確保順序
- `onupgradeneeded` 和 `onsuccess` 為根本觸發點，處理初始化與資料載入
- 結合 `Promise.all()` 等待多個 table 資料完成獲取

(2)前後同步通信

- 前端第一次啟動時，認定 IndexedDB 為空白層，會向 Django API 發出 GET 請求
- Django 使用 `JsonResponse` 返回書籤與資料夾 JSON 組合
- 前端使用 `fetch()` 非同步從 API 載入資料，後續寫入 IndexedDB


## Docker Image Pull 連結及啟動方式

(1)安裝 docker

(2)測試 docker 是否安裝成功

打開終端機或命令提示字元，輸入以下指令檢查版本：

```bash
docker -v
```

(3)專案設定

從 GitHub 專案中取得 `docker-compose.yml` 之 docker 的設定檔

GitHub 專案結構如下：

```
TEAM15
├─ backend
├─ frontend
└─ docker
    └─ docker-compose.yml
```

在終端機中切換至該資料夾：

```bash
cd TEAM15/docker
```

(4)執行容器

當位於 `docker-compose.yml` 所在的資料夾時，執行以下指令啟動容器：

```bash
docker-compose up
```

這段指令目的是同時啟動一個前端容器跟一個後端容器，並把它們配置好指定的 port 跟資料夾，就會完成整個應用環境的部署。以下進行布署說明:

![img1](./report_imgs/Week07/img1.png)

frontend :

-指定 frontend 容器使用 Docker Hub 上的映像檔 `yoyoisaman/bookmark-frontend:v1`
-主機的 `5174` port 對應容器內部的 `5174` port，這樣可透過 `localhost:5174` 訪問前端。

backend :

-指定 frontend 容器使用 Docker Hub 上的映像檔 `yoyoisaman/bookmark-backend:v1`
-主機的 `8000` port 對應容器內部的 `8000` port，可透過 `http://localhost:8000` 訪問後端 API。


## 組員分工情形 - Team 15

- 王凱右 - 25%：docker
- 胡凱騰 - 25%：前後段資料庫
- 陳立亘 - 25%：撰寫報告
- 蔡佾家 - 25%：前端(IndexedDB)



