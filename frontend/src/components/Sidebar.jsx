import { useContext } from "react";
import { HomeItem, SidebarItem } from "./SidebarItem";
import BookmarksContext from "../context/BookmarksContext";

const Sidebar = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const starredBookmarks = bookmarksTree.getStarredBookmarks();

  const handleToggleStar = (id) => {
    bookmarksTree.filterBookmarksByTags([]); // 清空篩選標籤
    bookmarksTree.toggleStarred(id);
  };
  const handleMoveToFolder = (id) => {
    bookmarksTree.filterBookmarksByTags([]); // 清空篩選標籤
    bookmarksTree.moveToFolder(id);
  };

  return (
    <div className="sidebar d-none d-lg-block">
      <HomeItem onMoveToFolder={handleMoveToFolder} />
      {starredBookmarks.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          onToggleStar={handleToggleStar}
          onMoveToFolder={handleMoveToFolder}
        />
      ))}
    </div>
  );
};

export default Sidebar;
