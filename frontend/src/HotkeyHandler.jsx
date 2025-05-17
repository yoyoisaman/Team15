import { useContext, useEffect } from "react";
import BookmarksContext from "./context/BookmarksContext";

export default function HotkeyHandler() {
  const { bookmarksTree } = useContext(BookmarksContext);

  useEffect(() => {
    const handleHotkey = (e) => {
      if (e.ctrlKey && e.key >= '1' && e.key <= '9') {
        e.preventDefault();  // 阻止瀏覽器的預設熱鍵行為
        
        const idx = parseInt(e.key, 10) - 1;
        const visible = bookmarksTree.getCurrentChildren().filter(b => !b.hidden);
        if (idx < visible.length) {
          const item = visible[idx];
          if (item.url === "#") {
            bookmarksTree.moveToFolder(item.id);
          } else {
            window.open(item.url, "_blank");
          }
        }
      }

      if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        document.querySelector('input[type="text"]').focus();
      }

      if (e.ctrlKey && e.key === 'f') { // 當 Ctrl+F 被按下
        e.preventDefault();  // 防止瀏覽器的預設行為
        const addFolderButton = document.querySelector('[data-add-folder-button]'); // 在Navbar中設定一個data屬性來識別按鈕
        if (addFolderButton) {
          addFolderButton.click();  // 模擬點擊新增資料夾按鈕
        }
      }

            // Ctrl + B 開啟新增書籤
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();  // 防止瀏覽器的預設行為
        const addBookmarkButton = document.querySelector('[data-add-bookmark-button]');  // 在Navbar中設定一個data屬性來識別按鈕
        if (addBookmarkButton) {
          addBookmarkButton.click();  // 模擬點擊新增書籤按鈕
        }
      }

            // Ctrl + I 開啟匯入匯出
      if (e.ctrlKey && e.key === 'i') {
        e.preventDefault();  // 防止瀏覽器的預設行為
        const importExportButton = document.querySelector('[data-import-export-button]');  // 在Navbar中設定一個data屬性來識別匯入匯出按鈕
        if (importExportButton) {
          importExportButton.click();  // 模擬點擊匯入匯出按鈕
        }
      }
      
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [bookmarksTree]);

  return null;
}
