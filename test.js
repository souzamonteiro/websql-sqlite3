require('./websql-sqlite3-node.js');

const db = openDatabase('test.db', '1.0', 'Test DB', 2 * 1024 * 1024);
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