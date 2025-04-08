import { useContext, useEffect, useMemo, useRef, useState } from "react";
import MainContentItem from "./MainContentItem";
import BookmarksContext from "../context/BookmarksContext";
// import { treeStructure, idToBookmark, localDB } from "../utils/localDB.js";
import { createSwapy, utils } from "swapy";

const MainContent = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const bookmarks = bookmarksTree
    .getCurrentChildren()
    .filter((bookmark) => !bookmark.hidden)
  const currntBookmarks = bookmarks.sort((a, b) => a.rank - b.rank);
  console.log("getCurrentChildren and sort", currntBookmarks);
  const [items, setItems] = useState(() =>
    currntBookmarks.map((bookmark, index) => ({
      id: String(bookmark.rank - 1),
      title: String(index),
    }))
  );
  const [slotItemMap, setSlotItemMap] = useState(
    utils.initSlotItemMap(items, "id")
  );
  const slottedItems = useMemo(
    () => utils.toSlottedItems(items, "id", slotItemMap),
    [items, slotItemMap]
  );
  const swapyRef = useRef(null);
  const containerRef = useRef(null);

  // 當頁面內容不同時，重新設定 items
  useEffect(() => {
    console.log("load bookmarks", currntBookmarks);
    const newItems = currntBookmarks.map((bookmark, index) => ({
      id: String(bookmark.rank - 1),
      title: String(index),
    }));
    console.log("setItems", newItems);
    setItems(newItems);
  }, [JSON.stringify(bookmarks)]);
  console.log("slotItemMap", slotItemMap);

  // 當 items 改變時，重新設定 swapy 的 slotItemMap
  useEffect(() => {
    utils.dynamicSwapy(
      swapyRef.current,
      items,
      "id",
      slotItemMap,
      setSlotItemMap
    );
  }, [items]);

  useEffect(() => {
    swapyRef.current = createSwapy(containerRef.current, {
      manualSwap: true,
    });
    swapyRef.current.onSwap((event) => {
      setSlotItemMap(event.newSlotItemMap.asArray);
      console.log("slotItemMap", slotItemMap);
    });
    return () => {
      swapyRef.current && swapyRef.current.destroy();
    };
  }, []);

  // 當 slotItemMap 不是因過濾改變時，更新 bookmarksTree 的 rank
  useEffect(() => {
    if (
      !bookmarksTree.currentSearchKeyword &&
      !bookmarksTree.currentFilterTags.length
    ) {
      console.log("updateRank", slotItemMap);
      // bookmarksTree.updateRank(slotItemMap);
    } else {
      console.log("skip updateRank");
    }
  }, [slotItemMap]);

  return (
    <div className="tag-container drag-container" ref={containerRef}>
      <div className="drag-items">
        {slottedItems.map(({ slotId, itemId, item }, index) => (
          <div className="drag-slot" key={slotId} data-swapy-slot={slotId}>
            {item && (
              <div className="tag-card" data-swapy-item={itemId} key={itemId}>
                <MainContentItem
                  key={currntBookmarks[itemId].id}
                  bookmark={currntBookmarks[itemId]}
                  onToggleStar={(id) => bookmarksTree.toggleStarred(id)}
                  onMoveToFolder={(id) => bookmarksTree.moveToFolder(id)}
                  onDeleteBookmark={(id) => bookmarksTree.deleteBookmark(id)}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MainContent;
