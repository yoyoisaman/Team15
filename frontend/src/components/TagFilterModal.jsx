import { useState, useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import './AddBookModal/AddBookmarkModal.css';

const TagFilterModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [selectedTags, setSelectedTags] = useState([]);

  const handleTagClick = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    bookmarksTree.filterBookmarksByTags(selectedTags);
    onClose();
  };

  const allTags = Array.from(
    new Set(Object.values(bookmarksTree.idToBookmark).flatMap((bookmark) => bookmark.tags))
  );

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>篩選標籤:</label>
            <div className="tags-container">
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`tag ${selectedTags.includes(tag) ? "selected" : ""}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">確認</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagFilterModal;