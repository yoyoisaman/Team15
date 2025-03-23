import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import MainContentItem from "./MainContentItem";

const MainContent = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const bookmarks = bookmarksTree.getCurrentChildren().filter(bookmark => !bookmark.hidden);
  const handleToggleStar = (id) => {
    bookmarksTree.toggleStarred(id);
  };
  const handleMoveToFolder = (id) => {
    bookmarksTree.moveToFolder(id);
  }
  const handleDeleteBookmark = (id) => {
    bookmarksTree.deleteBookmark(id);
  }
  return (
    <div className="tag-container">
      {bookmarks.map((bookmark) => (
        <MainContentItem
          key={bookmark.id}
          bookmark={bookmark}
          onToggleStar={handleToggleStar}
          onMoveToFolder={handleMoveToFolder}
          onDeleteBookmark={handleDeleteBookmark}
        />
      ))}
    </div>
  );
};

export default MainContent;
