import imageMap from "../utils/imageMap";

const HomeItem = ({onMoveToFolder}) => {
  return (
    <div className="bookmark-item">
      <a onClick={(e) => {
          e.preventDefault();
          onMoveToFolder(0);
        }}
      >
        <div className="title">
          <img src={imageMap["home.png"]} alt="Home" />
          <span>Home</span>
        </div>
      </a>
    </div>
  );
};

const SidebarItem = ({ item, onToggleStar, onMoveToFolder}) => {
  return (
    <div className="bookmark-item">
      <a
        href={item.url}
        target={item.url && "_blank"}
        rel="noopener noreferrer"
        onClick={(e) => {
          if (item.url === "#") {
            e.preventDefault();
            onMoveToFolder(item.id);
          }
          if (e.target.closest(".hidden-setting")) {
            e.preventDefault();
          }
        }}
      >
        <div className="title">
          <img src={imageMap[item.img]} alt={item.name} />
          <span>{item.name}</span>
        </div>
        <div className="hidden-setting">
          <img
            src={imageMap["full_star.png"]}
            alt="Star Icon"
            onClick={(e) => {
              e.preventDefault();
              onToggleStar(item.id);
            }}
          />
        </div>
      </a>
    </div>
  );
};

export { HomeItem, SidebarItem };
