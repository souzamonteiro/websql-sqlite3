# WebSQL Emulator for Node.js

This project emulates the WebSQL API using SQLite3 in a Node.js environment.

## Installation

Ensure you have Node.js installed, then install SQLite3:

```sh
npm install sqlite3
```

## Usage

```javascript
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
```

## Features
- Fully emulates WebSQL API using SQLite3.
- Supports transactions and read transactions.
- Works in Node.js environments.

## License
MIT License
