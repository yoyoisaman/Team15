import imageMap from "../utils/imageMap";

const MainContentItem = ({
  bookmark,
  onToggleStar,
  onMoveToFolder,
  onDeleteBookmark,
}) => {
  const handleClick = (e) => {
    if (e.target.matches(".tags span")) {
      // 點擊 tag
      e.preventDefault();
    } else if (e.target.name === "delete") {
      // 點擊 bin
      e.preventDefault();
      onDeleteBookmark(bookmark.id);
    } else if (e.target.name === "star") {
      // 點擊 star
      e.preventDefault();
      onToggleStar(bookmark.id);
    } else if (bookmark.url === "#") {
      // 點擊其他地方，但是是資料夾
      e.preventDefault();
      onMoveToFolder(bookmark.id);
    }
  };
  return (
    <div
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="tag-card"
      onClick={handleClick}
    >
      <div style={{ display: "flex", justifyContent: "space-between"}}>
        <div className="title">
          <img src={imageMap[bookmark.img]} alt={bookmark.name} />
          {bookmark.name}
        </div>
        <div className="hidden-setting">
          <img
            src={imageMap[bookmark.starred ? "full_star.png" : "empty_star.png"]}
            alt="Star Icon"
            name="star"
          />
          <img src={imageMap["delete.png"]} alt="Delete Icon" name="delete" />
        </div>
      </div>
      <div className="tags">
        {bookmark.tags.map((tag, tagIdx) => (
          <span key={tagIdx} className="badge bg-secondary">
            {tag}
          </span>
        ))}
      </div>
    </div>
    
  );
};

export default MainContentItem;
