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
    this.currentFilterTags = [];
    // 紀錄目前的搜尋關鍵字
    this.currentSearchKeyword = "";
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
    return Object.values(this.idToBookmark).filter(
      (bookmark) => bookmark.starred,
    );
  }

  // 對 node id 的 srarred 屬性取反，並通知 React 更新
  toggleStarred(id) {
    this.idToBookmark[id].starred = !this.idToBookmark[id].starred;
    this.onUpdate();
  }

  // 取得當前位置(currentNode)下的書籤，回傳 bookmark array
  getCurrentChildren() {
    return this.treeStructure[this.currentNode].children_id.map(
      (id) => this.idToBookmark[id],
    );
  }

  // 取得當前位置(currentNode)的父節點，回傳 node id
  getCurrentParent() {
    return this.treeStructure[this.currentNode].parent_id;
  }

  // 取得從 root 走到 currentNode 的路徑，回傳 bookmark array
  getPathToBookmark() {
    const path = [];
    let current = this.currentNode;
    while (current !== 0) {
      path.unshift(this.idToBookmark[current]);
      current = this.treeStructure[current].parent_id;
    }
    return path;
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
    this.treeStructure[id] = { parent_id: this.currentNode, children_id: [] };
    this.onUpdate();
  }

  // 遞迴刪除 node id 以下的所有節點(含自身)，並通知 React 更新
  deleteBookmark(id) {
    const _deleteBookmark = (node_id) => {
      if (this.treeStructure[node_id].children_id.length > 0) {
        const children_ids = [...this.treeStructure[node_id].children_id];
        for (const child_id of children_ids) {
          _deleteBookmark(child_id);
        }
      }
      const parent_id = this.treeStructure[node_id].parent_id;
      this.treeStructure[parent_id].children_id = this.treeStructure[
        parent_id
      ].children_id.filter((child_id) => child_id !== node_id);
      delete this.treeStructure[node_id];
      delete this.idToBookmark[node_id];
    };
    _deleteBookmark(id);
    this.onUpdate();
  }

  // 根據你傳入的標籤，對網頁渲染
  filterBookmarksByTags(tags) {
    this.currentFilterTags = tags;
    this.applyFilters();
  }

  // 根據關鍵字過濾書籤和資料夾
  filterBookmarksByKeyword(keyword) {
    this.currentSearchKeyword = keyword;
    this.applyFilters();
  }

  // 同時應用搜尋和篩選
  applyFilters() {
    const lowerKeyword = this.currentSearchKeyword.toLowerCase();
    const currentFilterTags = this.getCurrentFilterTags();
    for (const id in this.idToBookmark) {
      const bookmark = this.idToBookmark[id];
      const matchesKeyword =
        bookmark.name.toLowerCase().includes(lowerKeyword) ||
        bookmark.tags.some((tag) => tag.toLowerCase().includes(lowerKeyword));
      const matchesTags =
        currentFilterTags.length === 0 ||
        currentFilterTags.some((tag) => bookmark.tags.includes(tag));
      bookmark.hidden = !(matchesKeyword && matchesTags);
    }
    this.onUpdate();
  }

  // 取得現在的標籤篩選狀態
  getCurrentFilterTags() {
    return this.currentFilterTags || [];
  }
}

export default BookmarksTree;