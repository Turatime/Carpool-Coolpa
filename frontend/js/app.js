/* ============================================================
   Carpool Coolpa — Shared App Utilities
   ============================================================ */

const API_URL = "http://localhost:8000/api";
let currentUser = null;

/* ── Auth helpers ─────────────────────────────────────────── */

function getUser() {
  if (!currentUser) {
    const stored = localStorage.getItem('user');
    if (stored) currentUser = JSON.parse(stored);
  }
  return currentUser;
}

function requireAuth() {
  if (!getUser()) {
    window.location.href = '/';
    return false;
  }
  return true;
}

function logout() {
  localStorage.removeItem('user');
  currentUser = null;
  window.location.href = '/';
}

/* ── Alert helper ─────────────────────────────────────────── */

function showAlert(id, msg, type) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.className = `alert show alert-${type}`;
  setTimeout(() => el.classList.remove('show'), 3000);
}

/* ── Shared header renderer ───────────────────────────────── */

function renderHeader(containerId) {
  const user = getUser();
  if (!user) return;
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = `
    <header class="dashboard-header">
      <div class="dashboard-header__inner">
        <a href="/pages/dashboard.html" class="dashboard-brand">🚗 Carpool Coolpa</a>
        <div class="dashboard-toolbar">
          <div class="user-badge">${user.full_name.substring(0, 2).toUpperCase()}</div>
          <button class="logout-btn" onclick="logout()">ออกจากระบบ</button>
        </div>
      </div>
    </header>
  `;
}

/* ── Trip card renderer ───────────────────────────────────── */

function renderTrips(trips, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  if (trips.length === 0) {
    container.innerHTML = '<div class="empty-state"><p>ไม่พบทริป</p></div>';
    return;
  }
  trips.forEach(t => {
    const card = document.createElement('div');
    card.className = 'trip-card';
    card.onclick = () => {
      sessionStorage.setItem('selectedTrip', JSON.stringify(t));
      window.location.href = '/pages/booking.html';
    };
    card.innerHTML = `
      <div class="trip-card__top">
        <div class="trip-card__driver">
          <div class="trip-card__avatar">${t.driver.full_name.substring(0,1)}</div>
          <div>
            <h3>${t.driver.full_name}</h3>
            <div class="trip-card__contact">เบอร์ติดต่อ: ${t.driver.phone || 'ไม่มีข้อมูล'}</div>
            <div class="trip-card__vehicle">รถ: ${t.vehicle.brand} ${t.vehicle.model} • ทะเบียน ${t.vehicle.plate_number} • สี: ${t.vehicle.color || 'ไม่มีข้อมูล'}</div>
            <div class="trip-card__rating">⭐ ${t.driver.rating > 0 ? t.driver.rating : 'ไม่มีรีวิว'} (${t.driver.trip_count} ทริป)</div>
          </div>
        </div>
        <div class="trip-card__price">
          <strong>฿${t.price_per_seat}</strong>
          <small>ต่อที่นั่ง</small>
        </div>
      </div>
      <div class="trip-card__route">
        <div><strong>${t.origin}</strong><br><small>ต้นทาง</small></div>
        <div style="padding-top:10px">→</div>
        <div><strong>${t.destination}</strong><br><small>ปลายทาง</small></div>
      </div>
      <div class="trip-card__footer">
        <div class="trip-card__time-dot"></div>
        <span>${new Date(t.departure_time).toLocaleString('th-TH')}</span>
        <span style="margin-left:auto">ว่าง ${t.available_seats} ที่</span>
      </div>
    `;
    container.appendChild(card);
  });
}
