// 🔥 BACKEND URL (መጨረሻ ላይ "/" መኖር የለበትም) 🔥
const BACKEND_URL = "https://net-end.vercel.app"; 
const ADMIN_ID = "8519835529"; 

let user = { id: "0", first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram Init
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url;
        } else {
            console.log("Testing Mode (Browser)");
            user.id = ADMIN_ID; 
            user.first_name = "Admin (Test)";
        }
    }

    // 2. Admin Icon
    if (user.id === ADMIN_ID) {
        const adminBtn = document.getElementById('admin-icon');
        if(adminBtn) adminBtn.classList.remove('hidden');
    }

    // 3. Start Data Load
    initData();
    loadTasks();
});

// --- DATA SYNC ENGINE ---
async function initData() {
    const loader = document.getElementById('loader');
    
    try {
        console.log(`📡 Connecting to: ${BACKEND_URL}/api/user/${user.id}`);
        
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });

        if (!response.ok) {
            throw new Error(`Server responded with ${response.status}`);
        }

        const data = await response.json();
        
        // UI Updates
        safeSetText('username', data.first_name || user.first_name);
        safeSetText('balance', (data.balance || 0).toFixed(2));
        safeSetText('userid', user.id);
        
        // Avatar
        if(data.photo_url) {
            const avatar = document.getElementById('avatar');
            if(avatar) avatar.src = data.photo_url;
        }

        // Stats
        safeSetText('stat-ads', data.today_ads || 0);
        safeSetText('stat-refs', data.total_ref || 0);
        safeSetText('stat-income', (data.total_income || 0).toFixed(2));
        safeSetText('ads-left', 50 - (data.today_ads || 0));

        // Invite Info
        const refLink = document.getElementById('ref-link');
        if(refLink) refLink.value = `https://t.me/RiyalNetBot?start=${user.id}`;
        
        safeSetText('page-invite-count', data.total_ref || 0);
        safeSetText('page-invite-earn', ((data.total_ref || 0) * 1.00).toFixed(2) + " ETB");

        checkRequirements(data);

        // Success
        loader.style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        loader.innerHTML = `
            <div style="color: #ff4757; text-align: center; padding: 20px;">
                <i class="fas fa-exclamation-triangle" style="font-size: 30px;"></i>
                <p>Connection Failed!</p>
                <small>${e.message}</small>
                <button onclick="location.reload()" style="margin-top:10px; padding:8px 15px; background:#fff; border:none; border-radius:5px;">Retry</button>
            </div>`;
    }
}

// Helper to safely set text
function safeSetText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// --- ADS LOGIC ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-go');
    if(btn) btn.innerText = "...";

    // Monetag Check
    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            sendReward(0.50);
            if(btn) btn.innerText = "GO";
        }).catch(() => {
            // Fallback for AdBlock users or Errors
            if(confirm("Ad failed to load (Network/Blocker). Simulate View?")) {
                sendReward(0.50);
            }
            if(btn) btn.innerText = "GO";
        });
    } else {
        // Fallback if script missing
        if(confirm("Ad Script Loading... Simulate View?")) {
            sendReward(0.50);
        }
        if(btn) btn.innerText = "GO";
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
            safeSetText('balance', data.new_balance.toFixed(2));
            alert(`🎉 +${amount} ETB Added!`);
            // Refresh stats in background
            initData(); 
        } else {
            alert("❌ Server Error: " + (data.error || "Unknown"));
        }
    } catch(e) {
        alert("🌐 Network Error. Please check connection.");
    }
}

// --- ADMIN FUNCTIONS ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    
    if(!title || !link) return alert("Fill all fields");
    
    try {
        await fetch(`${BACKEND_URL}/api/admin/action`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                admin_id: user.id,
                action: "add_task",
                task: { title, link, reward: parseFloat(reward) }
            })
        });
        alert("Task Added!");
        loadTasks();
    } catch(e) { alert("Failed: " + e.message); }
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    
    try {
        await fetch(`${BACKEND_URL}/api/admin/action`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                admin_id: user.id,
                action: "send_money",
                target_id: uid, 
                amount: parseFloat(amt) 
            })
        });
        alert("Money Sent!");
        initData();
    } catch(e) { alert("Failed: " + e.message); }
}

async function loadWithdrawals() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`);
        const list = await res.json();
        const box = document.getElementById('admin-withdrawals');
        
        if(list.length === 0) {
            box.innerHTML = "<p>No requests</p>";
        } else {
            box.innerHTML = list.map(w => 
                `<div style="background:#111; padding:10px; margin:5px; border-radius:5px; font-size:12px;">
                    <b>${w.amount} ETB</b> - ${w.user_id} <br> 
                    ${w.method}: ${w.account} <br> 
                    <span style="color:${w.status==='Pending'?'orange':'green'}">${w.status}</span>
                </div>`
            ).join('');
        }
    } catch(e) { console.log(e); }
}

// --- TASKS LIST ---
async function loadTasks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const tasks = await res.json();
        const container = document.getElementById('tasks-container');
        
        if(!container) return;

        if(tasks.length === 0) container.innerHTML = "<p style='text-align:center; color:#666'>No tasks available</p>";
        else {
            container.innerHTML = tasks.map(t => `
                <div class="menu-item">
                    <div class="icon invite"><i class="fas fa-check"></i></div>
                    <div class="text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
                    <button class="btn-go" onclick="doTask('${t.link}', ${t.reward})">DO</button>
                    ${user.id === ADMIN_ID ? `<i class="fas fa-trash" style="color:red; margin-left:10px;" onclick="deleteTask(${t.id})"></i>` : ''}
                </div>
            `).join('');
        }
    } catch(e) {}
}

function doTask(link, reward) {
    openUrl(link);
    setTimeout(() => {
        if(confirm("Did you finish the task?")) {
            sendReward(reward);
        }
    }, 5000);
}

// --- UTILS ---
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

function copyLink() {
    const el = document.getElementById('ref-link');
    if(el) {
        el.select();
        document.execCommand('copy');
        alert("Copied!");
    }
}

function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}

function checkRequirements(data) {
    const btn = document.getElementById('btn-withdraw');
    if(!btn) return;

    const ok1 = (data.total_ref || 0) >= 5;
    const ok2 = (data.ads_watched_total || 0) >= 30;
    const ok3 = (data.balance || 0) >= 50;

    if(ok1) document.getElementById('req-invite').classList.add('done');
    if(ok2) document.getElementById('req-ads').classList.add('done');
    if(ok3) document.getElementById('req-bal').classList.add('done');

    if(ok1 && ok2 && ok3) {
        btn.classList.remove('disabled');
        btn.innerText = "Request Withdrawal";
    }
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
            initData();
        }
    }).catch(e => alert("Error: " + e.message));
}
