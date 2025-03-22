class BookmarksTree {
  constructor(treeStructure = null, idToBookmark = null, onUpdate) {
    // 以 map 紀錄樹狀結構：node id -> { parent_id, children_id }
    this.treeStructure = { 0: { parent_id: null, children_id: [] } };
    // 以 map 紀錄書籤資訊：node id -> bookmark
    this.idToBookmark = {};
    // 當前所在的 node id
    this.currentNode = 0;
    // 通知 React 更新的函式
    this.onUpdate = onUpdate;
    // 紀錄目前的tag
    this.currentFilterTags = []
    if (treeStructure && idToBookmark) {
      this._buildTree(treeStructure, idToBookmark);
    }
  }

  // 深拷貝 treeStructure 和 idToBookmark
  _buildTree(treeStructure, idToBookmark) {
    this.idToBookmark = { ...idToBookmark };
    this.treeStructure = {};
    for (const id in treeStructure) {
      const node = treeStructure[id];
      this.treeStructure[id] = {
        parent_id: node.parent_id,
        children_id: [...node.children_id],
      };
    }
  }

  // 取得快速存取的書籤，即 starred == true 的書籤，回傳 bookmark array
  getStarredBookmarks() {
    return Object.values(this.idToBookmark).filter(bookmark => bookmark.starred);
  }

  // 對 node id 的 srarred 屬性取反，並通知 React 更新
  toggleStarred(id) {
    this.idToBookmark[id].starred = !this.idToBookmark[id].starred;
    this.onUpdate();
  }

  // 取得當前位置(currentNode)下的書籤，回傳 bookmark array
  getCurrentChildren() {
    return this.treeStructure[this.currentNode].children_id
      .map(id => this.idToBookmark[id]);
  }

  // 取得當前位置(currentNode)的父節點，回傳 node id
  getCurrentParent() {
    return this.treeStructure[this.currentNode].parent_id;
  }

  // 移動到 node id，並通知 React 更新
  moveToFolder(id) {
    this.currentNode = id;
    this.onUpdate();
  }

  // 插入一個書籤，並通知 React 更新
  addBookmark({ name, url, tags, img, hidden }) {
    const id = Date.now(); // 使用當前時間戳作為唯一 ID
    this.idToBookmark[id] = {
      id,
      name,
      url,
      tags,
      img,
      starred: false,
      hidden: hidden || false,
    };
    this.treeStructure[this.currentNode].children_id.push(id);
    this.onUpdate();
  }

  // 根據你傳入的書籤，對網頁渲染
  filterBookmarksByTags(tags) {
    this.currentFilterTags = tags;
    for (const id in this.idToBookmark) {
      const bookmark = this.idToBookmark[id];
      bookmark.hidden = !tags.some((tag) => bookmark.tags.includes(tag));
    }
    this.onUpdate();
  }

  // 插入一個資料夾，並通知 React 更新
  addFolder({ name, tags, hidden }) {
    const id = Date.now(); // 使用當前時間戳作為唯一 ID
    this.idToBookmark[id] = {
      id,
      name,
      url: "#",
      tags,
      img: "folder.png",
      starred: false,
      hidden: hidden || false,
    };
    this.treeStructure[id] = { parent_id: this.currentNode, children_id: [] };
    this.treeStructure[this.currentNode].children_id.push(id);
    this.onUpdate();
  }

  // 取得現在的標籤篩選狀態
  getCurrentFilterTags() {
    return this.currentFilterTags || [];
  }


}

export default BookmarksTree;
