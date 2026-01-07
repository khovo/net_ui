const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529"; // Your ID

let user = { id: "0", first_name: "Guest", photo_url: "" };
let adCounter = 0;

document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        if (tg.initDataUnsafe?.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url;
        } else {
            user.id = ADMIN_ID; user.first_name = "Admin (Test)";
        }
    }
    if (user.id === ADMIN_ID) document.getElementById('admin-icon').classList.remove('hidden');
    initData();
});

async function initData() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ first_name: user.first_name, photo_url: user.photo_url })
        });
        
        if(res.status === 503 && user.id !== ADMIN_ID) {
            document.getElementById('maintenance_screen').classList.remove('hidden'); return;
        }
        if(res.status === 403) {
            document.getElementById('banned_screen').classList.remove('hidden'); return;
        }

        const data = await res.json();
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('userid').innerText = user.id;
        document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${user.id}`;
        
        // Stats
        document.getElementById('stat-ads').innerText = data.today_ads || 0;
        document.getElementById('stat-refs').innerText = data.total_ref || 0;
        document.getElementById('stat-earn').innerText = (data.total_income || 0).toFixed(2);
        document.getElementById('ads-left').innerText = 50 - (data.today_ads || 0);

        checkRequirements(data);
        if(data.photo_url) document.getElementById('avatar').src = data.photo_url;

        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        loadTasks();

    } catch (e) { alert("Network Error"); }
}

// ADS
function watchAd() {
    const btn = document.getElementById('ad-btn-text');
    if(typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => handleAd(btn)).catch(() => {
            if(confirm("Simulate Ad?")) handleAd(btn);
        });
    } else {
        if(confirm("Simulate Ad?")) handleAd(btn);
    }
}

function handleAd(btn) {
    adCounter++;
    if(adCounter < 3) {
        alert(`✅ Ad ${adCounter}/3 Done. Watch more!`);
        btn.innerText = `${adCounter}/3`;
    } else {
        sendReward(0.50);
        adCounter = 0;
        btn.innerText = "GO";
    }
}

async function sendReward(amt) {
    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user.id, amount: amt })
    });
    alert("Balance Added!");
    initData();
}

// TASKS
async function loadTasks() {
    const res = await fetch(`${BACKEND_URL}/api/tasks`);
    const tasks = await res.json();
    const box = document.getElementById('tasks-container');
    
    if(tasks.length === 0) box.innerHTML = "<p style='text-align:center; color:#666'>No tasks</p>";
    else {
        box.innerHTML = tasks.map(t => `
            <div class="menu-item">
                <div class="icon invite"><i class="fas fa-check"></i></div>
                <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                <button class="btn-go" onclick="doTask('${t.link}', ${t.reward})">DO</button>
                ${user.id === ADMIN_ID ? `<i class="fas fa-trash" style="color:red; margin-left:10px" onclick="delTask(${t.id})"></i>` : ''}
            </div>
        `).join('');
    }
}

function doTask(link, reward) {
    window.open(link, '_blank');
    setTimeout(() => { if(confirm("Done?")) sendReward(reward); }, 5000);
}

// ADMIN ACTIONS
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: user.id, action: 'add_task', task: {title, link, reward: parseFloat(reward)} })
    });
    alert("Task Added!");
    loadTasks();
}

async function delTask(tid) {
    if(!confirm("Delete?")) return;
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: user.id, action: 'delete_task', task_id: tid })
    });
    alert("Deleted!");
    loadTasks();
}

async function banUser(status) {
    const uid = document.getElementById('adm-uid').value;
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: user.id, action: 'ban_user', target_id: uid, status: status })
    });
    alert("User Status Updated!");
}

async function toggleMaintenance(status) {
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ admin_id: user.id, action: 'toggle_maintenance', status: status })
    });
    alert(`Maintenance: ${status}`);
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-send-amt').value;
    await sendRewardToUser(uid, parseFloat(amt));
}

// UTILS
function switchTab(id) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
}

function showAdminSection(sec) {
    document.querySelectorAll('.admin-section').forEach(s => s.classList.add('hidden'));
    document.getElementById(`adm-sec-${sec}`).classList.remove('hidden');
}

function checkRequirements(data) {
    const ok1 = (data.total_ref || 0) >= 5;
    const ok2 = (data.ads_watched_total || 0) >= 30;
    const ok3 = (data.balance || 0) >= 50;
    
    if(ok1) document.getElementById('req-invite').classList.add('done');
    if(ok2) document.getElementById('req-ads').classList.add('done');
    if(ok3) document.getElementById('req-bal').classList.add('done');
    
    if(ok1 && ok2 && ok3) {
        document.getElementById('btn-withdraw').classList.remove('disabled');
    }
}

function copyRef() {
    document.getElementById('ref-link').select();
    document.execCommand('copy');
    alert("Copied!");
}
function openUrl(url) { window.open(url, '_blank'); }
function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p=>p.classList.remove('active'));
    el.classList.add('active');
}
