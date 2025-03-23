import imageMap from "../utils/imageMap";

const RootItem = ({ onMoveToFolder }) => {
  return (
    <div className="bread-item" onClick={() => onMoveToFolder(0)}>
      Home
    </div>
  );
};

const BreadcrumbItem = ({ bookmark, onMoveToFolder }) => {
  return (
    <>
      <img src={imageMap["next.svg"]} alt="Next Icon" />
      <div className="bread-item" onClick={() => onMoveToFolder(bookmark.id)}>
        {bookmark.name}
      </div>
    </>
  );
};

export { RootItem, BreadcrumbItem };
