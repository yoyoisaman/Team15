import { useState, useContext } from "react";
import BookmarksContext from "../../context/BookmarksContext";
import styles from './AddFolderModal.module.css';

const AddFolderModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentFilterTags = bookmarksTree.getCurrentFilterTags();
    const hidden =
      currentFilterTags.length > 0 &&
      !currentFilterTags.some((tag) => tags.includes(tag));
    const newFolder = { name, tags, hidden };
    bookmarksTree.addFolder(newFolder);
    onClose();
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

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
            <label>新增資料夾名稱</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className={styles['form-group']}>
            <label>標籤</label>
            <div className={styles['tag-input-container']}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <button type="button" onClick={handleAddTag}>
                新增
              </button>
            </div>
            <div className={styles['tags-list']}>
              {tags.map((tag, index) => (
                <span key={index} className={styles['tag']}>
                  {tag}
                  <button
                    type="button"
                    className={styles['remove-tag-button']}
                    onClick={() => handleRemoveTag(tag)}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className={styles['form-actions']}>
            <button
              type="button"
              className={`btn btn-secondary ${styles['btn-secondary']}`}
              onClick={onClose}
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

export default AddFolderModal;
