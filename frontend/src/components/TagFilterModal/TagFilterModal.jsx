import { useState, useContext } from "react";
import BookmarksContext from "../../context/BookmarksContext";
import styles from './TagFilterModal.module.css';

const TagFilterModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [selectedTags, setSelectedTags] = useState([]);

  const handleTagClick = (tag) => {
    setSelectedTags((prevTags) =>
      prevTags.includes(tag)
        ? prevTags.filter((t) => t !== tag)
        : [...prevTags, tag],
    );
  };

  const applyTagFilter = () => {
    const tagsToFilter = selectedTags.length === 0 ? allTags : selectedTags;
    bookmarksTree.filterBookmarksByTags(tagsToFilter);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    applyTagFilter();
    onClose();
  };

  const handleClose = () => {
    bookmarksTree.filterBookmarksByTags([]);
    onClose();
  };

  const allTags = Array.from(
    new Set(
      Object.values(bookmarksTree.idToBookmark).flatMap(
        (bookmark) => bookmark.tags,
      ),
    ),
  );

  function handleBackdropClick() {
    onClose();
  }

  function stopBackdropClick(event) {
    event.stopPropagation();
  }

  return (
    <div className={styles['modal']} onClick={handleBackdropClick}>
      <div className={styles['modal-content']} onClick={stopBackdropClick}>
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label style={{ fontSize: '1.15rem' }}>篩選標籤</label>
            <div className={styles['tags-container']}>
              {allTags.map((tag) => (
                <span
                  key={tag}
                  className={`${styles['tag']} ${selectedTags.includes(tag) ? styles['selected'] : ''}`}
                  onClick={() => handleTagClick(tag)}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
          <div className={styles['form-actions']}>
            <button
              type="button"
              className={`btn btn-secondary ${styles['btn-secondary']}`}
              onClick={handleClose}
            >
              取消
            </button>
            <button type="submit" className={`btn btn-primary ${styles['btn-primary']}`}>
              確認
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TagFilterModal;
