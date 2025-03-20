import imageMap from "../utils/imageMap";

const MainContentItem = ({ bookmark, onToggleStar }) => {
  const handleClick = (e) => {
    if (bookmark.url === "#") {
      e.preventDefault();
    }
    if (e.target.matches(".tags span") || e.target.closest(".hidden-setting")) {
      e.preventDefault();
    }
  };

  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="tag-card"
      onClick={handleClick}
    >
      <div className="hidden-setting">
        <img
          src={imageMap[bookmark.starred ? "full_star.png" : "empty_star.png"]}
          alt="Star Icon"
          onClick={(e) => {
            e.preventDefault();
            onToggleStar(bookmark.id);
          }}
        />
        <img src={imageMap["edit.png"]} alt="Edit Icon" />
      </div>
      <div className="title">
        <img src={imageMap[bookmark.img]} alt={bookmark.name} />
        {bookmark.name}
      </div>
      <div className="tags">
        {bookmark.tags.map((tag, tagIdx) => (
          <span key={tagIdx} className="badge bg-secondary">
            {tag}
          </span>
        ))}
      </div>
    </a>
  );
};

export default MainContentItem;
