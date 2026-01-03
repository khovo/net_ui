// 🔥 ትክክለኛው BACKEND URL (Slash / መጨረሻ ላይ የለውም) 🔥
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529"; // ያንተ ID

let user = { id: "0", first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram User ማግኘት
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

    // 2. Admin ምልክት ማሳየት
    if (user.id === ADMIN_ID) {
        const admIcon = document.getElementById('admin-icon');
        if(admIcon) admIcon.classList.remove('hidden');
    }

    // 3. ዳታውን ከ Backend መጥራት
    initData();
    loadTasks();
});

async function initData() {
    try {
        console.log(`Fetching from: ${BACKEND_URL}/api/user/${user.id}`);
        
        // Timeout Protection (ከ 8 ሰከንድ በላይ ከፈጀ Error ይበል)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`Server Error: ${response.status}`);
        }

        const data = await response.json();
        
        // UI Update
        safeText('username', data.first_name || user.first_name);
        safeText('balance', (data.balance || 0).toFixed(2));
        safeText('userid', user.id);
        
        if(data.photo_url) {
            const av = document.getElementById('avatar');
            if(av) av.src = data.photo_url;
        }

        // Stats Update (ከሌለ በ 0 ሙላ)
        safeText('stat-ads', data.today_ads || 0);
        safeText('stat-refs', data.total_ref || 0);
        safeText('stat-income', (data.total_income || 0).toFixed(2));
        safeText('ads-left', 50 - (data.today_ads || 0));

        // Invite Link
        const refLink = document.getElementById('ref-link');
        if(refLink) refLink.value = `https://t.me/RiyalNetBot?start=${user.id}`;

        // Invite Page Stats
        safeText('page-invite-count', data.total_ref || 0);
        safeText('page-invite-earn', ((data.total_ref || 0) * 1.00).toFixed(2) + " ETB");

        checkRequirements(data);

        // Hide Loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        // ትክክለኛውን ችግር ለአንተ ለማሳየት
        alert(`Connection Failed: ${e.message}\nCheck if Backend is deployed correctly.`);
        document.getElementById('loader').innerHTML = `<p style='color:red'>Server Error<br>${e.message}</p>`;
    }
}

// Helper to avoid null errors
function safeText(id, text) {
    const el = document.getElementById(id);
    if(el) el.innerText = text;
}

// --- ADS LOGIC ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-go');
    if(btn) btn.innerText = "...";

    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            sendReward(0.50);
            if(btn) btn.innerText = "GO";
        }).catch(() => {
            if(confirm("Ad failed. Simulate?")) sendReward(0.50);
            if(btn) btn.innerText = "GO";
        });
    } else {
        if(confirm("Script Loading... Simulate?")) sendReward(0.50);
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
            safeText('balance', data.new_balance.toFixed(2));
            alert(`🎉 +${amount} ETB Added!`);
            initData(); // Refresh Stats
        }
    } catch(e) { alert("Network Error: " + e.message); }
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
            admin_id: user.id, // Security Check
            action: "add_task",
            task: { title, link, reward }
        })
    });
    alert("Task Added!");
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            admin_id: user.id, // Security Check
            action: "send_money",
            target_id: uid,
            amount: parseFloat(amt)
        })
    });
    alert("Sent!");
}
// --- TASKS LIST ---
async function loadTasks() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/tasks`);
        const tasks = await res.json();
        const container = document.getElementById('tasks-container');
        
        if(!container) return; // if tab not rendered

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
    }).catch(e => alert("Error: " + e));
}
