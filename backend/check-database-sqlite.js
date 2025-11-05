const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
console.log('Database path:', dbPath);

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, err => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }

  console.log('Connected to database');

  // Get all tables
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
    if (err) {
      console.error('Error querying tables:', err);
    } else {
      console.log('Tables in database:');
      rows.forEach(row => {
        console.log('  -', row.name);
      });
    }

    // Check if messages table exists
    db.get(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='messages'",
      (err, row) => {
        if (err) {
          console.error('Error checking messages table:', err);
        } else if (row) {
          console.log('Messages table exists');

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
        } else {
          console.log('Messages table does not exist');
          db.close();
        }
      }
    );
  });
});
