# 進度報告 - Team 15, Week 11

在本次作業中，我們基於課程中所學的多項與註冊、登入相關之技術，為使用者提供建立帳號的功能，保存各個使用者的書籤庫，並於不同裝置間同步，令使用者能隨時隨地存取其建立的書籤庫。

下圖分別為註冊、登錄與重設密碼的時序圖，也就是本次作業中的關鍵部分，其中運用了 **Session、POST/GET、API 串接、發送 Email** 等課內技術。

![register_seq](report_imgs\Week13\register_seq.png)

![login_seq](report_imgs\Week13\login_seq.png)

此外為了使用者便利性，我們額外完成了數項功能，包含 **Google OAuth 2.0** 讓使用者直接以 Google 帳號註冊，以及 **匯出匯入書籤、跨裝置同步** 等功能。

### URL 網址派發

在上次作業中，我們使用 Django 的 Template 建構登入頁面，並以 urls.py 派發登入頁面的網址，為了易於維護與功能一致性，此次實作的註冊、登出與重設密碼皆同樣透過 Django urls.py 派發網址，下面為對應的網址與實作對應功能的函數:

```python
path('login/', login_view, name='login'),
path('logout/', logout_view, name='logout'),
path('oauth2callback/', oauth2callback, name='oauth2callback'),
path('password/', set_password, name='password'),
path('forgot-password/', forgot_password, name='forgot_password'),
path('reset-password/<str:token>/', reset_password, name='reset_password'),
```

- `logout/` : 以 API 形式告知後端清除當前使用者的 Session 以完成登出。

- `oauth2callback/` : 提供註冊相關邏輯的接口，詳細說明請參照 **額外相關技術 Google OAuth 2.0**。

- `password/` : 註冊時設置密碼的頁面，此頁面由 **Template 技術** 完整產出 HTML。

- `forgot-password/` : 請求重設密碼的頁面，會寄送 Email 至註冊的 Google 信箱，在 Email 中提供重設密碼的網頁連結，此頁面由 **Template 技術** 完整產出 HTML。

- `reset-password/<str:token>/` : 重設密碼的頁面，利用 URL Parameter `<str:token>` 決定要重設密碼的帳號，此頁面由 **Template 技術** 完整產出 HTML。


## 課內技術練習

### 1. Session & POST/GET

Session 與 POST/GET 為此次實作功能的核心技術，我們接收來自於 Google OAuth 2.0 的 GET 請求以獲取暫時授權碼並完成使用者帳號註冊，詳細說明請參照 **額外相關技術**。而 POST 則廣泛用於前後端的資訊交流，以傳遞更大量的資訊，並提供基礎的資料外洩防範。

Session 提供了後端識別使用者的能力，且能為不同使用者儲存專屬於其的資訊，在此次作業中登入帳號後會建立 Session 並儲存下列的資訊，同時設置該 Session 的使用期限 :
```python
request.session['name'] = name
request.session['username'] = email
request.session['picture'] = picture
request.session['is_authenticated'] = False
request.session.set_expiry(60 * 60 * 24 * 7)
```

`username` 用於後端在使用者後續的請求中辨別其帳號，並從資料庫檢索對應資料 :
```python
# views.py bookmarks_update_api
account = request.session.get('username', 'admin')

user = User.objects.get(account=account)
bookmark = Bookmarks.objects.filter(account=user.account, bid=bid)
tree_structure = TreeStructure.objects.filter(account=user.account, bid=bid)
```

`is_authenticated` 用於確保 Session 未逾期，且該帳號的註冊過程正常 (有成功設定密碼)。而其餘非敏感資訊會回傳給前端，用以顯示當前登入的帳號。

### 2. API 串接 & 防機器人驗證

在此專案中使用到了數個 API，如下所列:

- `https://www.google.com/s2/favicons?domain=${domain}` : 獲取網站分頁的小圖標。

- `https://oauth2.googleapis.com/token` : 註冊時序圖中「以暫時授權碼換取 Access Token」步驟所對應的 API，詳細說明請參照 **額外相關技術**。

- `https://openidconnect.googleapis.com/v1/userinfo` : 用於獲取使用者 Google 帳號的資訊，包含名稱與頭像，這些資訊用於前端顯示當前登入的帳號。

- `https://www.google.com/recaptcha/api/siteverify` : 登入時序圖中提供 reCAPTCHA 驗證的 API，於登入頁面中使用，當使用者於前端完成驗證後會取得一個封存驗證資訊的 Token，而後端在接收到該 Token 後會用於此 API 以查詢該驗證是否成功。

![login](report_imgs/Week13/login.gif)

### 3. Email 發送

當使用者要求重設密碼時，後端會以隨機方式產生並儲存一個 Token，將該 Token 與 `reset-password/<str:token>/` 結合才能導向重設該帳號密碼的頁面，為此我們會將導向此頁面的連結寄送到使用者的信箱。

我們透過 Gmail 的 SMTP 伺服器發送 Email，並於後端使用 Django 的 `django.core.mail` 模組來設定相關參數並完成寄送。

![reset_password](report_imgs/Week13/reset_password.gif)

## 額外相關技術

### 1. Google OAuth 2.0 - 註冊帳號

此次註冊系統要求使用者以 Google 帳號註冊，而 Google 提供帳號授權的機制便是 **Google OAuth**。

![register](report_imgs/Week13/register.gif)

如註冊時序圖所示，一開始會先跳轉至 Google 所提供的登入頁面 `https://accounts.google.com/o/oauth2/v2/auth`，登入成功後會重新導向至先前 URL 網址派發的 `oauth2callback/`，同時也會將暫時授權碼以 GET 的方式傳遞給重新導向的網址。

接著後端再使用暫時授權碼與 `https://oauth2.googleapis.com/token` 交換 Access Token，所取得的 Access Token 讓我們能從 `https://openidconnect.googleapis.com/v1/userinfo` API 中獲取該 Google 帳號的資訊。當從 API 獲取完所需資訊及帳號創建的初始化過程結束後，會再重新導向至 URL 網址派發的 `password/` 讓使用者設定密碼。

### 2. 匯出匯入書籤

為了使用者便於備份與分享其書籤庫，我們提供匯出匯入書籤的功能。匯出時會先將書籤庫資料轉換為符合 JSON 格式的字串，接著透過 Blob (Binary Large Object) 封裝為 JSON 檔案形式，並以 `URL.createObjectURL(blob)` 建立該 Blob 的下載連結，以此匯出書籤庫，匯出完成後再以 `URL.revokeObjectURL(url)` 釋放占用的記憶體資源。
```javascript
const handleExport = () => {
    const data = {
        treeStructure: bookmarksTree.treeStructure,
        idToBookmark: bookmarksTree.idToBookmark,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks_export.json";
    a.click();
    URL.revokeObjectURL(url);
};
```

匯入書籤庫資料時則透過 Javascript FileReader 物件以文字形式讀入 `<input type="file">` 輸入的檔案，並嘗試將其解析為 JSON 物件，如果解析成功並符合書籤庫的格式，則將讀入的資訊覆蓋前後端資料庫儲存的書籤庫。
```javascript
const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
        const data = JSON.parse(evt.target.result);
        if (data.treeStructure && data.idToBookmark) {
            bookmarksTree.buildNewTree(data.treeStructure, data.idToBookmark);
            onClose();
        } else {
            alert("檔案格式錯誤！");
        }
    };
    reader.readAsText(file);
};
```

這些功能透過 React component 的方式建立操作頁面，並加入先前的主頁中，詳細內容可參考 `frontend\src\components\BookmarkImportExportModal\BookmarkImportExportModal.jsx`

![import_export](report_imgs/Week13/import_export.gif)

### 3. 跨裝置同步

透過 Session，我們得以判斷不同使用者帳號，並令該帳號於不同裝置上的內容同步。

![sync](report_imgs/Week13/sync.gif)

## 組員分工情形 - Team 15

- 王凱右 - 25%：部分課內及額外技術
- 胡凱騰 - 25%：撰寫報告
- 陳立亘 - 25%：額外技術
- 蔡佾家 - 25%：登入相關內容

## Docker Image Pull 連結及啟動方式

### 1. 安裝 Docker

### 2. 測試 Docker 是否安裝成功

打開終端機或命令提示字元，輸入以下指令檢查版本：

```bash
docker -v
```

### 3. 專案設定

從 GitHub 專案中取得 `docker-compose.yml` 的 Docker 的設定檔。

GitHub 專案結構如下：

```
TEAM15
├─ backend
├─ frontend
└─ docker
    └─ docker-compose.yml
```

### 4. 移動至指定目錄

在終端機中切換至 `docker` 資料夾：

```bash
cd TEAM15/docker
```

### 4. 執行容器

當位於 `docker-compose.yml` 所在的資料夾時，執行以下指令啟動容器：

```bash
docker-compose -f ./docker-compose.yml up
```

### 5. 訪問網站

- 可透過 `localhost:5174` 訪問前端。

- 可透過 `localhost:8000` 訪問後端 API。

- 可透過 `localhost:8080` 訪問後端資料庫。
