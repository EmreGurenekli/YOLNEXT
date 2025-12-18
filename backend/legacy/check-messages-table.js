const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'yolnext.db');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }

  console.log('Connected to database');

  // Get table schema
  db.all('PRAGMA table_info(messages)', (err, rows) => {
    if (err) {
      console.error('Error querying table info:', err);
    } else {
      console.log('Messages table schema:');
      rows.forEach(row => {
        console.log(
          `  ${row.name} (${row.type}) ${row.notnull ? 'NOT NULL' : ''} ${row.pk ? 'PRIMARY KEY' : ''}`
        );
      });
    }

    db.close();
  });
});
