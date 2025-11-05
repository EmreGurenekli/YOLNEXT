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
        } else {
          console.log('Messages table does not exist');
        }

        db.close();
      }
    );
  });
});
