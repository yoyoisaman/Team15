// import { treeStructure, idToBookmark } from "../utils/tempDB.js";  // 模擬server資料庫

// use API to get data from server
let databaseStatus = null;
let treeStructure = null;
let idToBookmark = null;
await fetch('http://127.0.0.1:8000/api/bookmarks/')
    .then(response => response.json())
    .then(data => {
        databaseStatus = data.databaseStatus;
        treeStructure = data.treeStructure;
        idToBookmark = data.idToBookmark;
    })

const databaseStatusTableName = "databaseStatus";
const treeStructureTableName = "treeStructure";
const bookmarksTableName = "bookmarks";
let loaclDB = null;

const loaclDBPromise = new Promise((resolve, reject) => {
    let dbRequest = indexedDB.open("bookmarksDB", 2);
    dbRequest.onupgradeneeded = function (event) {
        loaclDB = dbRequest.result;
        if (event.oldVersion === 0) {  // local database initialization from server data
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
        }
        if (event.oldVersion <= 1) {  // ver1 -> ver2: record last_updated
            loaclDB.createObjectStore(databaseStatusTableName);
            let databaseStatusStore = event.target.transaction.objectStore(databaseStatusTableName);
            databaseStatusStore.put(databaseStatus, 0);
        }
    };
    dbRequest.onsuccess = function (event) {
        loaclDB = event.target.result;

        function getDataPromise(tableName) {
            // returns a promise to get data from indexedDB
            // when the promise is resolved, data is returned as an object with key as id and value as data
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

        function getDataUpdatePromises(localLastUpdated, serverLastUpdated) {
            // returns an array of promises to update localDB with server data
            // when all promises are resolved, update process is done
            // TODO: update server data
            if (localLastUpdated >= serverLastUpdated) {
                return [Promise.resolve({})];
            } else if (localLastUpdated < serverLastUpdated) {
                let promises = []
                let databaseStatusStore = loaclDB.transaction(databaseStatusTableName, "readwrite").objectStore(databaseStatusTableName);
                let treeStructureStore = loaclDB.transaction(treeStructureTableName, "readwrite").objectStore(treeStructureTableName);
                let bookmarksStore = loaclDB.transaction(bookmarksTableName, "readwrite").objectStore(bookmarksTableName);

                promises.push(new Promise((resolve, reject) => {
                    let request = databaseStatusStore.put(databaseStatus, 0);
                    request.onsuccess = function (event) {
                        resolve(event.target.result);
                    };
                }));
                for (let i = 0; i < Object.keys(treeStructure).length; i++) {
                    promises.push(new Promise((resolve, reject) => {
                        let request = treeStructureStore.put(treeStructure[i], idToBookmark[i].id);
                        request.onsuccess = function (event) {
                            resolve(event.target.result);
                        };
                    }));
                }
                for (let i = 0; i < Object.keys(idToBookmark).length; i++) {
                    promises.push(new Promise((resolve, reject) => {
                        let request = bookmarksStore.put(idToBookmark[i], idToBookmark[i].id);
                        request.onsuccess = function (event) {
                            resolve(event.target.result);
                        };
                    }));
                }
                return promises;
            }
        }

        // get local database status (databaseStatusPromise)
        // -> line 117 all update process is done
        // -> line 120 get local treeStructure and bookmarks (getDataPromise)
        // -> ine 125 resolve the outer promise (line 20 loaclDBPromise) with treeStructure and bookmarks
        let databaseStatusPromise = getDataPromise(databaseStatusTableName);
        databaseStatusPromise
            .then((loaclDatabaseStatus) => {
                let localLastUpdated = new Date(loaclDatabaseStatus[0].lastUpdated);
                let serverLastUpdated = new Date(databaseStatus.lastUpdated);
                let promises = getDataUpdatePromises(localLastUpdated, serverLastUpdated);
                return Promise.all(promises);
            })
            .then(() => {
                return Promise.all([
                    getDataPromise(treeStructureTableName),
                    getDataPromise(bookmarksTableName)
                ]);
            })
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

function updateStatus() {
    // update lastUpdated time
    let transaction = loaclDB.transaction(databaseStatusTableName, "readwrite");
    let store = transaction.objectStore(databaseStatusTableName);
    let request = store.put({'lastUpdated': (new Date()).toISOString()}, 0);
    request.onerror = function (event) {
        throw new Error("loaclDB Error", event.target.error);
    };
}

const localDBfunc = {
    putTreeStructure(id, data) {  // if id exists, original data will be replaced
        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.put(data, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
        updateStatus();
    },
    putBookmark(id, data) {  // if id exists, original data will be replaced
        // ensure the data is not hidden when put into localDB
        let copy_data = {...data};
        copy_data.hidden = false;
        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.put(copy_data, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
        updateStatus();
    },
    delTreeStructure(id) {
        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
        updateStatus();
    },
    delBookmark(id) {
        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };
        updateStatus();
    }
}

export { loaclTreeStructure as treeStructure, loaclBookmarks as idToBookmark, localDBfunc as localDB };
