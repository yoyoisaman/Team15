import { createContext, useState, useRef } from "react";
import BookmarksTree from "./BookmarksTree.js";
import { treeStructure, idToBookmark } from "../utils/tempDb.js"; // 模擬資料庫

const BookmarksContext = createContext();

export function BookmarksProvider({ children }) {
  const [, forceUpdate] = useState(0);
  const bookmarksTreeRef = useRef(new BookmarksTree(treeStructure, idToBookmark, () => forceUpdate(n => n + 1)));

  return (
    <BookmarksContext.Provider value={{ bookmarksTree: bookmarksTreeRef.current }}>
      {children}
    </BookmarksContext.Provider>
  );
}

export default BookmarksContext;