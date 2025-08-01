// =======================
// تسجيل دخول بسيط
// =======================
function simpleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  if (username === "admin" && password === "1234") { // غيرهم زي ما تحب
    localStorage.setItem("loggedIn", "true");
    window.location.href = "dashboard.html";
  } else {
    document.getElementById('error-message').innerText = "بيانات الدخول غير صحيحة!";
  }
}

// تسجيل الخروج
function logout() {
  localStorage.removeItem("loggedIn");
  window.location.href = "index.html";
}

// منع دخول لوحة التحكم بدون تسجيل
if (document.body.contains(document.querySelector('.dashboard'))) {
  if (localStorage.getItem("loggedIn") !== "true") {
    window.location.href = "index.html";
  }
}

// =======================
// Firebase (للعملاء والديون)
// =======================
const firebaseConfig = {
  apiKey: "xxxx",
  authDomain: "xxxx.firebaseapp.com",
  projectId: "xxxx",
  storageBucket: "xxxx.appspot.com",
  messagingSenderId: "xxxx",
  appId: "xxxx"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

let selectedClientId = null;
let selectedClientName = null;

// تحميل العملاء
function loadClients() {
  const list = document.getElementById('clientsList');
  list.innerHTML = '';
  db.collection('clients').get().then(snapshot => {
    snapshot.forEach(doc => {
      const client = doc.data();
      const div = document.createElement('div');
      div.classList.add('client-item');
      div.innerHTML = `<strong>${client.name}</strong>`;
      div.onclick = () => {
        selectedClientId = doc.id;
        selectedClientName = client.name;
        loadDebts(doc.id, client.name);
        highlightSelected(div);
      };
      list.appendChild(div);
    });
  });
}

// تمييز العميل المحدد
function highlightSelected(selectedElement) {
  const items = document.querySelectorAll('.client-item');
  items.forEach(item => item.classList.remove('selected'));
  selectedElement.classList.add('selected');
}

// إضافة عميل
function addClient() {
  const name = document.getElementById('clientName').value;
  if (!name) return alert("أدخل اسم العميل");
  db.collection('clients').add({ name }).then(() => {
    alert("تم إضافة العميل");
    document.getElementById('clientName').value = "";
    loadClients();
  });
}

// حذف العميل المحدد
function deleteClient() {
  if (!selectedClientId) return alert("اختر عميل أولاً");

  if (confirm(`هل أنت متأكد من حذف العميل: ${selectedClientName}؟`)) {
    // احذف كل الديون أولاً
    const debtsRef = db.collection('clients').doc(selectedClientId).collection('debts');
    debtsRef.get().then(snapshot => {
      const batch = db.batch();
      snapshot.forEach(doc => batch.delete(doc.ref));
      batch.commit().then(() => {
        db.collection('clients').doc(selectedClientId).delete().then(() => {
          alert("تم حذف العميل");
          selectedClientId = null;
          selectedClientName = null;
          loadClients();
          document.getElementById('debtsSection').innerHTML = "<p>اختر عميل من القائمة لعرض التفاصيل</p>";
        });
      });
    });
  }
}

// تحميل ديون العميل
function loadDebts(clientId, name) {
  document.getElementById('clientTitle').innerText = `ديون ${name}`;
  const section = document.getElementById('debtsSection');
  section.innerHTML = `
    <h4>إضافة عملية</h4>
    <input type="text" id="productName" placeholder="اسم المنتج">
    <input type="number" id="debtAmount" placeholder="السعر">
    <button onclick="addDebt('${clientId}')">إضافة</button>
    <h4>الديون</h4>
    <table>
      <thead><tr><th>المنتج</th><th>السعر</th><th>التاريخ</th></tr></thead>
      <tbody id="debtsList"></tbody>
    </table>
    <h4>الإجمالي: <span id="totalDebt">0</span> ج</h4>
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
  if (!product || !amount) { alert("أدخل اسم المنتج والسعر"); return; }

  db.collection('clients').doc(clientId).collection('debts').add({
    product, amount, date: new Date().toLocaleString()
  }).then(() => loadDebts(clientId));
}

if (document.body.contains(document.getElementById('clientsList'))) loadClients();
