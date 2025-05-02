// import { treeStructure, idToBookmark } from "../utils/tempDB.js";  // 模擬server資料庫
import Cookie from 'js-cookie'; 
import $ from 'jquery';  // jQuery is required for AJAX requests

// use API to get data from server
let databaseStatus = null;
let treeStructure = null;
let idToBookmark = null;
let csrfToken = null;
await $.ajax({
    url: 'http://localhost:8000/api/get_csrf',
    type: 'GET',
    contentType: 'application/json',
    xhrFields: {
        withCredentials: true  // include cookies in the request
    },
    success: function (data) {
    },
    error: function (xhr, status, error) {
        console.error('Error:', error);
    }
}).then(() => {
    csrfToken = Cookie.get('csrftoken');
    $.ajaxSetup({
        headers: {'X-CSRFToken': csrfToken},
        xhrFields: {withCredentials: true }
    });
})

await $.ajax({
    url: 'http://localhost:8000/api/bookmarks/init',
    type: 'POST',
    contentType: 'application/json',
    success: function (data) {
        databaseStatus = data.databaseStatus;
        treeStructure = data.treeStructure;
        idToBookmark = data.idToBookmark;
    },
    error: function (xhr, status, error) {
        console.error('Error:', error);
    }
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

function updateLoaclStatus(updateTime) {
    // update lastUpdated time in localDB
    let transaction = loaclDB.transaction(databaseStatusTableName, "readwrite");
    let store = transaction.objectStore(databaseStatusTableName);
    let request = store.put({'lastUpdated': updateTime}, 0);
    request.onerror = function (event) {
        throw new Error("loaclDB Error", event.target.error);
    };
}

const localDBfunc = {
    updateTreeStructure(id, data) {  // only for update existing treeStructure
        let updateTime = (new Date()).toISOString();

        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let updateRequest = store.get(id);
        updateRequest.onerror = function (event) {
            if (event.result !== undefined) {
                let updateRequest = store.put(data, id);
                updateRequest.onerror = function (event) {
                    throw new Error("loaclDB Error", event.target.error);
                };
            }
        }
        updateRequest.onsuccess = function (event) {
            console.log("loaclDB update success:", event.target.result);
        };

        updateLoaclStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                time: updateTime,
                parent_id: data.parent_id,
                children_id: data.children_id,
            }),
            success: function (data) {
                console.log("Server update success:", data);
            },
            error: function (xhr, status, error) {
                console.error('Server update error:', error);
            }
        });
    },
    updateBookmark(id, data) {  // only for update existing bookmark or folder
        let updateTime = (new Date()).toISOString();

        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let checkRequest = store.get(id);
        checkRequest.onsuccess = function (event) {
            if (event.target.result !== undefined) {
                // ensure the data is not hidden when put into localDB
                let copy_data = {...data};
                copy_data.hidden = false;

                let updateRequest = store.put(copy_data, id);
                updateRequest.onerror = function (event) {
                    throw new Error("loaclDB Error", event.target.error);
                };
            }
        }
        checkRequest.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        }

        updateLoaclStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                time: updateTime,
                url: data.url,
                img: data.img,
                name: data.name,
                tags: data.tags,
                starred: data.starred,
                hidden: data.hidden
            }),
            success: function (data) {
                console.log("Server update success:", data);
            },
            error: function (xhr, status, error) {
                console.error('Server update error:', error);
            }
        });
    },
    createId(id, bookmarkData, treeStructureData) {  
        // for create new bookmark or folder, also create corresponding treeStructure
        // if existing id is passed, it will be updated instead of created
        let updateTime = (new Date()).toISOString();

        let transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.put(bookmarkData, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        store = transaction.objectStore(treeStructureTableName);
        request = store.put(treeStructureData, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        updateLoaclStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                time: updateTime,
                url: bookmarkData.url,
                img: bookmarkData.img,
                name: bookmarkData.name,
                tags: bookmarkData.tags,
                starred: bookmarkData.starred,
                hidden: bookmarkData.hidden,
                parent_id: treeStructureData.parent_id,
                children_id: treeStructureData.children_id,
            }),
            success: function (data) {
                console.log("Server create success:", data);
            },
            error: function (xhr, status, error) {
                console.error('Server create error:', error);
            }
        });
    },
    delId(id) {
        let updateTime = (new Date()).toISOString();

        let transaction = loaclDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        transaction = loaclDB.transaction(bookmarksTableName, "readwrite");
        store = transaction.objectStore(bookmarksTableName);
        request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        updateLoaclStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/delete/' + id,
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                time: updateTime,
            }),
            success: function (data) {
                console.log("Server delete success:", data);
            },
            error: function (xhr, status, error) {
                console.error('Server delete error:', error);
            }
        });
    }
}

export { loaclTreeStructure as treeStructure, loaclBookmarks as idToBookmark, localDBfunc as localDB };
