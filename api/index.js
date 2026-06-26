const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PASSWORD = 'force$$$';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
  secret: 'sysx-forc-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { maxAge: 3600000 * 24 }
}));

// ========== ROUTE STATIC ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
  if (!req.session.loggedIn) return res.redirect('/');
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.use(express.static(path.join(__dirname, '../public')));

// ========== API ==========
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    req.session.user = 'Dale Andrews';
    return res.json({ success: true });
  }
  return res.status(401).json({ success: false, message: 'PASSWORD SALAH!' });
});

app.get('/api/check-session', (req, res) => {
  return res.json({ loggedIn: !!req.session.loggedIn, user: req.session.user || null });
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

// DUMMY API BUAT PAIR & EXECUTE (BIAR GAK ERROR)
app.post('/api/pair', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'LOGIN DULU!' });
  res.json({ success: true, pairingCode: 'SYSX-FORC-666' });
});

app.post('/api/execute', (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'LOGIN DULU!' });
  const { target } = req.body;
  if (!target || !target.startsWith('62')) {
    return res.status(400).json({ error: 'TARGET HARUS 62xxx!' });
  }
  res.json({ success: true, message: `🔥 FORCECLOSE DUMMY DIKIRIM KE ${target}` });
});

app.get('/api/status', (req, res) => {
  res.json({ connected: true, sessionActive: true, loggedIn: !!req.session.loggedIn });
});

module.exports = app;
