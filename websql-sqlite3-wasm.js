(async function (global) {
    /**
     * Load SQLite3 WASM.
     * Uses the worker-promised SQLite3 instance to handle database operations.
     */
    const sqlite3 = await window.sqlite3Worker1Promiser(); 

    /**
     * Emulates the WebSQL openDatabase function using SQLite3 WASM.
     * @param {string} name - The name of the database.
     * @param {string} version - The version of the database (not used in SQLite3).
     * @param {string} displayName - The display name of the database.
     * @param {number} estimatedSize - The estimated size of the database.
     * @param {Function} [creationCallback] - Callback function invoked after database creation.
     * @returns {Object} An object containing transaction methods.
     */
    function openDatabase(name, version, displayName, estimatedSize, creationCallback) {
        // Creates a database in memory or IndexedDB.
        const db = new sqlite3.oo1.DB(name, 'ct');

        if (typeof creationCallback === 'function') {
            creationCallback(db);
        }

        return {
            /**
             * Executes a read/write transaction.
             * @param {Function} callback - The function executing the transaction.
             * @param {Function} [errorCallback] - The function called in case of an error.
             * @param {Function} [successCallback] - The function called on success.
             */
            transaction: function (callback, errorCallback, successCallback) {
                const tx = new Transaction(db, false, errorCallback, successCallback);
                callback(tx);
            },
            
            /**
             * Executes a read-only transaction.
             * @param {Function} callback - The function executing the transaction.
             * @param {Function} [errorCallback] - The function called in case of an error.
             * @param {Function} [successCallback] - The function called on success.
             */
            readTransaction: function (callback, errorCallback, successCallback) {
                const tx = new Transaction(db, true, errorCallback, successCallback);
                callback(tx);
            },
        };
    }

    /**
     * Represents a transaction in the database.
     * @param {Object} db - The SQLite3 database instance.
     * @param {boolean} readOnly - Defines whether the transaction is read-only.
     * @param {Function} [errorCallback] - Callback function for errors.
     * @param {Function} [successCallback] - Callback function for success.
     */
    function Transaction(db, readOnly, errorCallback, successCallback) {
        /**
         * Executes an SQL command within the transaction.
         * @param {string} sql - The SQL query to execute.
         * @param {Array} params - Parameters for the SQL query.
         * @param {Function} [successCallback] - Callback function on success.
         * @param {Function} [errorCallback] - Callback function on error.
         */
        this.executeSql = function (sql, params = [], successCallback, errorCallback) {
            try {
                const result = db.exec({
                    sql,
                    bind: params,
                    returnValue: "resultRows",
                });

                if (typeof successCallback === 'function') {
                    successCallback(this, {
                        rowsAffected: db.changes(),
                        insertId: db.lastInsertRowid(),
                        rows: {
                            length: result.length,
                            item: (i) => result[i],
                            _array: result,
                        },
                    });
                }
            } catch (err) {
                if (typeof errorCallback === 'function') errorCallback(err);
            }
        };
    }

    // Makes the openDatabase function globally accessible.
    global.openDatabase = openDatabase;
})(this);

/**
 * Example usage in a browser environment.
 */
(async function () {
    const db = openDatabase('test', '1.0', 'Test DB', 2 * 1024 * 1024);
    db.transaction((tx) => {
        tx.executeSql('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT);');
        tx.executeSql('INSERT INTO users (name) VALUES (?);', ['Alice']);
        tx.executeSql('INSERT INTO users (name) VALUES (?);', ['Bob']);
    }, console.error, () => {
        db.readTransaction((tx) => {
            tx.executeSql('SELECT * FROM users;', [], (tx, result) => {
                console.log(result.rows._array);
            });
        });
    });
})();
