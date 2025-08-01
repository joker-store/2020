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
  apiKey: "AIzaSyC7V0kGz3p11sjF-FMSLW4kJ5WuZzNtLX0",
  authDomain: "cafe-pc-8a386.firebaseapp.com",
  databaseURL: "https://cafe-pc-8a386-default-rtdb.firebaseio.com",
  projectId: "cafe-pc-8a386",
  storageBucket: "cafe-pc-8a386.firebasestorage.app",
  messagingSenderId: "150129569328",
  appId: "1:150129569328:web:793a4eb7a1c9dd091947f5",
  measurementId: "G-35NEY890C3"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let selectedClientId = null;
let selectedClientName = null;

// تحميل العملاء
function loadClients() {
  const table = document.getElementById('clientsTable');
  table.innerHTML = '';
  db.collection('clients').orderBy('name').get().then(snapshot => {
    snapshot.forEach(doc => {
      const client = doc.data();
      const row = document.createElement('tr');
      row.innerHTML = `<td>${client.name}</td>`;
      row.onclick = () => {
        selectedClientId = doc.id;
        selectedClientName = client.name;
        loadDebts(doc.id, client.name);
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
  db.collection('clients').add({ name }).then(() => {
    document.getElementById('clientName').value = "";
    loadClients();
  }).catch(err => alert("خطأ في الإضافة: " + err));
}

// حذف عميل
function deleteClient() {
  if (!selectedClientId) return alert("اختر عميل أولاً");
  if (!confirm(`هل أنت متأكد من حذف العميل ${selectedClientName}؟`)) return;

  const debtsRef = db.collection('clients').doc(selectedClientId).collection('debts');
  debtsRef.get().then(snapshot => {
    const batch = db.batch();
    snapshot.forEach(doc => batch.delete(doc.ref));
    batch.commit().then(() => {
      db.collection('clients').doc(selectedClientId).delete().then(() => {
        selectedClientId = null;
        selectedClientName = null;
        loadClients();
        document.getElementById('debtsSection').innerHTML = "<p>اختر عميل من الجدول لعرض التفاصيل</p>";
      });
    });
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

  db.collection('clients').doc(clientId).collection('debts').orderBy('date', 'desc').get().then(snapshot => {
    const debtsList = document.getElementById('debtsList');
    debtsList.innerHTML = '';
    let total = 0;
    snapshot.forEach(doc => {
      const debt = doc.data();
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
  db.collection('clients').doc(clientId).collection('debts').add({
    product, amount, date: new Date().toLocaleString()
  }).then(() => loadDebts(clientId, selectedClientName));
}

if (document.body.contains(document.getElementById('clientsTable'))) loadClients();
