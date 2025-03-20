import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import SidebarItem from "./SidebarItem";

const Sidebar = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const starredBookmarks = bookmarksTree.getStarredBookmarks();

  const handleToggleStar = (id) => {
    bookmarksTree.toggleStarred(id);
  };

  return (
    <div className="sidebar d-none d-lg-block">
      {starredBookmarks.map((item) => (
        <SidebarItem
          key={item.id}
          item={item}
          onToggleStar={handleToggleStar}
        />
      ))}
    </div>
  );
};

export default Sidebar;
