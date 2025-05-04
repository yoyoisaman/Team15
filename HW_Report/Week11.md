# 進度報告 - Team 15, Week 11

1.AJAX實作

在這次作業中，我們使用 `AJAX` 技術來實現前端與後端的非同步資料交換，利用 `jQuery` API 處理與後端 API 進行的所有資料交互。
配合本組書籤管理系統，實現資料庫進行非同步請求，並更新 UI 以便展示最新的書籤數據。

2.Django Login Page Template 與 MTV 架構

基於 Django 框架，實現了一個簡單的登入頁面。


## 課內技術練習

### 使用 AJAX 進行資料操作

`$.ajax()` 是 jQuery 提供的 AJAX 方法，他被用來進行資料請求，具有多種函式式的選項和配置，例如 xhrFields、success、error 等處理函式，這些功能可以讓開發者處理 HTTP 請求和回應的各種狀況，並且在此次作業實作中均有使用。


1.初始化 CSRF Token

為了防止跨站請求偽造 (CSRF)，我們首先向後端請求 CSRF Token 並將其存儲，後續的 AJAX 請求將會附帶此 token。

這段程式碼通過向後端發送 GET 請求來獲取 CSRF Token，並將其保存在 `csrfToken` 變數中:

```javascript
await $.ajax({
    url: 'http://localhost:8000/api/get_csrf',
    type: 'GET',
    contentType: 'application/json',
    xhrFields: {
        withCredentials: true  // 包含 cookie 資訊
    },
    success: function (data) {
        csrfToken = Cookie.get('csrftoken');  // 儲存 CSRF Token
    },
    error: function (xhr, status, error) {
        console.error('Error:', error);
    }
});
```


2.初始化書籤資料

當用戶首次載入頁面時，我們會通過 AJAX 向伺服器發送 POST 請求來初始化書籤資料。這些資料會儲存於本地的 `IndexedDB` 中。
在向後端發送 POST 請求後，獲取書籤資料並儲存到本地資料庫中:

```javascript
await $.ajax({
    url: 'http://localhost:8000/api/bookmarks/init',
    type: 'POST',
    contentType: 'application/json',
    success: function (data) {
        databaseStatus = data.databaseStatus;
        treeStructure = data.treeStructure;
        idToBookmark = data.idToBookmark;
    },
    error: function (xhr, status, error) {
        console.error('Error:', error);
    }
});
```

3.更新書籤資料

在更新書籤或資料夾時，我們會將更新資料發送到伺服器，並更新本地資料庫的書籤資料。

```javascript
$.ajax({
    url: 'http://localhost:8000/api/bookmarks/update/' + id,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        time: updateTime,
        parent_id: data.parent_id,
        children_id: data.children_id,
    }),
    success: function (data) {
        console.log("Server update success:", data);
    },
    error: function (xhr, status, error) {
        console.error('Server update error:', error);
    }
});
```


4.刪除書籤資料

當用戶刪除書籤或資料夾時，我們會使用 AJAX 發送刪除請求，並更新本地資料庫以反映變更。

```javascript
$.ajax({
    url: 'http://localhost:8000/api/bookmarks/delete/' + id,
    type: 'POST',
    contentType: 'application/json',
    data: JSON.stringify({
        time: updateTime,
    }),
    success: function (data) {
        console.log("Server delete success:", data);
    },
    error: function (xhr, status, error) {
        console.error('Server delete error:', error);
    }
});
```


### MTV架構與Template實作

MTV檔案示意圖如下

backend/
├── templates/
│   └── login.html           # 登入頁面模板
├── api/
│   └── views.py             # 處理登入邏輯的視圖
└── urls.py                  # URL 路徑配置


1.使用者登錄 ( Template )
當用戶選擇登錄帳戶時會進入到使用者登錄畫面

在這裡，我們要求使用者以 e-mail 作為帳號，接著再輸入密碼，並且我們亦有提供忘記密碼的選項。登錄模板實作範例其內容如下：

![img1](./report_imgs/Week05/img1.gif)


2.登錄邏輯、 url 配置

登入邏輯在 `views.py` 中實現，為了處理用戶的請求並返回適當的回應， `login_view` 的函式會處理登入頁面的顯示和表單提交。當用戶提交登入表單時，會檢查提供的用戶名和密碼是否正確。如果不正確，會重新渲染 login.html 並顯示錯誤訊息。

為了配置 url ，在 `urls.py` 中設置路徑 /login 指向 login_view，這樣當用戶訪問 /login 時， Django 會調用該視圖處理登入頁面的渲染。程式範例如下:

```python
from api.views import login_view

urlpatterns = [
    path('login/', login_view, name='login'),
]
```



## 額外相關技術


## 組員分工情形 - Team 15

- 王凱右 - 25%：額外技術實作
- 胡凱騰 - 25%：上課作業實作
- 陳立亘 - 25%：撰寫報告
- 蔡佾家 - 25%：撰寫報告
