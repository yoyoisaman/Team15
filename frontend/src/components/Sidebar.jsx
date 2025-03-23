import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import { HomeItem, SidebarItem } from "./SidebarItem";

const Sidebar = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const starredBookmarks = bookmarksTree.getStarredBookmarks();

  const handleToggleStar = (id) => {
    bookmarksTree.toggleStarred(id);
  };
  const handleMoveToFolder = (id) => {
    bookmarksTree.moveToFolder(id);
  }

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
