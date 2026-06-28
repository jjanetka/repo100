const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

const PORT = process.env.PORT || 3000;
const filePath = path.join(__dirname, 'public', 'index.html');
const indexHtml = fs.readFileSync(filePath);

const client = new Client({
  connectionString: 'postgresql://pguser:2MBjSQ4ZLhWkv567vNlotgvDEGMRe8zq@dpg-d90ok6u7r5hc73bcksp0-a/pgdb_1f14',
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
    return client.query('SELECT username FROM test');
  })
  .then((result) => {
    console.log('Usernames in test table:');
    result.rows.forEach((row) => {
      console.log(row.username);
    });
  })
  .catch((err) => {
    console.error('Database error:', err);
  });

const server = http.createServer((req, res) => {
  if (req.url !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(indexHtml);
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
