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
      
    };

    window.addEventListener("keydown", handleHotkey);
    return () => window.removeEventListener("keydown", handleHotkey);
  }, [bookmarksTree]);

  return null;
}
