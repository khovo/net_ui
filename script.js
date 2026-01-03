// 🔥 BACKEND URL (Check spelling!) 🔥
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529"; // Your ID

let user = { id: "0", first_name: "Guest", photo_url: "" };

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram User
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        const u = tg.initDataUnsafe?.user;
        if (u) {
            user.id = u.id.toString();
            user.first_name = u.first_name;
            user.photo_url = u.photo_url;
        } else {
            // Browser Test
            user.id = ADMIN_ID; 
            user.first_name = "Admin (Test)";
        }
    }

    // 2. Admin Button
    if (user.id === ADMIN_ID) {
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    // 3. Load Data from Vercel DB
    refreshData();
});

async function refreshData() {
    try {
        // Send User Info (Sync)
        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });
        
        const data = await res.json();
        
        // Update UI
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('userid').innerText = user.id;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        
        if (data.photo_url) {
            document.getElementById('avatar').src = data.photo_url;
        }

        // Stats
        document.getElementById('stat-ads').innerText = data.today_ads || 0;
        
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        alert("Database Connection Failed. Check Backend URL.");
    }
}

// --- ADS ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-go');
    btn.innerText = "...";

    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            claimReward(0.50);
            btn.innerText = "GO";
        }).catch(() => {
            if(confirm("Ad failed. Simulate?")) claimReward(0.50);
            btn.innerText = "GO";
        });
    } else {
        if(confirm("Script Loading... Simulate?")) claimReward(0.50);
        btn.innerText = "GO";
    }
}

async function claimReward(amt) {
    const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user.id, amount: amt })
    });
    const data = await res.json();
    if(data.status === 'success') {
        document.getElementById('balance').innerText = data.new_balance.toFixed(2);
        alert(`+${amt} ETB Added!`);
        refreshData(); // Sync stats
    }
}

// --- ADMIN PANEL ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;

    if(!title || !link) return alert("Empty fields");

    await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title, link, reward })
    });
    alert("Task Added to Database!");
    loadTasks();
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: uid, amount: parseFloat(amt) })
    });
    alert("Sent!");
}

async function loadWithdrawals() {
    const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`);
    const list = await res.json();
    const box = document.getElementById('admin-withdrawals');
    
    if(list.length === 0) box.innerHTML = "No requests";
    else {
        box.innerHTML = list.map(w => 
            `<div style="background:#222; padding:10px; margin-bottom:5px; font-size:12px;">
                <b>${w.amount} ETB</b> - ${w.user_id} <br>
                ${w.method}: ${w.account} <br>
                Status: ${w.status}
            </div>`
        ).join('');
    }
}

// --- TASKS LIST ---
async function loadTasks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const tasks = await res.json();
        const box = document.getElementById('task-list');
        
        if(tasks.length === 0) box.innerHTML = "<p style='color:#666; text-align:center'>No tasks yet</p>";
        else {
            box.innerHTML = tasks.map(t => `
                <div class="menu-item" onclick="openUrl('${t.link}')">
                    <div class="icon invite"><i class="fas fa-check"></i></div>
                    <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                    <button class="btn-go">DO</button>
                </div>
            `).join('');
        }
    } catch(e) {}
}

// --- UTILS ---
function requestWithdraw() {
    const amt = document.getElementById('wd-amount').value;
    const acc = document.getElementById('wd-account').value;
    const method = document.querySelector('.pay-option.active').innerText;

    if(!amt || !acc) return alert("Fill details");

    fetch(`${BACKEND_URL}/api/withdraw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user.id, amount: amt, account: acc, method: method })
    }).then(r => r.json()).then(d => {
        if(d.error) alert(d.error);
        else {
            alert("Request Sent to Admin!");
            document.getElementById('balance').innerText = d.new_balance.toFixed(2);
        }
    });
}

function switchTab(id, el) {
    document.querySelectorAll('.tab-view').forEach(d=>d.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
        el.classList.add('active');
    }
    if(id === 'tasks') loadTasks();
    if(id === 'admin') loadWithdrawals();
}

function openUrl(url) {
    if(window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
}

function copyLink() {
    navigator.clipboard.writeText(`https://t.me/RiyalNetBot?start=${user.id}`);
    alert("Copied!");
}

function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p=>p.classList.remove('active'));
    el.classList.add('active');
}
