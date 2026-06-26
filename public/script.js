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

// ========== LOGIN ==========
document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('passwordInput').value;
  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password })
  });
  const data = await res.json();
  if (data.success) {
    // TAMPILKAN ANIMASI LOGIN
    document.getElementById('loginAnim').style.display = 'block';
    document.getElementById('animVideo').play();
    setTimeout(() => {
      window.location.href = '/dashboard.html';
    }, 5000); // 5 detik animasi
  } else {
    document.getElementById('loginError').style.display = 'block';
  }
});

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