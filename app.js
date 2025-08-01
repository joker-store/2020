// تسجيل الدخول
function simpleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username === "admin" && password === "1234") {
    localStorage.setItem("loggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    document.getElementById('error-message').innerText = "بيانات الدخول غير صحيحة!";
  }
}

function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}

if (document.body.contains(document.querySelector('.dashboard'))) {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
  }
}

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDZQJZnekkDRf6jGIplVFlx0MckFR-xed8",
  authDomain: "ahmed-77878.firebaseapp.com",
  databaseURL: "https://ahmed-77878-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "ahmed-77878",
  storageBucket: "ahmed-77878.firebasestorage.app",
  messagingSenderId: "566732207368",
  appId: "1:566732207368:web:d88477f62ecf475e2628bd",
  measurementId: "G-NTBFNP3PLF"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let selectedClientId = null;
let selectedClientName = null;

// تحميل العملاء
function loadClients() {
  const table = document.getElementById('clientsTable');
  table.innerHTML = '';
  db.ref('clients').once('value', snapshot => {
    snapshot.forEach(child => {
      const client = child.val();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${client.name}</td>`;
      row.onclick = () => {
        selectedClientId = child.key;
        selectedClientName = client.name;
        loadDebts(child.key, client.name);
        highlightRow(row);
      };
      table.appendChild(row);
    });
  });
}

function highlightRow(selectedRow) {
  const rows = document.querySelectorAll('#clientsTable tr');
  rows.forEach(r => r.classList.remove('selected'));
  selectedRow.classList.add('selected');
}

// إضافة عميل
function addClient() {
  const name = document.getElementById('clientName').value;
  if (!name) return alert("أدخل اسم العميل");
  const newClientRef = db.ref('clients').push();
  newClientRef.set({ name }).then(() => {
    document.getElementById('clientName').value = "";
    loadClients();
  });
}

// حذف عميل
function deleteClient() {
  if (!selectedClientId) return alert("اختر عميل أولاً");
  if (!confirm(`هل أنت متأكد من حذف العميل ${selectedClientName}؟`)) return;
  db.ref('clients/' + selectedClientId).remove().then(() => {
    selectedClientId = null;
    selectedClientName = null;
    loadClients();
    document.getElementById('debtsSection').innerHTML = "<p>اختر عميل من الجدول لعرض التفاصيل</p>";
  });
}

// تحميل ديون العميل
function loadDebts(clientId, name) {
  document.getElementById('clientTitle').innerText = `ديون ${name}`;
  const section = document.getElementById('debtsSection');
  section.innerHTML = `
    <table>
      <thead>
        <tr><th>المنتج</th><th>السعر</th><th>التاريخ</th></tr>
      </thead>
      <tbody id="debtsList"></tbody>
    </table>
    <h4>الإجمالي: <span id="totalDebt">0</span> ج</h4>
    <h4>إضافة عملية</h4>
    <input type="text" id="productName" placeholder="اسم المنتج">
    <input type="number" id="debtAmount" placeholder="السعر">
    <button onclick="addDebt('${clientId}')">إضافة</button>
  `;

  db.ref('clients/' + clientId + '/debts').once('value', snapshot => {
    const debtsList = document.getElementById('debtsList');
    debtsList.innerHTML = '';
    let total = 0;
    snapshot.forEach(child => {
      const debt = child.val();
      total += parseFloat(debt.amount);
      debtsList.innerHTML += `<tr><td>${debt.product}</td><td>${debt.amount}</td><td>${debt.date}</td></tr>`;
    });
    document.getElementById('totalDebt').innerText = total;
  });
}

// إضافة دين
function addDebt(clientId) {
  const product = document.getElementById('productName').value;
  const amount = parseFloat(document.getElementById('debtAmount').value);
  if (!product || !amount) return alert("أدخل اسم المنتج والسعر");
  const newDebtRef = db.ref('clients/' + clientId + '/debts').push();
  newDebtRef.set({
    product, amount, date: new Date().toLocaleString()
  }).then(() => loadDebts(clientId, selectedClientName));
}

if (document.body.contains(document.getElementById('clientsTable'))) loadClients();
