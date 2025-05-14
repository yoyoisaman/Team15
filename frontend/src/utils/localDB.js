// import { treeStructure, idToBookmark } from "../utils/tempDB.js";  // 模擬server資料庫
import Cookie from 'js-cookie'; 
import $ from 'jquery';  // jQuery is required for AJAX requests

// use API to get data from server
let databaseStatus = null;
let treeStructure = null;
let idToBookmark = null;
let csrfToken = null;
let userInfo = null;
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
    crossDomain: true,
    xhrFields: {
        withCredentials: true
    },
    success: function (data) {
        databaseStatus = data.databaseStatus;
        treeStructure = data.treeStructure;
        idToBookmark = data.idToBookmark;
        userInfo = {
            'username': databaseStatus.username,
            'name': databaseStatus.name,
            'picture': databaseStatus.picture,
            'lastUpdated': databaseStatus.lastUpdated
        }
        console.log('username', userInfo);
    },
    error: function (xhr, status, error) {
        console.error('Error:', error);
    }
})

const databaseStatusTableName = "databaseStatus";
const treeStructureTableName = "treeStructure";
const bookmarksTableName = "bookmarks";
let localDB = null;

const localDBPromise = new Promise((resolve, reject) => {
    let dbRequest = indexedDB.open("bookmarksDB", 2);
    dbRequest.onupgradeneeded = function (event) {
        localDB = dbRequest.result;
        if (event.oldVersion === 0) {  // local database initialization from server data
            localDB.createObjectStore(treeStructureTableName);
            localDB.createObjectStore(bookmarksTableName);

            let serverKeys = Object.keys(idToBookmark);
            serverKeys = serverKeys.map((key) => parseInt(key));
            let treeStructureStore = event.target.transaction.objectStore(treeStructureTableName);
            let bookmarksStore = event.target.transaction.objectStore(bookmarksTableName);
            for (let i = 0; i < serverKeys.length; i++) {
                let key = serverKeys[i];
                treeStructureStore.put(treeStructure[key], idToBookmark[key].id);
            }
            for (let i = 0; i < serverKeys.length; i++) {
                let key = serverKeys[i];
                bookmarksStore.put(idToBookmark[key], idToBookmark[key].id);
            }
        }
        if (event.oldVersion <= 1) {  // ver1 -> ver2: record last_updated
            localDB.createObjectStore(databaseStatusTableName);
            let databaseStatusStore = event.target.transaction.objectStore(databaseStatusTableName);
            databaseStatusStore.put(databaseStatus, 0);
        }
    };
    dbRequest.onsuccess = function (event) {
        localDB = event.target.result;

        function clearTablePromise(tableName) {
            // returns a promise to delete table from indexedDB
            return new Promise((resolve, reject) => {
                let transaction = localDB.transaction(tableName, "readwrite");
                let store = transaction.objectStore(tableName);
                let request = store.clear();
                request.onsuccess = function (event) {
                    resolve(event);
                }
                request.onerror = function (event) {
                    reject(event);
                }
            });
        }

        function updateTablePromises() {
            let promises = [];
            let serverKeys = Object.keys(idToBookmark);
            serverKeys = serverKeys.map((key) => parseInt(key));
            let treeStructureStore = localDB.transaction(treeStructureTableName, "readwrite").objectStore(treeStructureTableName);
            let bookmarksStore = localDB.transaction(bookmarksTableName, "readwrite").objectStore(bookmarksTableName);
            let databaseStatusStore = localDB.transaction(databaseStatusTableName, "readwrite").objectStore(databaseStatusTableName);
            for (let i = 0; i < serverKeys.length; i++) {
                let key = serverKeys[i];
                let treeStructurePromise = new Promise((resolve, reject) => {
                    let request = treeStructureStore.put(treeStructure[key], idToBookmark[key].id);
                    request.onsuccess = function (event) {
                        resolve(event);
                    }
                    request.onerror = function (event) {
                        reject(event);
                    }
                });
                promises.push(treeStructurePromise);
            }

            for (let i = 0; i < serverKeys.length; i++) {
                let key = serverKeys[i];
                let bookmarksPromise = new Promise((resolve, reject) => {
                    let request = bookmarksStore.put(idToBookmark[key], idToBookmark[key].id);
                    request.onsuccess = function (event) {
                        resolve(event);
                    }
                    request.onerror = function (event) {
                        reject(event);
                    }
                });
                promises.push(bookmarksPromise);
            }

            let databaseStatusPromise = new Promise((resolve, reject) => {
                let request = databaseStatusStore.put(databaseStatus, 0);
                request.onsuccess = function (event) {
                    resolve(event);
                }
                request.onerror = function (event) {
                    reject(event);
                }
            });
            promises.push(databaseStatusPromise);

            return promises;
        }

        Promise.all([
            clearTablePromise(treeStructureTableName),
            clearTablePromise(bookmarksTableName),
            clearTablePromise(databaseStatusTableName),
        ]).then(() => {
            let promises = updateTablePromises();
            return Promise.all(promises);
        }).then(() => {
            resolve();
        }).catch(reject);
    };
    dbRequest.onerror = function (event) {
        throw new Error("loaclDB Error", event.target.error);
    };
});

await localDBPromise.catch((error) => {
    console.error("Error initializing localDB:", error);
});

function updateLocalStatus(updateTime) {
    // update lastUpdated time in localDB
    let transaction = localDB.transaction(databaseStatusTableName, "readwrite");
    let store = transaction.objectStore(databaseStatusTableName);
    let request = store.put({'lastUpdated': updateTime}, 0);
    request.onerror = function (event) {
        throw new Error("loaclDB Error", event.target.error);
    };
}

const localDBfunc = {
    updateTreeStructure(id, data) {  // only for update existing treeStructure
        let updateTime = (new Date()).toISOString();

        let transaction = localDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let checkRequest = store.get(id);
        checkRequest.onsuccess = function (event) {
            if (event.target.result !== undefined) {
                let updateRequest = store.put(data, id);
                updateRequest.onerror = function (event) {
                    throw new Error("loaclDB Error", event.target.error);
                };
                updateRequest.onsuccess = function (event) {
                    console.log("loaclDB update success:", event.target.result);
                }
            }
            else {
                console.error(`loaclDB Error: id not found - ${id}`); // 印出 id
                throw new Error(`loaclDB Error: id not found - ${id}`); // 包含 id 的錯誤訊息
            }
        }

        updateLocalStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
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

        let transaction = localDB.transaction(bookmarksTableName, "readwrite");
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
                updateRequest.onsuccess = function (event) {
                    console.log("loaclDB update success:", event.target.result);
                }
            }
        }
        checkRequest.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        }

        updateLocalStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
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

        let transaction = localDB.transaction(bookmarksTableName, "readwrite");
        let store = transaction.objectStore(bookmarksTableName);
        let request = store.put(bookmarkData, id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        transaction = localDB.transaction(treeStructureTableName, "readwrite");
        store = transaction.objectStore(treeStructureTableName);
        request = store.put(treeStructureData, id);
        console.log("store.put treeStructureData", treeStructureData);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        updateLocalStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/update/' + id,
            type: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
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

        let transaction = localDB.transaction(treeStructureTableName, "readwrite");
        let store = transaction.objectStore(treeStructureTableName);
        let request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        transaction = localDB.transaction(bookmarksTableName, "readwrite");
        store = transaction.objectStore(bookmarksTableName);
        request = store.delete(id);
        request.onerror = function (event) {
            throw new Error("loaclDB Error", event.target.error);
        };

        updateLocalStatus(updateTime);

        $.ajax({
            url: 'http://localhost:8000/api/bookmarks/delete/' + id,
            type: 'POST',
            contentType: 'application/json',
            crossDomain: true,
            xhrFields: {
                withCredentials: true
            },
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

export { userInfo as userInfo, treeStructure, idToBookmark, localDBfunc as localDB };
