// ========== CEK SESSION ==========
(async function checkSession() {
  const res = await fetch('/api/check-session');
  const data = await res.json();
  if (!data.loggedIn) {
    window.location.href = '/';
  } else {
    document.getElementById('userName').textContent = data.user || 'Dale Andrews';
    updateStatus();
  }
})();

// ========== LOGIN FIX ==========
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const btn = document.querySelector('#loginForm button');
  btn.textContent = 'PROSES...';
  btn.disabled = true;

  try {
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password })
    });
    const data = await res.json();
    
    if (data.success) {
      // TAMPILKAN ANIMASI
      const animDiv = document.getElementById('loginAnim');
      animDiv.style.display = 'block';
      const animVideo = document.getElementById('animVideo');
      animVideo.play().catch(() => {});
      
      // REDIRECT SETELAH 4 DETIK PAKAI window.location.replace
      setTimeout(() => {
        window.location.replace('/dashboard.html');
      }, 4000);
    } else {
      document.getElementById('loginError').style.display = 'block';
      document.getElementById('loginError').textContent = '❌ PASSWORD SALAH, KONTOL!';
      btn.textContent = 'MASUK!!';
      btn.disabled = false;
    }
  } catch (err) {
    document.getElementById('loginError').style.display = 'block';
    document.getElementById('loginError').textContent = '❌ ERROR: ' + err.message;
    btn.textContent = 'MASUK!!';
    btn.disabled = false;
  }
});

// ========== CEK SESSION DI DASHBOARD ==========
(async function checkSession() {
  try {
    const res = await fetch('/api/check-session');
    const data = await res.json();
    if (!data.loggedIn) {
      window.location.replace('/');
    } else {
      document.getElementById('userName').textContent = data.user || 'Dale Andrews';
      updateStatus();
    }
  } catch (e) {
    window.location.replace('/');
  }
})();
// ========== NAVIGASI ==========
function loadMenu(menu) {
  document.querySelectorAll('.menu-content').forEach(el => el.classList.remove('active'));
  document.getElementById('menu-' + menu).classList.add('active');
  document.querySelectorAll('.sidebar nav ul li').forEach(el => el.classList.remove('active'));
  document.querySelector(`[data-menu="${menu}"]`).classList.add('active');
}

document.querySelectorAll('.sidebar nav ul li[data-menu]').forEach(el => {
  el.addEventListener('click', () => loadMenu(el.dataset.menu));
});
document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  await fetch('/api/logout');
  window.location.href = '/';
});

// ========== PAIRING ==========
async function pairDevice() {
  const num = document.getElementById('senderNumber').value;
  if (!num.startsWith('62')) { alert('NOMOR HARUS 62xxx!'); return; }
  const res = await fetch('/api/pair', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: num })
  });
  const data = await res.json();
  document.getElementById('pairResult').innerHTML = data.success 
    ? `✅ PAIRING CODE: ${data.pairingCode}`
    : `❌ ERROR: ${data.error}`;
  updateStatus();
}

// ========== EKSEKUSI FORCECLOSE ==========
async function executeForce() {
  const target = document.getElementById('targetNumber').value;
  if (!target.startsWith('62')) { alert('TARGET HARUS 62xxx!'); return; }
  const res = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ target })
  });
  const data = await res.json();
  document.getElementById('execResult').innerHTML = data.success 
    ? `🔥 ${data.message}`
    : `❌ ERROR: ${data.error}`;
  updateStatus();
}

// ========== UPDATE STATUS ==========
async function updateStatus() {
  const res = await fetch('/api/status');
  const data = await res.json();
  const statusEl = document.getElementById('waStatus');
  if (data.connected) {
    statusEl.textContent = '✅ ONLINE';
    statusEl.style.color = '#00ff00';
  } else {
    statusEl.textContent = '❌ OFFLINE';
    statusEl.style.color = '#ff0000';
  }
}

setInterval(updateStatus, 10000);
