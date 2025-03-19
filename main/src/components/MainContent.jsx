import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import imageMap from "../utils/imageMap";

const MainContent = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const bookmarks = bookmarksTree.getCurrentBookmarks();

  return (
    <div className="tag-container">
      {bookmarks.map((bookmark, idx) => (
        <div className="tag-card" key={idx}>
          <div className="hidden-setting">
            <img
              src={
                imageMap[bookmark.starred ? "full_star.png" : "empty_star.png"]
              }
              alt="Settings Icon"
            />
            <img src={imageMap["edit.png"]} alt="Settings Icon" />
          </div>
          <a href={bookmark.url} target="_blank">
            <div className="title">
              <img src={imageMap[bookmark.img]} alt={bookmark.name} />
              {bookmark.name}
            </div>
          </a>
          <div className="tags">
            {bookmark.tags.map((tag, tagIdx) => (
              <span key={tagIdx} className="badge bg-secondary">
                {tag}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MainContent;
