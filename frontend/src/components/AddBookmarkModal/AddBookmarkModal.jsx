import { useState, useContext } from "react";
import BookmarksContext from "../../context/BookmarksContext";
import './AddBookmarkModal.css';

const AddBookmarkModal = ({ onClose, currentFilterTags }) => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [faviconUrl, setFaviconUrl] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const hidden = currentFilterTags.length > 0 && !currentFilterTags.some(tag => tags.includes(tag));
    const newBookmark = { name, url, tags, img: faviconUrl, hidden };
    bookmarksTree.addBookmark(newBookmark);
    onClose();
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    fetchFavicon(newUrl);
  };

  const fetchFavicon = (websiteUrl) => {
    try {
      const urlObj = new URL(websiteUrl);
      const domain = urlObj.origin;
      const faviconPath = `${domain}/favicon.ico`;
      setFaviconUrl(faviconPath);
    } catch (error) {
      console.error("Invalid URL:", error);
      setFaviconUrl("");
    }
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
              onChange={handleUrlChange}
              required
            />
          </div>
          {faviconUrl && (
            <div className="form-group">
              <label>網站圖標預覽:</label>
              <img src={faviconUrl} alt="網站圖標預覽" className="favicon-preview" />
            </div>
          )}
          <div className="form-group">
            <label>標籤名稱:</label>
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
              />
              <button type="button" onClick={handleAddTag}>新增</button>
            </div>
            <div className="tags-list">
              {tags.map((tag, index) => (
                <span key={index} className="tag">
                  {tag}
                  <button type="button" onClick={() => handleRemoveTag(tag)}>x</button>
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

export default AddBookmarkModal;