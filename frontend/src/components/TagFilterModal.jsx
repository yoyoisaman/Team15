import { useState, useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import "./AddBookModal/AddBookmarkModal.css";

const TagFilterModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [selectedTags, setSelectedTags] = useState([]);

  // 處理標籤點擊事件
  const handleTagClick = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag) ? prevTags.filter((t) => t !== tag) : [...prevTags, tag]
    );
  };

  // 處理篩選提交
  // 都不選就讓它全部顯示
  const applyTagFilter = () => {
    const tagsToFilter = selectedTags.length === 0 ? allTags : selectedTags;
    bookmarksTree.filterBookmarksByTags(tagsToFilter);
  };

  // 確認篩選
  const handleSubmit = (e) => {
    e.preventDefault();
    applyTagFilter();
    onClose();
  };

  // 關閉視窗時套用篩選
  const handleClose = () => {
    applyTagFilter();
    onClose();
  };

  // 獲取所有標籤
  const allTags = Array.from(
    new Set(Object.values(bookmarksTree.idToBookmark).flatMap((bookmark) => bookmark.tags))
  );

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={handleClose}>
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
            <button type="button" className="btn btn-secondary" onClick={handleClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagFilterModal;
