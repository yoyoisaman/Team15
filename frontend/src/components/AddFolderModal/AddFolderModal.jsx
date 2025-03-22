import { useState, useContext } from "react";
import BookmarksContext from "../../context/BookmarksContext";
import './AddFolderModal.css';

const AddFolderModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [name, setName] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const currentFilterTags = bookmarksTree.getCurrentFilterTags();
    const hidden = currentFilterTags.length > 0 && !currentFilterTags.some(tag => tags.includes(tag));
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
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>新增資料夾名稱:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>標籤名稱:</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="新增標籤"
              />
              <button type="button" onClick={handleAddTag}>新增</button>
            </div>
            <div className="tags-list">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button type="button" className="remove-tag-button" onClick={() => handleRemoveTag(tag)}>x</button>
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

export default AddFolderModal;