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

  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = JSON.parse(evt.target.result);
        if (data.treeStructure && data.idToBookmark) {
          bookmarksTree._buildTree(data.treeStructure, data.idToBookmark);
          bookmarksTree.onUpdate();
          alert("匯入成功，已完全替換原有書籤！");
          onClose();
        } else {
          alert("檔案格式錯誤！");
        }
      } catch {
        alert("檔案解析失敗！");
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
