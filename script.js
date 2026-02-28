// simple account system using localStorage

// seed owner account (owner credentials)
const OWNER_USERNAME = 'Jan';
const OWNER_SURNAME = 'pluscec';
const OWNER_PASSWORD = '122i@56L';

function loadUsers() {
    const data = localStorage.getItem('users');
    return data ? JSON.parse(data) : [];
}
function saveUsers(users) {
    localStorage.setItem('users', JSON.stringify(users));
}

function ensureOwner() {
    let users = loadUsers();
    const ownerIndex = users.findIndex(u => u.role === 'owner');
    if (ownerIndex === -1) {
        users.push({
            name: OWNER_USERNAME,
            surname: OWNER_SURNAME,
            password: OWNER_PASSWORD,
            role: 'owner',
            notifications: [],
            credits: { free: 0, discount: 0},
            purchases: 0
        });
    } else {
        // update existing owner record to match configured owner credentials
        users[ownerIndex].name = OWNER_USERNAME;
        users[ownerIndex].surname = OWNER_SURNAME;
        users[ownerIndex].password = OWNER_PASSWORD;
        if (!users[ownerIndex].notifications) users[ownerIndex].notifications = [];
        if (!users[ownerIndex].credits) users[ownerIndex].credits = { free: 0, discount: 0 };
        if (typeof users[ownerIndex].purchases === 'undefined') users[ownerIndex].purchases = 0;
    }
    saveUsers(users);
}

ensureOwner();

// login forms
const ownerLoginForm = document.getElementById('owner-login-form');
const customerLoginForm = document.getElementById('customer-login-form');

ownerLoginForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('owner-name').value.trim();
    const surname = document.getElementById('owner-surname').value.trim();
    const pwd = document.getElementById('owner-password').value;
    const users = loadUsers();
    const owner = users.find(u => u.role === 'owner' && u.name === name && u.surname === surname && u.password === pwd);
    if (owner) showOwnerDashboard(owner);
    else alert('Pogrešni podaci za ownera');
});

customerLoginForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('customer-name').value.trim();
    const surname = document.getElementById('customer-surname').value.trim();
    const pwd = document.getElementById('customer-password').value;
    const users = loadUsers();
    const customer = users.find(u => u.role === 'customer' && u.name === name && u.surname === surname && u.password === pwd);
    if (customer) showCustomerDashboard(customer);
    else alert('Pogrešni podaci ili nema računa');
});

// dashboards
const ownerDashboard = document.getElementById('owner-dashboard');
const customerDashboard = document.getElementById('customer-dashboard');

function showOwnerDashboard(owner) {
    document.getElementById('login-container').classList.add('hidden');
    ownerDashboard.classList.remove('hidden');
    const status = localStorage.getItem('ownerStatus') || '';
    document.getElementById('owner-status').textContent = status ? `Status: ${status}` : 'Owner je prijavljen';
    document.getElementById('status-input').value = status;
    refreshUserTable();
}

function showCustomerDashboard(customer) {
    document.getElementById('login-container').classList.add('hidden');
    customerDashboard.classList.remove('hidden');
    renderCustomerInfo(customer);
    renderLeaderboard();
    const status = localStorage.getItem('ownerStatus') || '';
    if (status) {
        const noteEl = document.createElement('p');
        noteEl.textContent = `Owner status: ${status}`;
        customerDashboard.insertBefore(noteEl, customerDashboard.firstChild);
    }
}

// owner features
const addUserForm = document.getElementById('add-user-form');
addUserForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('new-name').value.trim();
    const surname = document.getElementById('new-surname').value.trim();
    const pwd = document.getElementById('new-password').value;
    if (!name || !surname || !pwd) return;
    let users = loadUsers();
    if (users.find(u => u.role === 'customer' && u.name === name && u.surname === surname)) {
        alert('Korisnik već postoji');
        return;
    }
    users.push({
        name,
        surname,
        password: pwd,
        role: 'customer',
        notifications: [],
        credits: { free: 0, discount: 0},
        purchases: 0
    });
    saveUsers(users);
    addUserForm.reset();
    refreshUserTable();
});

function refreshUserTable() {
    const tbody = document.querySelector('#users-table tbody');
    tbody.innerHTML = '';
    const users = loadUsers().filter(u => u.role === 'customer');
    users.forEach((u, idx) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${u.name}</td>
            <td>${u.surname}</td>
            <td>${u.purchases}</td>
            <td>${u.credits.free}</td>
            <td>${u.credits.discount}</td>
            <td>
                <button data-action="delete" data-index="${idx}">Obriši</button>
                <button data-action="notify" data-index="${idx}">Obavijest</button>
                <button data-action="addPurchase" data-index="${idx}">+Kupnja</button>
                <button data-action="addFree" data-index="${idx}">+Besplatno</button>
                <button data-action="addDiscount" data-index="${idx}">+Diskont</button>
            </td>`;
        tbody.appendChild(tr);
    });
}

document.querySelector('#users-table').addEventListener('click', e => {
    if (e.target.tagName === 'BUTTON') {
        const action = e.target.getAttribute('data-action');
        const idx = parseInt(e.target.getAttribute('data-index'), 10);
        let customers = loadUsers().filter(u => u.role === 'customer');
        const users = loadUsers();
        const cust = customers[idx];
        const all = loadUsers();
        const userObj = all.find(u => u.role === 'customer' && u.name === cust.name && u.surname === cust.surname);
        switch (action) {
            case 'delete': {
                const newList = users.filter(u => !(u.role === 'customer' && u.name === cust.name && u.surname === cust.surname));
                saveUsers(newList);
                break;
            }
            case 'notify': {
                const msg = prompt('Poruka za korisnika:');
                if (msg) userObj.notifications.push(msg);
                break;
            }
            case 'addPurchase': {
                userObj.purchases = (userObj.purchases || 0) + 1;
                break;
            }
            case 'addFree': {
                userObj.credits.free = (userObj.credits.free || 0) + 1;
                break;
            }
            case 'addDiscount': {
                userObj.credits.discount = (userObj.credits.discount || 0) + 1;
                break;
            }
        }
        saveUsers(all);
        refreshUserTable();
    }
});

// status save
document.getElementById('status-save').addEventListener('click', () => {
    const status = document.getElementById('status-input').value.trim();
    localStorage.setItem('ownerStatus', status);
    document.getElementById('owner-status').textContent = status ? `Status: ${status}` : '';
});

// logout buttons
document.getElementById('owner-logout').addEventListener('click', () => {
    ownerDashboard.classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
});

document.getElementById('customer-logout').addEventListener('click', () => {
    customerDashboard.classList.add('hidden');
    document.getElementById('login-container').classList.remove('hidden');
});

// customer features
function renderCustomerInfo(customer) {
    const info = document.getElementById('customer-info');
    info.innerHTML = `
        <p>Ime: ${customer.name} ${customer.surname}</p>
        <p>Besplatno: ${customer.credits.free} | Diskont: ${customer.credits.discount}</p>
        <p>Kupnje: ${customer.purchases}</p>
    `;
    const notEl = document.getElementById('notifications');
    notEl.innerHTML = '';
    customer.notifications.forEach(n => {
        const li = document.createElement('li');
        li.textContent = n;
        notEl.appendChild(li);
    });
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard');
    list.innerHTML = '';
    const customers = loadUsers().filter(u => u.role === 'customer');
    customers.sort((a, b) => b.purchases - a.purchases);
    customers.forEach(c => {
        const li = document.createElement('li');
        li.textContent = `${c.name} ${c.surname} - kupnje: ${c.purchases}`;
        list.appendChild(li);
    });
}
