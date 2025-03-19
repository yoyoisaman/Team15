import { useContext } from "react";
import BookmarksContext from "../context/BookmarksContext";
import imageMap from "../utils/imageMap";

const Sidebar = () => {
  const { bookmarksTree } = useContext(BookmarksContext);
  const starredBookmarks = bookmarksTree.getStarredBookmarks();

  return (
    <div className="sidebar d-none d-lg-block">
      {starredBookmarks.map((item, idx) => (
        <div className="bookmark-item" key={idx}>
          <a href={item.url} target={item.url && "_blank"}>
            <div className="title">
              <img src={imageMap[item.img]} alt={item.name} />
              <span>{item.name}</span>
            </div>
            <div className="hidden-setting">
              <img src={imageMap["full_star.png"]} alt="Settings Icon" />
              <img src={imageMap["edit.png"]} alt="Settings Icon" />
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default Sidebar;
