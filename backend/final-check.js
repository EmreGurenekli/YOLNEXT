const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database.sqlite');

// Check if there are any shipments with carrierId = 2 and proper status
db.all("SELECT s.id, s.title, s.status, s.carrierId FROM shipments s INNER JOIN offers o ON s.id = o.shipmentId WHERE o.carrierId = 2 AND o.status = 'accepted' AND s.status IN ('accepted', 'in_transit', 'offer_accepted')", (err, rows) => {
  if (err) {
    console.error('Error querying final active shipments:', err);
  } else {
    console.log('Final active shipments query result:', rows);
  }
  
  db.close();
});