const API_URL = 'http://localhost:4000/api';

async function validateRegister(event) {
  if (event) event.preventDefault();

  let name = document.getElementById("name").value.trim();
  let surname = document.getElementById("surname").value.trim();
  let email = document.getElementById("email").value.trim();
  let password = document.getElementById("password").value;

  if (!name || !surname || !email || !password) {
    alert("Усі поля є обов'язковими!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, surname, email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("Реєстрація успішна! Тепер ви можете увійти.");
      window.location.href = 'login.html';
    } else {
      alert(data.error || "Помилка реєстрації");
    }
  } catch (error) {
    console.error("Помилка запиту:", error);
    alert("Не вдалося з'єднатися з сервером.");
  }
}

async function validateLogin(event) {
  if (event) event.preventDefault();

  let email = document.getElementById("loginEmail").value.trim();
  let password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Заповніть усі поля!");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert(`Вітаємо, ${data.user.name}! Вхід успішний.`);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      window.location.href = 'dashboard.html';
    } else {
      alert(data.error || "Невірний email або пароль");
    }
  } catch (error) {
    console.error("Помилка запиту:", error);
    alert("Не вдалося з'єднатися з сервером.");
  }
}

function toggleTheme() {
  document.body.classList.toggle("light");
}

let cachedRecords = [];

function renderDashboard(data) {
  const el = document.getElementById("current-data");
  if (!el) return;

  el.innerHTML = `
    <div class="card">AQI: ${data.aqi}</div>
    <div class="card">PM2.5: ${data.pm25}</div>
    <div class="card">Температура: ${data.temperature}°C</div>
    <div class="card">Вологість: ${data.humidity}%</div>
  `;
}

function renderHistory(records) {
  const el = document.getElementById("history-list");
  if (!el) return;

  if (!Array.isArray(records) || records.length === 0) {
    el.innerHTML = "<p>Історичні дані відсутні</p>";
    return;
  }

  let html = `
    <table style="width:100%; border-collapse:collapse; text-align:center;">
      <thead>
        <tr>
          <th>AQI</th>
          <th>PM2.5</th>
          <th>Температура</th>
          <th>Вологість</th>
        </tr>
      </thead>
      <tbody>
  `;

  records.forEach(r => {
    html += `
      <tr>
        <td>${r.aqi}</td>
        <td>${r.pm25}</td>
        <td>${r.temperature}°C</td>
        <td>${r.humidity}%</td>
      </tr>
    `;
  });

  html += "</tbody></table>";

  el.innerHTML = html;
}

async function loadHistory(userId) {
  try {
    const res = await fetch(`${API_URL}/records/${userId}`);
    cachedRecords = await res.json();
    //const data = await res.json();
    //renderHistory(data);
    applyFilter();
  } catch (err) {
    console.error("History error:", err);
  }
}

function applyFilter() {
  const filterEl = document.getElementById("aqi-filter");
  const filterValue = filterEl ? filterEl.value : "all";

  let filtered = [...cachedRecords];

  if (filterValue === "good") {
    filtered = filtered.filter(r => r.aqi <= 50);
  } else if (filterValue === "moderate") {
    filtered = filtered.filter(r => r.aqi > 50 && r.aqi <= 100);
  } else if (filterValue === "poor") {
    filtered = filtered.filter(r => r.aqi > 100);
  }

  renderHistory(filtered);
}

async function updateData() {
  const aqi = Math.floor(Math.random() * 150);
  const pm25 = Math.floor(Math.random() * 50);
  const temperature = Math.floor(Math.random() * 15) + 15;
  const humidity = Math.floor(Math.random() * 40) + 40;

  const userJson = sessionStorage.getItem("user");
  const userId = userJson ? JSON.parse(userJson).id : 1;

  renderDashboard({ aqi, pm25, temperature, humidity });

  try {
    await fetch(`${API_URL}/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        aqi,
        pm25,
        temperature,
        humidity
      })
    });

    await loadHistory(userId);
  } catch (err) {
    console.error("POST error:", err);
  }
}

function displayCurrentUserInfo() {
    const welcomeText = document.getElementById("welcome-user");
    if (!welcomeText) return;

    const userJson = sessionStorage.getItem('user');
    if (userJson) {
        const user = JSON.parse(userJson);
        welcomeText.innerHTML = `Користувач: <b style="color: #38bdf8;">${user.name} ${user.surname}</b>`;
    } else {
        welcomeText.innerHTML = `Користувач: <b style="color: #94a3b8;">Тестовий акаунт (ID: 1)</b>`;
    }
}

function logout() {
    if (confirm("Ви впевнені, що хочете вийти з системи?")) {
        sessionStorage.removeItem('user');
        alert("Ви вийшли з системи.");
        window.location.href = 'login.html';
    }
}

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("refresh-btn");

  const userJson = sessionStorage.getItem("user");
  const userId = userJson ? JSON.parse(userJson).id : 1;

  if (btn) {
    btn.addEventListener("click", updateData);
  }

  displayCurrentUserInfo();
  loadHistory(userId);
});