// 載入圖片，透過 imageMap[filename] 即可取得圖片
const images = import.meta.glob("/src/assets/*.{png,jpg,jpeg,ico,svg}", {
  eager: true,
});
const imageMap = Object.fromEntries(
  Object.entries(images).map(([key, module]) => {
    const fileName = key.split("/").pop();
    return [fileName, module.default];
  })
);

export default imageMap;
