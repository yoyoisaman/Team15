import imageMap from "../utils/imageMap";

const SidebarItem = ({ item, onToggleStar }) => {
  return (
    <div className="bookmark-item">
      <a href={item.url} target={item.url && "_blank"} rel="noopener noreferrer">
        <div className="title">
          <img src={imageMap[item.img]} alt={item.name} />
          <span>{item.name}</span>
        </div>
        <div className="hidden-setting">
          <img
            src={imageMap["full_star.png"]}
            alt="Star Icon"
            onClick={(e) => {
              e.preventDefault(); // 避免觸發 <a> 的點擊事件
              onToggleStar(item.id);
            }}
          />
          <img src={imageMap["edit.png"]} alt="Edit Icon" />
        </div>
      </a>
    </div>
  );
};

export default SidebarItem;
