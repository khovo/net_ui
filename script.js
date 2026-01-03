// 🔥 BACKEND URL (ትክክለኛውን እዚህ አስገባ) 🔥
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529"; 

let user = { id: "0", first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram User Check
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        const u = tg.initDataUnsafe?.user;
        if (u) {
            user.id = u.id.toString();
            user.first_name = u.first_name;
            user.photo_url = u.photo_url;
        } else {
            // Test Mode
            user.id = ADMIN_ID; user.first_name = "Admin (Test)";
        }
    }

    // 2. Show Admin Button if Admin
    if (user.id === ADMIN_ID) {
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    // 3. Connect to Backend
    initData();
    loadTasks();
});

async function initData() {
    try {
        // Sync User with Backend
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });
        
        const data = await response.json();
        
        // Update UI
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('userid').innerText = user.id;
        if(data.photo_url) document.getElementById('avatar').src = data.photo_url;

        // Stats
        document.getElementById('stat-ads').innerText = data.today_ads || 0;
        document.getElementById('stat-refs').innerText = data.total_ref || 0;
        document.getElementById('stat-income').innerText = (data.total_income || 0).toFixed(2);
        document.getElementById('ads-left').innerText = 50 - (data.today_ads || 0);

        // Invite & Requirements
        document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${user.id}`;
        document.getElementById('page-invite-count').innerText = data.total_ref || 0;
        document.getElementById('page-invite-earn').innerText = ((data.total_ref || 0) * 1.00).toFixed(2) + " ETB";

        checkRequirements(data);

        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        document.getElementById('loader').innerHTML = "<p style='color:red'>Server Connection Failed.<br>Please try again later.</p>";
    }
}

// --- ADS LOGIC ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-go');
    btn.innerText = "...";

    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            sendReward(0.50);
            btn.innerText = "GO";
        }).catch(() => {
            if(confirm("Ad failed. Simulate?")) sendReward(0.50);
            btn.innerText = "GO";
        });
    } else {
        if(confirm("Script Loading... Simulate?")) sendReward(0.50);
        btn.innerText = "GO";
    }
}

async function sendReward(amount) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: user.id, amount: amount })
        });
        const data = await res.json();
        if (data.status === "success") {
            document.getElementById('balance').innerText = data.new_balance.toFixed(2);
            alert(`🎉 +${amount} ETB Added!`);
            initData(); // Refresh Stats
        }
    } catch(e) { alert("Network Error"); }
}

// --- TASKS ---
async function loadTasks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const tasks = await res.json();
        const container = document.getElementById('tasks-container');
        
        if(tasks.length === 0) container.innerHTML = "<p style='text-align:center; color:#666'>No tasks available</p>";
        else {
            container.innerHTML = tasks.map(t => `
                <div class="menu-item" onclick="openUrl('${t.link}')">
                    <div class="icon invite"><i class="fas fa-check"></i></div>
                    <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                    <button class="btn-go">DO</button>
                </div>
            `).join('');
        }
    } catch(e) {}
}

// --- ADMIN ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    if(!title || !link) return alert("Fill fields");
    
    await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ title, link, reward: parseFloat(reward) })
    });
    alert("Task Added!");
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
    if(list.length === 0) box.innerHTML = "<p>No requests</p>";
    else {
        box.innerHTML = list.map(w => 
            `<div style="background:#111; padding:10px; margin:5px; border-radius:5px; font-size:12px;">
                ${w.amount} ETB - ${w.user_id} <br> ${w.method}: ${w.account} <br> ${w.status}
            </div>`
        ).join('');
    }
}

// --- REQUIREMENTS ---
function checkRequirements(data) {
    const btn = document.getElementById('btn-withdraw');
    const ok1 = (data.total_ref || 0) >= 5;
    const ok2 = (data.ads_watched_total || 0) >= 30;
    const ok3 = (data.balance || 0) >= 50;

    if(ok1) updateReq('req-invite');
    if(ok2) updateReq('req-ads');
    if(ok3) updateReq('req-bal');

    if(ok1 && ok2 && ok3) {
        btn.classList.remove('disabled');
        btn.innerText = "Request Withdrawal";
    }
}
function updateReq(id) {
    const el = document.getElementById(id);
    el.classList.add('done');
    el.querySelector('i').className = "fas fa-check-circle";
}

function requestWithdraw() {
    if(document.getElementById('btn-withdraw').classList.contains('disabled')) return alert("Requirements not met!");
    const amt = document.getElementById('wd-amount').value;
    const acc = document.getElementById('wd-account').value;
    
    fetch(`${BACKEND_URL}/api/withdraw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user.id, amount: amt, account: acc })
    }).then(r=>r.json()).then(d => {
        if(d.error) alert(d.error);
        else {
            alert("Request Sent!");
            document.getElementById('balance').innerText = d.new_balance.toFixed(2);
        }
    });
}

// Utils
function switchTab(id, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    if(id==='admin') loadWithdrawals();
}
function openUrl(url) { window.open(url, '_blank'); }
function copyRef() { 
    const el = document.getElementById('ref-link');
    el.select(); document.execCommand('copy'); 
    alert("Copied!"); 
}
function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p=>p.classList.remove('active'));
    el.classList.add('active');
}
