const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

let user = { id: "0", first_name: "Guest", photo_url: "" };
let adCounter = 0; // 3 ads tracking

document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram && window.Telegram.WebApp) {
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
        
        // Handle Maintenance or Ban
        if (res.status === 503) {
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
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('userid').innerText = user.id;
        if(data.photo_url) document.getElementById('avatar').src = data.photo_url;

        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        loadTasks();

    } catch (e) {
        alert("Connection Failed");
    }
}

// --- 🔥 3-STEP ADS LOGIC 🔥 ---
function watchAd() {
    const btnText = document.getElementById('ad-btn-text');
    
    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            adCounter++;
            handleAdProgress(btnText);
        }).catch(() => {
            // Fallback Simulation (for testing/errors)
            if(confirm("Ad failed. Simulate?")) {
                adCounter++;
                handleAdProgress(btnText);
            }
        });
    } else {
        // Script not loaded fallback
        if(confirm("Script Loading... Simulate?")) {
            setTimeout(() => {
                adCounter++;
                handleAdProgress(btnText);
            }, 1500);
        }
    }
}

function handleAdProgress(btn) {
    if (adCounter < 3) {
        alert(`✅ Ad ${adCounter}/3 Completed!\nWatch ${3 - adCounter} more to get reward.`);
        btn.innerText = `${adCounter}/3`;
        // Auto-play next logic can be added here, but manual click is safer
    } else {
        // Finished 3 Ads
        sendReward(0.50);
        adCounter = 0;
        btn.innerText = "GO";
    }
}

async function sendReward(amount) {
    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, amount: amount })
    });
    alert(`🎉 +${amount} ETB Added!`);
    initData(); // Refresh UI
}

// --- ADMIN FUNCTIONS ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            admin_id: user.id, action: "add_task", 
            task: { title, link, reward: parseFloat(reward) } 
        })
    });
    alert("Task Added!");
    loadTasks();
}

async function deleteTask(taskId) {
    if(!confirm("Delete Task?")) return;
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, action: "delete_task", task_id: taskId })
    });
    alert("Deleted!");
    loadTasks();
}

async function toggleMaintenance() {
    const status = confirm("Enable Maintenance Mode? (Users will be blocked)");
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, action: "toggle_maintenance", status: status })
    });
    alert(`Maintenance: ${status}`);
}

async function banUser() {
    const uid = document.getElementById('ban-uid').value;
    const status = confirm("Ban this user? (Cancel to Unban)");
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, action: "ban_user", target_id: uid, status: status })
    });
    alert("User Status Updated");
}

// --- TASKS ---
async function loadTasks() {
    const res = await fetch(`${BACKEND_URL}/api/tasks`);
    const tasks = await res.json();
    const container = document.getElementById('tasks-container');
    
    if(tasks.length === 0) container.innerHTML = "<p>No tasks</p>";
    else {
        container.innerHTML = tasks.map(t => `
            <div class="menu-item">
                <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                <button class="btn-go" onclick="openUrl('${t.link}')">DO</button>
                ${user.id === ADMIN_ID ? `<i class="fas fa-trash" style="color:red; margin-left:10px;" onclick="deleteTask(${t.id})"></i>` : ''}
            </div>
        `).join('');
    }
}

// Utils
function switchTab(id, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
}
function openUrl(url) { window.open(url, '_blank'); }
function copyRef() { /* Copy logic same as before */ }
