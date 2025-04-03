import { treeStructure, idToBookmark } from "../utils/tempDB.js";  // 模擬server資料庫

const treeStructureTableName = "treeStructure";
const bookmarksTableName = "bookmarks";
let loaclDB = null;

const loaclDBPromise = new Promise((resolve, reject) => {
    let dbRequest = indexedDB.open("bookmarksDB", 1);
    dbRequest.onupgradeneeded = function (event) {
        loaclDB = dbRequest.result;
        switch (event.oldVersion) {
            case 0:  // local database initialization from server data
                loaclDB.createObjectStore(treeStructureTableName);
                loaclDB.createObjectStore(bookmarksTableName);
    
                let treeStructureStore = event.target.transaction.objectStore(treeStructureTableName);
                let bookmarksStore = event.target.transaction.objectStore(bookmarksTableName);
                for (let i = 0; i < Object.keys(treeStructure).length; i++) {
                    treeStructureStore.put(treeStructure[i], idToBookmark[i].id);
                }
                for (let i = 0; i < Object.keys(idToBookmark).length; i++) {
                    bookmarksStore.put(idToBookmark[i], idToBookmark[i].id);
                }
            
                break;
        }
    };
    dbRequest.onsuccess = function (event) {
        loaclDB = event.target.result;

        function getDataPromise(tableName) {
            return new Promise((resolve, reject) => {
                let data = {};
                let cursorRequest = loaclDB.transaction(tableName, "readonly")
                    .objectStore(tableName)
                    .openCursor();
                cursorRequest.onsuccess = function (event) {
                    let cursor = event.target.result;
                    if (cursor) {
                        data[cursor.key] = cursor.value;
                        cursor.continue();
                    } else {
                        resolve(data);
                    }
                }
            });
        }

        let treeStructurePromise = getDataPromise(treeStructureTableName);
        let bookmarksPromise = getDataPromise(bookmarksTableName);
        Promise.all([treeStructurePromise, bookmarksPromise])
            .then(([treeStructure, bookmarks]) => {resolve({treeStructure, bookmarks})})
            .catch(reject);
    };
    dbRequest.onerror = function (event) {
        throw new Error("loaclDB Error", event.target.error);
    };
});

// ensure loaclDBPromise is resolved -> loaclDB also initialized
let loaclTreeStructure = null;
let loaclBookmarks = null;
await loaclDBPromise.then((data) => {
    loaclTreeStructure = data.treeStructure;
    loaclBookmarks = data.bookmarks;
}).catch((error) => {
    console.error("Error initializing localDB:", error);
});

const localDBfunc = {
    putTreeStructure(id, data) {  // if id exists, original data will be replaced
        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.put(data, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
    },
    putBookmark(id, data) {  // if id exists, original data will be replaced
        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.put(data, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
    },
    delTreeStructure(id) {
        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
    },
    delBookmark(id) {
        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
    }
}

export { loaclTreeStructure as treeStructure, loaclBookmarks as idToBookmark, localDBfunc as localDB };
