// --- CONFIG ---
const ADMIN_ID = 8519835529; // ያንተ ID
const BOT_LINK = "https://t.me/RiyalNetBot"; 

// LINKS
const LINKS = {
    payment: "https://t.me/yourpaymentproofchannel",
    news: "https://t.me/eliteledger",
    support: "https://t.me/imranun"
};

let user = { 
    id: 0, firstName: 'Guest', balance: 0.00, 
    todayAds: 0, totalRef: 0, totalIncome: 0.00, 
    adsWatchedTotal: 0, photoUrl: ''
};
let globalTasks = [];
let adSequence = 0;

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Fast Loading
    let w = 0; const bar = document.getElementById('progress');
    const int = setInterval(() => { w+=10; if(bar) bar.style.width=w+'%'; if(w>=100) clearInterval(int); }, 50);
    setTimeout(() => { 
        document.getElementById('loading-screen').style.display='none'; 
        document.getElementById('app-container').classList.remove('hidden'); 
    }, 1500);

    // Telegram Setup
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        const u = window.Telegram.WebApp.initDataUnsafe?.user;
        if(u) {
            user.id = u.id;
            user.firstName = u.first_name;
            user.photoUrl = u.photo_url;
        } else {
            // Test Mode
            user.id = ADMIN_ID; 
            user.firstName = "Admin";
        }
    } else {
        user.id = ADMIN_ID; user.firstName = "Admin";
    }

    if(user.id == ADMIN_ID) {
        document.getElementById('admin-btn').classList.remove('hidden');
        loadAdminStats(); // Load Admin Data
    }

    loadData();
    renderLeaderboard();
});

// --- LOCAL DATA HANDLING (Simple & Fast) ---
function loadData() {
    const saved = localStorage.getItem(`u_${user.id}`);
    if (saved) {
        const parsed = JSON.parse(saved);
        user = { ...parsed, id: user.id, firstName: user.firstName, photoUrl: user.photoUrl || parsed.photoUrl };
    }
    
    // Load Tasks
    const tasks = localStorage.getItem('g_tasks');
    if(tasks) globalTasks = JSON.parse(tasks);

    updateUI();
    renderTasks();
}

function saveData() {
    localStorage.setItem(`u_${user.id}`, JSON.stringify(user));
    localStorage.setItem('g_tasks', JSON.stringify(globalTasks));
    updateUI();
}

function updateUI() {
    safeSet('username', user.firstName);
    safeSet('user-id', user.id);
    safeSet('display-balance', user.balance.toFixed(2));
    
    if(user.photoUrl) document.getElementById('user-avatar').src = user.photoUrl;

    // Stats
    safeSet('stat-today-ads', user.todayAds);
    safeSet('stat-total-ref', user.totalRef);
    safeSet('stat-total-income', user.totalIncome.toFixed(2));
    safeSet('ads-left', 50 - user.todayAds);
    
    safeSet('req-invite-count', user.totalRef);
    safeSet('req-ads-count', user.adsWatchedTotal);
    safeSet('page-invite-count', user.totalRef);
    safeSet('page-invite-earn', (user.totalRef * 1.00).toFixed(2));

    checkRequirements();
}

function safeSet(id, txt) {
    const el = document.getElementById(id);
    if(el) el.innerText = txt;
}

// --- ADS LOGIC (3-Step) ---
window.watchAd = function() {
    if(user.todayAds >= 50) return alert("Daily limit reached!");

    const btn = document.querySelector('.icon-box.ads');
    
    // Check Monetag
    if (typeof window.show_10378147 === 'function') {
        if(btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        window.show_10378147().then(() => {
            handleAdSuccess();
            if(btn) btn.innerHTML = '<i class="fas fa-play"></i>';
        }).catch(() => {
            // Fallback
            if(confirm("Ad failed. Simulate?")) { handleAdSuccess(); if(btn) btn.innerHTML = '<i class="fas fa-play"></i>'; }
        });
    } else {
        // Fallback
        if(confirm("Ad Script Not Loaded. Simulate View?")) {
            handleAdSuccess();
        }
    }
};

function handleAdSuccess() {
    adSequence++;
    if(adSequence < 3) {
        alert(`✅ Ad ${adSequence}/3 Completed! Watch ${3-adSequence} more.`);
    } else {
        const reward = 0.50;
        user.balance += reward;
        user.totalIncome += reward;
        user.todayAds++;
        user.adsWatchedTotal++;
        adSequence = 0;
        saveData();
        alert(`🎉 +${reward} ETB Added!`);
    }
}

// --- LINKS ---
window.openLink = function(key) {
    const url = LINKS[key];
    if(!url) return alert("Link not set");
    if (window.Telegram?.WebApp?.openLink) window.Telegram.WebApp.openLink(url);
    else window.open(url, '_blank');
};

// --- WITHDRAWAL SYSTEM ---
window.processWithdraw = function() {
    if(document.getElementById('btn-withdraw').classList.contains('disabled')) return alert("Requirements Not Met!");
    
    const amt = parseFloat(document.getElementById('withdraw-amount').value);
    const acc = document.getElementById('withdraw-account').value;
    
    if(!acc) return alert("Enter Account Number");
    if(amt < 50) return alert("Minimum 50 ETB");
    if(amt > user.balance) return alert("Insufficient Balance");

    // Deduct Balance
    user.balance -= amt;
    saveData();

    // Save Request to Local Storage (Simulating DB)
    let requests = JSON.parse(localStorage.getItem('admin_withdrawals') || "[]");
    requests.push({
        id: Date.now(),
        user_id: user.id,
        amount: amt,
        account: acc,
        method: document.querySelector('.pay-option.active').innerText,
        status: "Pending"
    });
    localStorage.setItem('admin_withdrawals', JSON.stringify(requests));

    alert("Withdrawal Request Sent! Check History.");
    if(user.id == ADMIN_ID) loadAdminStats(); // Refresh Admin Panel
};

// --- ADMIN PANEL (UPDATED) ---
function loadAdminStats() {
    // 1. User Stats (Simulation)
    document.getElementById('adm-total-users').innerText = "1,240"; // Fake for now
    document.getElementById('adm-total-payout').innerText = "4,500 ETB";

    // 2. Withdrawal Requests
    const requests = JSON.parse(localStorage.getItem('admin_withdrawals') || "[]");
    const container = document.getElementById('admin-withdraw-list');
    
    if(requests.length === 0) {
        container.innerHTML = "<p style='color:#666; font-size:12px;'>No pending requests</p>";
    } else {
        container.innerHTML = requests.map(req => `
            <div style="background:#222; padding:10px; margin-bottom:5px; border-radius:5px; border:1px solid #333;">
                <div style="display:flex; justify-content:space-between; font-size:12px;">
                    <span>User: ${req.user_id}</span>
                    <span style="color:${req.status === 'Pending' ? '#f1c40f' : '#2ecc71'}">${req.status}</span>
                </div>
                <div style="font-weight:bold; margin:5px 0;">${req.amount} ETB via ${req.method}</div>
                <div style="font-size:11px; color:#888;">Acc: ${req.account}</div>
                ${req.status === 'Pending' ? `
                <div style="margin-top:5px; display:flex; gap:5px;">
                    <button onclick="approveWithdraw(${req.id})" style="background:#2ecc71; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; font-size:10px; font-weight:bold;">Approve</button>
                    <button onclick="rejectWithdraw(${req.id})" style="background:#e74c3c; border:none; padding:5px 10px; border-radius:3px; cursor:pointer; font-size:10px; font-weight:bold; color:white;">Reject</button>
                </div>` : ''}
            </div>
        `).join('');
    }
}

window.approveWithdraw = function(id) {
    let requests = JSON.parse(localStorage.getItem('admin_withdrawals') || "[]");
    const req = requests.find(r => r.id === id);
    if(req) {
        req.status = "Paid ✅";
        localStorage.setItem('admin_withdrawals', JSON.stringify(requests));
        loadAdminStats();
        alert("Marked as Paid!");
    }
};

window.rejectWithdraw = function(id) {
    let requests = JSON.parse(localStorage.getItem('admin_withdrawals') || "[]");
    requests = requests.filter(r => r.id !== id); // Remove
    localStorage.setItem('admin_withdrawals', JSON.stringify(requests));
    loadAdminStats();
    alert("Request Rejected & Removed");
};

// Admin Task Add
window.adminAddTask = function() {
    const t = document.getElementById('new-task-title').value;
    const l = document.getElementById('new-task-link').value;
    const r = parseFloat(document.getElementById('new-task-reward').value);
    
    if(t && l && r) {
        globalTasks.push({ id: Date.now(), title: t, link: l, reward: r });
        saveData();
        alert("Task Added!");
        renderTasks();
    }
};

// --- UTILS ---
window.switchPage = function(pid, el) {
    document.querySelectorAll('.page').forEach(p => p.classList.add('hidden-page'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));
    document.getElementById('page-'+pid).classList.remove('hidden-page');
    document.getElementById('page-'+pid).classList.add('active-page');
    if(el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
};

window.copyLink = function() { navigator.clipboard.writeText(`${BOT_LINK}?start=${user.id}`); alert("Copied!"); };
window.selectMethod = function(el) { document.querySelectorAll('.pay-option').forEach(p=>p.classList.remove('active')); el.classList.add('active'); };

function checkRequirements() {
    const btn = document.getElementById('btn-withdraw');
    // Logic: user.totalRef >= 5 && user.adsWatchedTotal >= 30 && user.balance >= 50
    // For testing, let's make it easier:
    if(user.balance >= 50) { 
        btn.classList.remove('disabled'); 
        btn.innerText = "Withdraw Now"; 
    }
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = `<div class="lb-item"><span class="lb-rank">#1</span><span>Admin</span><span style="color:#f1c40f">500.00 ETB</span></div><div class="lb-item"><span class="lb-rank">#2</span><span>You</span><span style="color:#f1c40f">${user.totalIncome.toFixed(2)} ETB</span></div>`;
}

function renderTasks() {
    const list = document.getElementById('task-list-container');
    list.innerHTML = globalTasks.map(t => `
        <div class="menu-item">
            <div class="menu-text"><h4>${t.title}</h4><p>+${t.reward} ETB</p></div>
            <button class="btn-go" onclick="window.openLinkExternal('${t.link}')">START</button>
        </div>
    `).join('');
}
window.openLinkExternal = (url) => window.open(url, '_blank');
