import { createContext, useState, useRef } from "react";
import BookmarksTree from "./BookmarksTree.js";
import { username, treeStructure, idToBookmark, localDB } from "../utils/localDB.js";

const BookmarksContext = createContext();

export function BookmarksProvider({ children }) {
  const [, forceUpdate] = useState(0);
  const bookmarksTreeRef = useRef(
    new BookmarksTree(username, treeStructure, idToBookmark, localDB, () => {
      forceUpdate((n) => n + 1);
    }),
  );

  return (
    <BookmarksContext.Provider
      value={{ bookmarksTree: bookmarksTreeRef.current }}
    >
      {children}
    </BookmarksContext.Provider>
  );
}

export default BookmarksContext;
