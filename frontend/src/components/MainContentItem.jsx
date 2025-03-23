import imageMap from "../utils/imageMap";

const MainContentItem = ({
  bookmark,
  onToggleStar,
  onMoveToFolder,
  onDeleteBookmark,
}) => {
  const isUrl = (str) => {
    try {
      new URL(str);
      return true;
    } catch (_) {
      return false;
    }
  };
  const imgSrc = isUrl(bookmark.img) ? bookmark.img : imageMap[bookmark.img];
  return (
    <a
      href={bookmark.url}
      target="_blank"
      rel="noopener noreferrer"
      className="tag-card"
      onClick={(e) => {
        if (bookmark.url === "#") {
          e.preventDefault();
          onMoveToFolder(bookmark.id);
        }
        if (
          e.target.matches(".tags span") ||
          e.target.closest(".hidden-setting")
        ) {
          e.preventDefault();
        }
      }}
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
        <img
          src={imageMap["delete.png"]}
          alt="Edit Icon"
          onClick={(e) => {
            e.preventDefault();
            onDeleteBookmark(bookmark.id);
          }}
        />
      </div>
      <div className="title">
        <img src={imgSrc} alt={bookmark.name} />
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
