const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529"; // ⚠️ ያንተን ID እዚህ ጋር አስተካክል

let user = { id: 0, first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url; // 🔥 ፎቶውን እዚህ ጋር እንቀበላለን
        } else {
            // Test
            user.id = ADMIN_ID; 
            user.first_name = "Admin (Test)";
        }
    }
    
    // Admin Check
    if (user.id === ADMIN_ID) {
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    initData();
    loadTasks();
});

async function initData() {
    try {
        // User Info እና Photo ወደ Backend መላክ (Update)
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });
        
        const data = await response.json();
        
        // UI Update
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('userid').innerText = user.id;
        
        if(data.photo_url) {
            document.getElementById('avatar').src = data.photo_url;
        }

        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        alert("Connection Failed");
    }
}

// --- ADS ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-action');
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
        }
    } catch(e) { alert("Network Error"); }
}

// --- ADMIN FUNCTIONS ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    
    if(!title || !link) return alert("Fill all fields");
    
    await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, link, reward: parseFloat(reward) })
    });
    alert("Task Added!");
    loadTasks(); // Refresh list
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    
    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, amount: parseFloat(amt) })
    });
    alert("Money Sent!");
}

async function loadWithdrawals() {
    const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`);
    const data = await res.json();
    const box = document.getElementById('admin-withdrawals');
    
    if(data.length === 0) {
        box.innerHTML = "<p>No requests</p>";
    } else {
        box.innerHTML = data.map(w => 
            `<div style="background:#111; padding:10px; margin:5px; border-radius:5px;">
                ID: ${w.user_id} <br> Amt: ${w.amount} ETB <br> ${w.method} - ${w.account}
            </div>`
        ).join('');
    }
}

// --- TASKS ---
async function loadTasks() {
    const res = await fetch(`${BACKEND_URL}/api/tasks`);
    const tasks = await res.json();
    const container = document.getElementById('tasks-container');
    
    if(tasks.length === 0) container.innerHTML = "<p style='text-align:center; color:#666'>No tasks available</p>";
    else {
        container.innerHTML = tasks.map(t => `
            <div class="menu-item" onclick="openUrl('${t.link}')">
                <div class="icon invite"><i class="fas fa-check"></i></div>
                <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                <button class="btn-action">DO</button>
            </div>
        `).join('');
    }
}

// Utils
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
}

function openUrl(url) {
    if(window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
}
