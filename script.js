const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

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
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ first_name: user.first_name, photo_url: user.photo_url })
        });
        
        // 🔥 STATUS CHECK 🔥
        if (res.status === 503 && user.id !== ADMIN_ID) {
            document.getElementById('maintenance_screen').classList.remove('hidden');
            document.getElementById('loader').style.display = 'none';
            return;
        }
        if (res.status === 403) {
            document.getElementById('banned_screen').classList.remove('hidden');
            document.getElementById('loader').style.display = 'none';
            return;
        }

        const data = await res.json();
        updateUI(data);
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        loadTasks();

    } catch (e) { console.error(e); }
}

function updateUI(data) {
    document.getElementById('username').innerText = data.first_name;
    document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
    document.getElementById('userid').innerText = user.id;
    if(data.photo_url) document.getElementById('avatar').src = data.photo_url;
    
    document.getElementById('stat-ads').innerText = data.today_ads || 0;
    document.getElementById('stat-refs').innerText = data.total_ref || 0;
    document.getElementById('stat-earn').innerText = (data.total_income || 0).toFixed(2);
    document.getElementById('ads-left').innerText = 50 - (data.today_ads || 0);

    document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${user.id}`;
    document.getElementById('page-invite-count').innerText = data.total_ref || 0;
    document.getElementById('page-invite-earn').innerText = ((data.total_ref || 0) * 1.00).toFixed(2) + " ETB";
    checkRequirements(data);
}

// --- ADS ---
function watchAd() {
    const btn = document.querySelector('.btn-go'); // In Home Tab
    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            adCounter++;
            if(adCounter < 3) { alert(`Ad ${adCounter}/3 Done.`); btn.innerText = `${adCounter}/3`; }
            else { sendReward(0.50); adCounter=0; btn.innerText="GO"; }
        }).catch(() => {
            if(confirm("Ad Error. Simulate?")) simulateAd();
        });
    } else {
        if(confirm("Script Loading... Simulate?")) simulateAd();
    }
}
function simulateAd() {
    adCounter++;
    if(adCounter < 3) alert(`Ad ${adCounter}/3 (Simulated)`);
    else { sendReward(0.50); adCounter=0; }
}

async function sendReward(amt) {
    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount: amt })
    });
    alert(`🎉 +${amt} ETB Added!`);
    initData();
}

// --- ADMIN FUNCTIONS ---
async function toggleMaintenance() {
    const status = confirm("Enable Maintenance Mode? Users won't access the app.");
    await postAdminAction("maintenance", { status });
    alert(`Maintenance: ${status}`);
}

async function banUser(status) {
    const uid = document.getElementById('ban-uid').value;
    if(!uid) return alert("Enter User ID");
    await postAdminAction("ban_user", { target_id: uid, status });
    alert(`User ${uid} Banned: ${status}`);
}

async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    if(!title || !link) return alert("Fill fields");
    
    await postAdminAction("add_task", { task: { title, link, reward: parseFloat(reward) } });
    alert("Task Added!");
    loadTasks();
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    if(!uid || !amt) return;
    await postAdminAction("send_money", { target_id: uid, amount: parseFloat(amt) });
    alert("Sent!");
}

async function postAdminAction(action, extraData) {
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, action, ...extraData })
    });
}

async function loadWithdrawals() {
    const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`);
    const list = await res.json();
    const box = document.getElementById('admin-withdrawals');
    if(list.length === 0) box.innerHTML = "No requests";
    else box.innerHTML = list.map(w => `<div style="background:#222; padding:5px; margin:5px; font-size:11px;">${w.amount} ETB - ${w.user_id}</div>`).join('');
}

// --- TASKS ---
async function loadTasks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const tasks = await res.json();
        const box = document.getElementById('tasks-container');
        if(tasks.length === 0) box.innerHTML = "<p style='text-align:center'>No tasks</p>";
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
    } catch(e) {}
}

async function delTask(tid) {
    if(confirm("Delete?")) {
        await postAdminAction("delete_task", { task_id: tid });
        loadTasks();
    }
}

function doTask(link, reward) {
    openUrl(link);
    setTimeout(() => { if(confirm("Task Done?")) sendReward(reward); }, 5000);
}

// Utils
function switchTab(id, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
}
function openUrl(url) { 
    if(window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
}
function copyRef() {
    navigator.clipboard.writeText(document.getElementById('ref-link').value);
    alert("Copied!");
}
function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}
function checkRequirements(data) {
    const ok1 = (data.total_ref || 0) >= 5;
    const ok2 = (data.ads_watched_total || 0) >= 30;
    const ok3 = (data.balance || 0) >= 50;
    if(ok1) document.getElementById('req-invite').classList.add('done');
    if(ok2) document.getElementById('req-ads').classList.add('done');
    if(ok3) document.getElementById('req-bal').classList.add('done');
    if(ok1 && ok2 && ok3) document.getElementById('btn-withdraw').classList.remove('disabled');
}
function requestWithdraw() {
    if(document.getElementById('btn-withdraw').classList.contains('disabled')) return alert("Req not met");
    const amt = document.getElementById('wd-amount').value;
    fetch(`${BACKEND_URL}/api/withdraw`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id: user.id, amount: amt })
    }).then(() => { alert("Sent!"); initData(); });
}
