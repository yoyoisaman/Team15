import { useState, useContext } from "react";
import BookmarksContext from "../../context/BookmarksContext";
import './AddBookmarkModal.css';

const AddBookmarkModal = ({ onClose }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tags, setTags] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    bookmarksTree.addBookmark({ name, url, tags: tags.split(",") });
    onClose();
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>
          &times;
        </span>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>新增書籤名稱:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>連接網址:</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>標籤名稱:</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              required
            />
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">新增</button>
            <button type="button" className="btn btn-secondary" onClick={onClose}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddBookmarkModal;