// 🔥 BACKEND URL (መጨረሻ ላይ "/" የለውም) 🔥
const BACKEND_URL = "https://net-end.vercel.app";

let user = { id: 0, first_name: "Guest" };

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // Telegram Init
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id;
            user.first_name = tg.initDataUnsafe.user.first_name;
        } else {
            // Testing
            user.id = 8519835529; 
            user.first_name = "Admin (Test)";
        }
    }

    // Load Data
    initData();
});

async function initData() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`);
        const data = await response.json();

        // UI Updates
        document.getElementById('username').innerText = data.first_name || user.first_name;
        document.getElementById('userid').innerText = user.id;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        
        // Stats
        document.getElementById('stat-ads').innerText = data.today_ads || 0;
        document.getElementById('stat-refs').innerText = data.total_ref || 0;
        document.getElementById('stat-income').innerText = (data.total_income || 0).toFixed(2);
        document.getElementById('ads-left').innerText = 50 - (data.today_ads || 0);

        // Invite & Req
        document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${user.id}`;
        document.getElementById('page-invite-count').innerText = data.total_ref || 0;
        document.getElementById('page-invite-earn').innerText = ((data.total_ref || 0) * 1.00).toFixed(2) + " ETB";

        checkRequirements(data);
        renderLeaderboard(); // You can implement a real endpoint for this later

        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        document.getElementById('loader').innerHTML = "<p style='color:red'>Server Error</p>";
    }
}

// --- ADS ---
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
            // Refresh stats
            initData();
        }
    } catch (e) { alert("Network Error"); }
}

// --- REQUIREMENTS ---
function checkRequirements(data) {
    const r1 = document.getElementById('req-invite');
    const r2 = document.getElementById('req-ads');
    const r3 = document.getElementById('req-bal');
    const btn = document.getElementById('btn-withdraw');
    
    // Safely handle missing data
    const refs = data.total_ref || 0;
    const ads = data.ads_watched_total || 0;
    const bal = data.balance || 0;

    let ok1 = refs >= 5;
    let ok2 = ads >= 30;
    let ok3 = bal >= 50;

    if(ok1) { r1.classList.add('done'); r1.querySelector('i').className="fas fa-check-circle"; }
    if(ok2) { r2.classList.add('done'); r2.querySelector('i').className="fas fa-check-circle"; }
    if(ok3) { r3.classList.add('done'); r3.querySelector('i').className="fas fa-check-circle"; }

    if(ok1 && ok2 && ok3) {
        btn.classList.remove('disabled');
        btn.innerText = "Request Withdrawal";
    }
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

function copyRef() {
    const el = document.getElementById('ref-link');
    el.select(); document.execCommand('copy');
    alert("Copied!");
}

function selectMethod(el) {
    document.querySelectorAll('.pay-option').forEach(p => p.classList.remove('active'));
    el.classList.add('active');
}

function renderLeaderboard() {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = `
        <div class="lb-item"><span class="lb-rank">#1</span><span>Admin</span><span style="color:#f1c40f">500.00 ETB</span></div>
        <div class="lb-item"><span class="lb-rank">#2</span><span>User_X</span><span style="color:#f1c40f">320.00 ETB</span></div>
    `;
}

function redeemPromo() { alert("Invalid Code"); }
function requestWithdraw() { 
    if(document.getElementById('btn-withdraw').classList.contains('disabled')) return alert("Requirements not met!");
    alert("Request Sent!"); 
}
window.adminAddMoney = async () => { alert("Use Backend Console"); };
