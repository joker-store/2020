// Firebase Config (حط بياناتك هنا)
const firebaseConfig = {
  apiKey: "xxxx",
  authDomain: "xxxx.firebaseapp.com",
  projectId: "xxxx",
  storageBucket: "xxxx.appspot.com",
  messagingSenderId: "xxxx",
  appId: "xxxx"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// تسجيل الدخول والخروج
function login() { ... }  // نفس الكود السابق
function register() { ... }
function logout() { auth.signOut().then(() => window.location.href = "index.html"); }
auth.onAuthStateChanged(user => { if (document.body.contains(document.querySelector('.dashboard')) && !user) window.location.href = "index.html"; });

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
      div.onclick = () => loadDebts(doc.id, client.name);
      list.appendChild(div);
    });
  });
}

// البحث
function searchClient() {
  const query = document.getElementById('searchClient').value.toLowerCase();
  const list = document.querySelectorAll('#clientsList div');
  list.forEach(div => { div.style.display = div.textContent.toLowerCase().includes(query) ? '' : 'none'; });
}

// إضافة عميل
function addClient() {
  const name = document.getElementById('clientName').value;
  const phone = document.getElementById('clientPhone').value;
  const notes = document.getElementById('clientNotes').value;
  if (!name) { alert("أدخل اسم العميل"); return; }
  db.collection('clients').add({ name, phone, notes }).then(() => { alert("تم إضافة العميل"); loadClients(); });
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
