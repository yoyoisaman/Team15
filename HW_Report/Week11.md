# 進度報告 - Team 15, Week 11

在這次作業中，我們運用課堂所學的 **AJAX、Template 與 URL 網址派發**，進一步完善了前後端的溝通機制。

同時，我們也針對 **SQL Injection 與 XSS 攻擊** 進行課外研究，實作防範措施。

此外，為提升資料庫的穩定性與可維護性，我們對後端使用的 MySQL 進行 **資料庫正規化**，以優化資料結構並降低冗餘。

## 課內技術練習

本專案目前的整體架構如下圖所示。這兩週我們實作了圖中以紅字標示的功能，主要包括：

- 運用 **AJAX 技術**，將前端對書籤的操作即時同步至後端，為跨裝置同步功能做準備。

- 利用 **URL 網址派發** 以及 **Template 技術**，優化 Django 後端的配置，提升系統的擴展性與可維護性。

![flow.jpg](report_imgs/Week11/flow.jpg)

### 1. URL 網址派發

```python
    path('login/', login_view, name='login'),
    path('api/get_csrf', get_csrf, name='get_csrf'),
    path('api/bookmarks/init', bookmarks_init_api, name='bookmarks_init_api'),
    path('api/bookmarks/update/<int:bid>', bookmarks_update_api, name='bookmarks_update_api'),
    path('api/bookmarks/delete/<int:bid>', bookmarks_delete_api, name='bookmarks_delete_api'),
```

我們根據上課講解的網址派發原則，設計並整理後端的 URL Routing，包含以下五項：

- `login/`：對應登入頁面。使用者登入成功後，網站會顯示用戶儲存於後端的書籤資料。此頁面由 **Template 技術** 完整產出 HTML。

- `api/get_csrf`：用於取得 CSRF token。

- `api/bookmarks/init`：當用戶載入網站時，會呼叫此 API 取得初始書籤資料。<br>（我們下週將在這裡引入 Session Cookie，記憶使用者的登入狀態，實現「重開瀏覽器仍保持登入」的功能，並透過此 API 回傳對應用戶的書籤資訊。）

- `api/bookmarks/update/<int:bid>`：當使用者新增或編輯書籤時，會透過 AJAX 呼叫此 API，同步更新後端資料。

- `api/bookmarks/update/<int:bid>`：當使用者刪除書籤時，同樣透過 AJAX 呼叫此 API，刪除對應的後端資料。

在更新與刪除書籤的 API 上，我們以資源導向為原則，利用 URL Parameter `<int:bid>` 指明需要編輯的書籤資源。

### 2. Template 實作

首先，我們基於 Django 的 Template 技術，建立 `base.html` 作為可重複利用的母版：

```html+django
<!DOCTYPE html>
<html lang="en">
<head>
    {% load static %}
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}My Website{% endblock %}</title>
    <link rel="stylesheet" href="{% static 'styles.css' %}">
    {% block extra_head %}{% endblock %}
</head>
<body>
    {% block content %}{% endblock %}
</body>
</html>
```

在這個母版中，我們使用 `{% block %}` 語法預留多個可覆寫的區塊，包含頁面標題、額外的 head 區段，以及主要內容區域。

透過這樣的設計，我們可以在保留整體網站風格與結構的同時，快速建立多個不同功能的頁面，並根據需要填入各自的內容。

舉例來說，以下為我們基於 `base.html` 實作的登入頁面 `login.html`：

```html+django
{% extends 'base.html' %}
{% block title %}Login{% endblock %}
{% block content %}
<div class="login-container">
    <h1>登入</h1>
    {% if error %}
        <p class="error">{{ error }}</p>
    {% endif %}
    <form method="POST" action="{% url 'login' %}">
        {% csrf_token %}
        <label for="username">Email</label>
        <input type="text" id="username" name="username" placeholder="您的 Email" required>
        ...
    </form>
</div>
{% endblock %}
```

呈現出的 HTML 如下圖：

![img1](report_imgs/Week11/img1.gif)

### 3. 使用 AJAX 與後端溝通

由於前後端溝通涉及敏感資訊（如使用者識別 ID），我們統一採用 POST request 傳送資料，以提升傳輸安全性。

而 Django 為防範跨站請求偽造（CSRF）攻擊，要求所有 POST request 必須附帶有效的 CSRF Token。

因此，使用者進入網站時，前端會先透過 GET request 向後端取得 Token，並儲存於 Cookie 中，作為後續資料操作的驗證依據。

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
    ...
});
```

在取得 CSRF Token 後，使用者進行新增、編輯或刪除書籤時，前端會即時更新本地端的 IndexedDB，同時透過 AJAX 將資料同步傳送至後端。

以下為書籤更新（包含新增及編輯）所對應的 AJAX 程式碼：

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
    ...
});
```

伺服器收到請求後，會根據傳入的資料對 MySQL 資料庫中的用戶書籤紀錄進行對應的操作。

採用 AJAX 的原因是，其非同步特性能讓前端在不重新載入頁面的情況下與後端溝通，進而提供更加流暢且不中斷的使用者體驗。

我們下週將會接續實作使用者 token 機制，完成後系統將能根據使用者的身份驗證資訊，回傳儲存在後端的最新書籤資料，進一步實現 **跨裝置同步** 的功能。

由於後端 View 涉及與 MySQL 資料庫的操作，程式碼較為冗長，詳細實作可參考 [view.py](../backend/api/views.py) 中的 `bookmarks_update_api` 與 `bookmarks_delete_api` 函式。

## 額外相關技術

這次課外的部分，我們為了預防應用程式遭受 SQL Injection 和 XSS 攻擊。以下是這次採用的相關防護措施保以及實際操作說明。

### 1. SQL Injection 防護

SQL Injection 是一種通過注入惡意 SQL 語句來攻擊資料庫的手段。配合這次的實作，我們使用 Django 提供的 ORM 來進行資料庫查詢。Django ORM 會自動處理 SQL 語句的生成，並且避免了直接寫入原生 SQL，從而有效防止了 SQL Injection 攻擊。例如：

```python
bookmark = Bookmarks.objects.filter(account=user.account, bid=bid)
```

這種方式會自動對輸入進行處理，避免了直接拼接 SQL 字串，Django ORM 自動參數化查詢，能有效防止 SQL Injection 攻擊。

### 2.XSS 攻擊

除了 SQL Injection 以外，也考慮到了 XSS 攻擊。為避免攻擊者將惡意的 JavaScript 程式碼注入到網站中，並且利用用戶瀏覽器執行。以下是我們的防護措施：

1.字串消毒處理

對所有來自用戶的輸入進行字串消毒，以確保特殊字符被轉義，並移除可能執行 JavaScript 的元素。

2.資料結構的消毒處理

除了處理單一字串外，我們也會遞迴地處理整個資料結構（如字典或列表），以確保其中的所有字串都經過清洗。這樣不僅能處理單一字串，還能處理包含字串的複雜資料結構，從而有效防止 XSS 攻擊。

```python
def sanitize_data(data):

    if isinstance(data, str):
        return sanitize_string(data)
    elif isinstance(data, list):
        return [sanitize_data(item) for item in data]
    elif isinstance(data, dict):
        return {k: sanitize_data(v) for k, v in data.items()}
    else:
        return data
```

### 3.驗證輸入資料

為了確保從用戶端接收到的資料是有效且安全的，我們對用戶提交的資料進行嚴格的驗證。在這部分，除了檢查資料的類型和長度限制外，我們也會確保所有必須的欄位都已經填寫並且資料格式正確。

```python
def validate_bookmark_request(data, require_all_fields=False):
    required_fields = {
        'time': str,
        'parent_id': int,
        'children_id': list,
        'url': str,
        'img': str,
        'name': str,
        'tags': list,
        'starred': bool,
        'hidden': bool
    }
```
這樣可以確保所有提交的資料符合預期格式，並有效防止錯誤資料的注入。



## 組員分工情形 - Team 15

- 王凱右 - 25%：額外技術實作
- 胡凱騰 - 25%：上課作業實作
- 陳立亘 - 25%：撰寫報告
- 蔡佾家 - 25%：撰寫報告
