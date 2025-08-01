// تحديد نوع الإدارة
let mode = localStorage.getItem("mode") || "clients";

// تسجيل الدخول مع تحديد الوضع
function simpleLogin(selectedMode) {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  if (username === "admin" && password === "1234") {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("mode", selectedMode);
    window.location.href = selectedMode === "clients" ? "dashboard.html" : "staff.html";
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
  mode = localStorage.getItem("mode") || "clients";
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

// تحميل العملاء أو الموظفين
function loadClients() {
  const table = document.getElementById('clientsTable');
  db.ref(mode).on('value', snapshot => {
    table.innerHTML = '';
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

// إضافة عميل أو موظف
function addClient() {
  const name = document.getElementById('clientName').value;
  if (!name) return alert("أدخل الاسم");
  const newClientRef = db.ref(mode).push();
  newClientRef.set({ name: name }, (error) => {
    if (error) {
      alert("حصل خطأ أثناء الإضافة!");
    } else {
      document.getElementById('clientName').value = "";
    }
  });
}

// حذف عميل أو موظف
function deleteClient() {
  if (!selectedClientId) return alert("اختر اسم أولاً");
  if (!confirm(`هل أنت متأكد من الحذف ${selectedClientName}؟`)) return;
  db.ref(mode + '/' + selectedClientId).remove();
  selectedClientId = null;
  selectedClientName = null;
  document.getElementById('debtsSection').innerHTML = "<p>اختر اسم من الجدول لعرض التفاصيل</p>";
}

// تحميل تفاصيل
function loadDebts(clientId, name) {
  document.getElementById('clientTitle').innerText = `تفاصيل ${name}`;
  const section = document.getElementById('debtsSection');
  section.innerHTML = `
    <table>
      <thead>
        <tr><th>الوصف</th><th>المبلغ</th><th>التاريخ</th><th>إجراءات</th></tr>
      </thead>
      <tbody id="debtsList"></tbody>
    </table>
    <h4>الإجمالي: <span id="totalDebt">0</span> ج</h4>
    <h4>إضافة عملية</h4>
    <input type="text" id="productName" placeholder="الوصف">
    <input type="number" id="debtAmount" placeholder="المبلغ">
    <button onclick="addDebt('${clientId}')">إضافة</button>
    <h4>تسجيل دفع</h4>
    <input type="number" id="paymentAmount" placeholder="المبلغ المدفوع">
    <button onclick="addPayment('${clientId}')">تسجيل دفع</button>
  `;

  db.ref(mode + '/' + clientId + '/debts').once('value', snapshot => {
    const debtsList = document.getElementById('debtsList');
    debtsList.innerHTML = '';
    let total = 0;
    snapshot.forEach(child => {
      const debt = child.val();
      total += parseFloat(debt.amount);
      debtsList.innerHTML += `
        <tr>
          <td>${debt.product}</td>
          <td>${debt.amount}</td>
          <td>${debt.date}</td>
          <td><button onclick="editDebt('${clientId}', '${child.key}', '${debt.product}', '${debt.amount}')">تعديل</button></td>
        </tr>`;
    });
    document.getElementById('totalDebt').innerText = total;
  });
}

// إضافة عملية
function addDebt(clientId) {
  const product = document.getElementById('productName').value;
  const amount = parseFloat(document.getElementById('debtAmount').value);
  if (!product || !amount) return alert("أدخل الوصف والمبلغ");
  const newDebtRef = db.ref(mode + '/' + clientId + '/debts').push();
  newDebtRef.set({
    product, amount, date: new Date().toLocaleString()
  }).then(() => loadDebts(clientId, selectedClientName));
}

// تعديل عملية
function editDebt(clientId, debtId, oldProduct, oldAmount) {
  const newProduct = prompt("أدخل الوصف الجديد:", oldProduct);
  const newAmount = parseFloat(prompt("أدخل المبلغ الجديد:", oldAmount));
  if (!newProduct || isNaN(newAmount)) return alert("البيانات غير صالحة!");
  db.ref(`${mode}/${clientId}/debts/${debtId}`).update({
    product: newProduct,
    amount: newAmount
  }).then(() => loadDebts(clientId, selectedClientName));
}

// تسجيل دفع
function addPayment(clientId) {
  const payment = parseFloat(document.getElementById('paymentAmount').value);
  if (!payment || payment <= 0) return alert("أدخل مبلغ صحيح");
  const newDebtRef = db.ref(mode + '/' + clientId + '/debts').push();
  newDebtRef.set({
    product: "دفع",
    amount: -payment,
    date: new Date().toLocaleString()
  }).then(() => loadDebts(clientId, selectedClientName));
}

if (document.body.contains(document.getElementById('clientsTable'))) loadClients();
