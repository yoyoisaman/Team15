import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import MainContentItem from "./MainContentItem";

const MainContent = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const bookmarks = bookmarksTree.getCurrentChildren();
  console.log(bookmarks);
  const handleToggleStar = (id) => {
    bookmarksTree.toggleStarred(id);
  };

  return (
    <div className="tag-container">
      {bookmarks.map((bookmark) => (
        <MainContentItem
          key={bookmark.id}
          bookmark={bookmark}
          onToggleStar={handleToggleStar}
        />
      ))}
    </div>
  );
};

export default MainContent;
