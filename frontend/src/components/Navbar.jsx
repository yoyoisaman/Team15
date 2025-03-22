import { useState } from "react";
import imageMap from "../utils/imageMap";
import AddBookmarkModal from "./AddBookModal/AddBookmarkModal";
import TagFilterModal from "./TagFilterModal";
const Navbar = () => {
  // 新增選單相關
  const [showModal, setShowModal] = useState(false);
  const handleAddButtonClick = () => {
    setShowModal(true);
  };
  // 篩選tag相關
  const [showTagFilterModal, setShowTagFilterModal] = useState(false);
  const handleTagFilterButtonClick = () => {
    setShowTagFilterModal(true);
  };

  return (
    <nav className="d-flex flex-wrap gap-2">
      <div className="search-bar flex-shrink-0 col-12 col-md-5 col-lg-4">
        <input type="text" placeholder="搜尋書籤、資料夾" />
      </div>
      <div className="d-flex justify-content-center align-items-center gap-2">
        <button className="btn btn-outline-secondary d-flex align-items-center">
          <img src={imageMap["sort.png"]} alt="Sort Icon" />
          <span>排序與檢視</span>
        </button>
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={handleTagFilterButtonClick}
        >
          <img src={imageMap["tag.png"]} alt="Tag Icon" />
          <span>篩選標籤</span>
        </button>
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={handleAddButtonClick}
        >
          <img src={imageMap["add.png"]} alt="Add Button" />
        </button>
      </div>
      {showModal && <AddBookmarkModal onClose={() => setShowModal(false)} />}
      {showTagFilterModal && <TagFilterModal onClose={() => setShowTagFilterModal(false)} />}
    </nav>
  );
};

export default Navbar;