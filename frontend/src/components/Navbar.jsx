import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom"; // LOGIN
import imageMap from "../utils/imageMap";
import AddBookmarkModal from "./AddBookmarkModal/AddBookmarkModal";
import AddFolderModal from "./AddFolderModal/AddFolderModal";
import TagFilterModal from "./TagFilterModal/TagFilterModal";
import BookmarksContext from "../context/BookmarksContext";

const Navbar = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const handleLoginClick = () => {
    window.location.href = "/login"; 
  };
   // LOGIN

  // 新增書籤相關
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  const handleAddBookmarkButtonClick = () => {
    setShowBookmarkModal(true);
  };

  // 新增資料夾相關
  const [showFolderModal, setShowFolderModal] = useState(false);
  const handleAddFolderButtonClick = () => {
    setShowFolderModal(true);
  };

  // 篩選tag相關
  const [showTagFilterModal, setShowTagFilterModal] = useState(false);
  const handleTagFilterButtonClick = () => {
    setShowTagFilterModal(true);
  };

  // 獲取當前篩選標籤
  const currentFilterTags = bookmarksTree.getCurrentFilterTags();

  // 獲取所有標籤
  const allTags = Array.from(
    new Set(
      Object.values(bookmarksTree.idToBookmark).flatMap(
        (bookmark) => bookmark.tags,
      ),
    ),
  );

  // 檢查篩選標籤是否有效
  const isFilterActive =
    currentFilterTags.length > 0 && currentFilterTags.length < allTags.length;

  // 搜尋相關
  const [searchInput, setSearchInput] = useState("");
  const handleSearchInputChange = (e) => {
    const keyword = e.target.value;
    setSearchInput(keyword);
    bookmarksTree.filterBookmarksByKeyword(keyword);
  };

  return (
    <nav className="d-flex flex-wrap gap-2">
      <div className="search-bar flex-shrink-0 col-12 col-md-5 col-lg-4">
        <input
          type="text"
          placeholder="搜尋書籤、資料夾"
          value={searchInput}
          onChange={handleSearchInputChange}
        />
      </div>
      <div className="d-flex justify-content-center align-items-center gap-2">
        {/* <button className="btn btn-outline-secondary d-flex align-items-center">
          <img src={imageMap["sort.png"]} alt="Sort Icon" />
          <span>排序與檢視</span>
        </button> */}
        <button
          className={`btn d-flex align-items-center ${isFilterActive ? "btn-dark" : "btn-outline-secondary"}`}
          onClick={handleTagFilterButtonClick}
        >
          <img src={imageMap["tag.png"]} alt="Tag Icon" />
          <span>篩選標籤</span>
        </button>
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={handleAddBookmarkButtonClick}
        >
          <img src={imageMap["add.png"]} alt="Add Button" />
        </button>
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={handleAddFolderButtonClick}
        >
          <img src={imageMap["folder.png"]} alt="Add Folder Button" />
        </button>
        <button
          className="btn btn-outline-secondary d-flex align-items-center"
          onClick={handleLoginClick}
        >
          <img src={imageMap["login.png"]} alt="Login Icon" />
          <span>登入</span>
        </button>

      </div>
      {showBookmarkModal && (
        <AddBookmarkModal
          onClose={() => setShowBookmarkModal(false)}
          currentFilterTags={currentFilterTags}
        />
      )}
      {showFolderModal && (
        <AddFolderModal onClose={() => setShowFolderModal(false)} />
      )}
      {showTagFilterModal && (
        <TagFilterModal onClose={() => setShowTagFilterModal(false)} />
      )}
    </nav>
  );
};

export default Navbar;
