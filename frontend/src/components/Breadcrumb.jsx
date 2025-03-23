import { useContext } from "react";
import { RootItem, BreadcrumbItem } from "./BreadcrumbItem";
import BookmarksContext from "../context/BookmarksContext";

const Breadcrumb = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const pathBookmarks = bookmarksTree.getPathToBookmark();
  const handleMoveToFolder = (id) => {
    bookmarksTree.moveToFolder(id);
  };
  return (
    <div className="bread">
      <RootItem onMoveToFolder={handleMoveToFolder} />
      {pathBookmarks.map((bookmark) => (
        <BreadcrumbItem
          key={bookmark.id}
          bookmark={bookmark}
          onMoveToFolder={handleMoveToFolder}
        />
      ))}
    </div>
  );
};

export default Breadcrumb;
