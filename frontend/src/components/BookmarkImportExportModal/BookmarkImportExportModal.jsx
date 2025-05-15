import React, { useRef } from "react";
import styles from './BookmarkImportExportModal.module.css';

const BookmarkImportExportModal = ({ onClose, bookmarksTree }) => {
  const fileInputRef = useRef();

  const handleExport = () => {
    const data = {
      treeStructure: bookmarksTree.treeStructure,
      idToBookmark: bookmarksTree.idToBookmark,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookmarks_export.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  function adjustIds(treeStructure, idToBookmark) {
    // 隨機偏移量
    const offset = Math.floor(Math.random() * (99999 - 10001 + 1)) + 10001;
    console.log(`使用偏移量：${offset}`);

    // 1. 先把 treeStructure 轉成 [origId, ts] 陣列，並依 parent_id 排序
    const treeEntries = Object.entries(treeStructure)
      .map(([k, ts]) => [Number(k), ts])
      .sort((a, b) => {
        const pa = a[1].parent_id === null ? -1 : a[1].parent_id;
        const pb = b[1].parent_id === null ? -1 : b[1].parent_id;
        return pa - pb;
      });

    // 2. 依照排好的順序建立 adjustedTree
    const adjustedTree = {};
    for (const [origId, ts] of treeEntries) {
      const newKey = origId === 0 ? '0' : String(origId - offset);
      const p = ts.parent_id;
      const newParent = (p === null || p === 0) ? p : p - offset;
      const newChildren = ts.children_id.map(cid =>
        cid === 0 ? 0 : cid - offset
      );
      adjustedTree[newKey] = { parent_id: newParent, children_id: newChildren };
    }

    // 3. 調整 idToBookmark：維持原本「key 減 offset」且保持 key 遞增
    const bmEntries = Object.entries(idToBookmark)
      .map(([k, bm]) => [Number(k), bm])
      .sort((a, b) => a[0] - b[0]);

    const adjustedBookmarks = {};
    for (const [origId, bm] of bmEntries) {
      const newKey = origId === 0 ? '0' : String(origId - offset);
      const newId = origId === 0 ? 0 : origId - offset;
      adjustedBookmarks[newKey] = { ...bm, id: newId };
    }

    return {
      treeStructure: adjustedTree,
      idToBookmark: adjustedBookmarks
    };
  }

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = JSON.parse(evt.target.result);
      if (data.treeStructure && data.idToBookmark) {
        const { treeStructure, idToBookmark } = adjustIds(data.treeStructure, data.idToBookmark);
        const isLogin = bookmarksTree.userInfo.username !== "admin";
        bookmarksTree.buildNewTree(treeStructure, idToBookmark);
        console.log("oldTreeStructure", bookmarksTree.treeStructure);
        console.log("oldIdToBookmark", bookmarksTree.idToBookmark);
        console.log("newTreeStructure", treeStructure);
        console.log("newIdToBookmark", idToBookmark);
        if (isLogin) { 
          alert("匯入成功，已完全替換原有書籤！");
        } else {
          alert("匯入成功，已完全替換原有書籤！\n(目前沒有登入，下次進入網頁即會消失)");
        }
        onClose();
      } else {
        alert("檔案格式錯誤！");
      }
    };
    reader.readAsText(file);
  };


  return (
    <div className={styles.backdrop}>
      <div className={styles.modal}>
        <h5 className={styles.title}>書籤匯入/匯出</h5>
        <div className={styles.buttonGroup}>
          <button className={`${styles.button} ${styles.primary}`} onClick={handleExport}>
            匯出所有書籤
          </button>
          <input
            type="file"
            accept="application/json"
            style={{ display: "none" }}
            ref={fileInputRef}
            onChange={handleImport}
          />
          <button
            className={`${styles.button} ${styles.secondary}`}
            onClick={() => fileInputRef.current.click()}
          >
            匯入所有書籤
          </button>
        </div>
        <button className={`${styles.button} ${styles.outline}`} onClick={onClose}>
          關閉
        </button>
      </div>
    </div>
  );
};

export default BookmarkImportExportModal;
