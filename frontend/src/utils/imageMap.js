// 載入圖片，透過 imageMap[filename] 即可取得圖片
const assetImages = import.meta.glob("/src/assets/*.{png,jpg,jpeg,ico,svg}", {
  eager: true,
});
const assetImageMap = Object.fromEntries(
  Object.entries(assetImages).map(([key, module]) => {
    const fileName = key.split("/").pop();
    return [fileName, module.default];
  }),
);

const imageMapHandler = {
  get(map, key) {
    if (key in map) {
      return map[key];
    }
    
    try {
      new URL(key);
      return key
    } catch (_) {
      return ""
    }
  },
};

const imageMap = new Proxy(assetImageMap, imageMapHandler);

export default imageMap;
