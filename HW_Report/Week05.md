# 進度報告 - Team 15, Week 5

在本次的作業中，我們基於上次報告的介面展示，加入JavaScript完備其功能性，並採用React對網頁進行動態渲染，同時為後續加入伺服器端功能奠定基礎。

## 課內技術練習

此次我們透過建立React的component與JSX語法將網頁整體模組化，使用者的操作透過各種事件註冊觸發JaveScript function，更新JaveScript object內的各項成員變數，並透過React useState動態更新頁面，即時反應使用者的操作，更多使用到的技術請參考後方「額外相關技術」。

接下來將說明並展示此次所完成的功能。

![img1](./report_imgs/Week05/img1.png)

### 區域 I：書籤陳列區

在此區中會展示使用者所建立的書籤與資料夾，使用JaveScript object儲存每筆資料，並抽象化引入資料的過程，為加入伺服器端功能奠定基礎。

當鼠標停滯於書籤或資料夾方塊時，右上方會顯示刪除書籤與加入捷徑的功能圖標，透過點擊圖標使用這兩個功能。

直接點擊方塊則會在新頁面中開啟該書籤，若為資料夾，則此區會跳轉至資料夾內，顯示該資料夾的書籤或資料夾。

因為使用者可以建立巢狀資料夾，所以在此區的最上方會顯示當前目錄，並可以透過點擊跳轉至指定目錄。

![img2](./report_imgs/Week05/img2.gif)

### 區域 II：功能區

在功能區中主要提供兩方面的功能，新增書籤或資料夾，與篩選書籤陳列區的顯示內容。

在新增方面，不論書籤或資料夾都可以給予多個自訂的標籤，而新增的物件會被置於當前目錄下。在新增書籤時，會透過Google API抓取favicon作為書籤圖標展示。

![img3](./report_imgs/Week05/img3.gif)

在篩選方面，使用者可以透過搜尋列尋找指定名稱的書籤與資料夾，也能搜尋標籤名稱。

「篩選標籤」則是能透過選取的方式篩選要顯示的標籤。

![img5](./report_imgs/Week05/img5.gif)
※「排序與檢視」功能尚未完善，故在本次作業中暫無展示。

### 區域 III：側邊捷徑區

在書籤陳列區中被加入捷徑的書籤與資料夾會放在此區中，透過點擊能快速取用書籤，或快速跳轉至目標資料夾，最上方的「home」可以讓使用者快速跳轉至根目錄。

## 額外相關技術

### 1. React - context and useRef

Context為React所提供的功能之一，類似於全域變數，context可以更簡便的在各個component中使用，不需透過prop一層層傳遞。我們透過context管理所有書籤與資料夾的內容與整體資料夾的樹狀結構，令各個component能方便的存取需要顯示的內容。

useRef與useState是相似的概念，旨在維護不被re-render影響的變數，但useRef相對於useState，在變數改變時並不會re-render頁面，故透過useRef與useState混合使用，我們得以在顯示的資料有所變動時才re-render頁面，以此達到更好的效能。

### 2. Prettier

Prettier是用於統一程式碼風格的工具，在開發過程中未統一的撰寫風格透過Prettier得以統合，例如下面的例子所示。

```jsx
// before
return (
    <BookmarksContext.Provider value={{ bookmarksTree: bookmarksTreeRef.current }}>
    ...
)
```
```jsx
// after
return (
    <BookmarksContext.Provider
        value={{ bookmarksTree: bookmarksTreeRef.current }}
    >
    ...
)
```

### 3. JaveScript - Vite and Proxy

透過Vite中的`import.meta.glob`實現簡便的載入所需的資源，且能確保在使用前載入完成。

Proxy則為JaveScript object操作帶來更多彈性，能夠對鑑值進行更多判斷並決定對應操作。

## 組員分工情形 - Team 15

- 王凱右 - 25%：JaveScript、功能列設計
- 胡凱騰 - 25%：撰寫報告、bugfix
- 陳立亘 - 25%：JaveScript
- 蔡佾家 - 25%：JaveScript、整體架構
