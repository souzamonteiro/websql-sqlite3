(function () {
    // Import the SQLite3 library and make it more verbose to make debugging easier.
    const sqlite3 = require('sqlite3').verbose();

    /**
    * Emulates WebSQL's openDatabase function, opening or creating a SQLite3 database.
    * @param {string} name - The name of the database.
    * @param {string} version - The version of the database (not used in SQLite3).
    * @param {string} displayName - Database display name.
    * @param {number} estimatedSize - Estimated size of the database.
    * @param {Function} [creationCallback] - Optional callback called after database creation.
    * @returns {Object} An object containing transaction methods.
    */
    function openDatabase(name, version, displayName, estimatedSize, creationCallback) {
        // Open or create a SQLite3 database.
        const db = new sqlite3.Database(name, (err) => {
            if (err) {
                console.error("Erro ao abrir o banco de dados:", err);
            } else if (typeof creationCallback === 'function') {
                creationCallback(db);
            }
        });

        return {
            /**
             * Executes a read and write transaction.
             * @param {Function} callback - Transaction execution function.
             * @param {Function} [errorCallback] - Function called in case of error.
             * @param {Function} [successCallback] - Function called in case of success.
             */
            transaction: function (callback, errorCallback, successCallback) {
                db.serialize(() => {
                    const tx = new Transaction(db, false, errorCallback, successCallback);
                    callback(tx);
                });
            },
            
            /**
             * Executes a read-only transaction.
             * @param {Function} callback - Transaction execution function.
             * @param {Function} [errorCallback] - Function called in case of error.
             * @param {Function} [successCallback] - Function called in case of success.
             */
            readTransaction: function (callback, errorCallback, successCallback) {
                db.serialize(() => {
                    const tx = new Transaction(db, true, errorCallback, successCallback);
                    callback(tx);
                });
            },
        };
    }

    /**
     * Represents a database transaction.
     * @param {Object} db - SQLite3 database instance.
     * @param {boolean} readOnly - Defines whether the transaction is read-only.
     * @param {Function} [errorCallback] - Callback called in case of error.
     * @param {Function} [successCallback] - Callback called when the transaction is successfully completed.
     */
    function Transaction(db, readOnly, errorCallback, successCallback) {
        // Stores the SQL statements to be executed in the transaction.
        const statements = [];
        
        /**
         * Executes an SQL command within the transaction.
         * @param {string} sql - The SQL query to be executed.
         * @param {Array} params - Parameters for the SQL query.
         * @param {Function} [successCallback] - Callback called in case of success.
         * @param {Function} [errorCallback] - Callback called in case of error.
         */
        this.executeSql = function (sql, params = [], successCallback, errorCallback) {
            statements.push({ sql, params, successCallback, errorCallback });
        };

        // Process the transaction asynchronously in the next iteration of the event loop.
        process.nextTick(() => {
            db.serialize(() => {
                if (!readOnly) db.run("BEGIN TRANSACTION;"); // Start the transaction if it is not read-only.
                let errorOccurred = false;
                
                // Execute each stored SQL statement.
                statements.forEach(({ sql, params, successCallback, errorCallback }) => {
                    if (errorOccurred) return;
                    db.all(sql, params, function (err, rows) {
                        if (err) {
                            errorOccurred = true;
                            if (typeof errorCallback === 'function') errorCallback(err);
                        } else if (typeof successCallback === 'function') {
                            successCallback(this, {
                                rowsAffected: this.changes || 0,
                                insertId: this.lastID || null,
                                rows: {
                                    length: rows.length,
                                    item: (i) => rows[i],
                                    _array: rows
                                }
                            });
                        }
                    });
                });
                
                // End the transaction if it is not read-only and no error occurred.
                if (!readOnly && !errorOccurred) db.run("COMMIT;");
                if (typeof successCallback === 'function' && !errorOccurred) successCallback();
            });
        });
    }

    // Make the openDatabase function globally accessible.
    global.openDatabase = openDatabase;
})();
