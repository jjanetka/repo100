const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const { URLSearchParams } = require('url');

const PORT = process.env.PORT || 3000;
const filePath = path.join(__dirname, 'public', 'index.html');
const indexHtml = fs.readFileSync(filePath, 'utf8');

const client = new Client({
  connectionString: 'postgresql://pguser:2MBjSQ4ZLhWkv567vNlotgvDEGMRe8zq@dpg-d90ok6u7r5hc73bcksp0-a/pgdb_1f14',
});  

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL database');
  })
  .catch((err) => {
    console.error('Database error:', err);
  });

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function renderIndexPage(res) {
  try {
    const result = await client.query('SELECT username FROM test ORDER BY username ASC');
    const userRows = result.rows.length
      ? result.rows
          .map((row) => `<tr><td>${escapeHtml(row.username)}</td></tr>`)
          .join('')
      : '<tr><td>No users found.</td></tr>';

    const page = indexHtml.replace('<!-- USER_ROWS -->', userRows);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(page);
  } catch (err) {
    console.error('Failed to render usernames:', err);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Internal Server Error');
  }
}

function handleCreateUser(req, res) {
  let body = '';

  req.on('data', (chunk) => {
    body += chunk;
  });

  req.on('end', async () => {
    try {
      const params = new URLSearchParams(body);
      const newUser = (params.get('newuser') || '').trim();

      if (!newUser) {
        res.writeHead(303, { Location: '/' });
        res.end();
        return;
      }

      await client.query('INSERT INTO test (username) VALUES ($1)', [newUser]);
      res.writeHead(303, { Location: '/' });
      res.end();
    } catch (err) {
      console.error('Failed to insert username:', err);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  });
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/') {
    renderIndexPage(res);
    return;
  }

  if (req.method === 'POST' && req.url === '/users') {
    handleCreateUser(req, res);
    return;
  }

  if (req.url !== '/') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Method Not Allowed');
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
