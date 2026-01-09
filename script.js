// --- CONFIG ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";
const ADSGRAM_BLOCK_ID = "20796"; 

let currentUser = null;
let currentMethod = 'Telebirr';
let AdController = null; 

const tg = window.Telegram.WebApp;
tg.expand();

document.addEventListener('DOMContentLoaded', async () => {
    const user = tg.initDataUnsafe?.user || { id: "0", first_name: "Test User", photo_url: "" };
    
    // UI Setup
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-id').innerText = "ID: " + user.id;
    if (user.photo_url) document.getElementById('u-avatar').src = user.photo_url;
    
    if (String(user.id) === ADMIN_ID) {
        document.getElementById('nav-admin').classList.remove('hidden');
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    if (window.Adsgram) {
        AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    }

    await syncUser(user);

    setTimeout(() => {
        document.getElementById('startup-loader').style.opacity = '0';
        setTimeout(() => document.getElementById('startup-loader').classList.add('hidden'), 500);
    }, 1000);
});

async function syncUser(user) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name: user.first_name, photo_url: user.photo_url })
        });
        const data = await res.json();
        currentUser = data.user;
        updateUI();
    } catch (e) { console.error(e); }
}

function updateUI() {
    if (!currentUser) return;
    document.getElementById('bal-amount').innerText = currentUser.balance.toFixed(2);
    document.getElementById('stat-ads').innerText = currentUser.today_ads || 0;
    document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${currentUser.user_id}`;
}

// ==========================================
// 🔥 SIMPLE AD LOGIC (NO SLIDESHOW) 🔥
// ==========================================

function watchAd() {
    const btn = document.getElementById('btn-watch');
    btn.innerText = "Loading...";
    btn.disabled = true;

    if (!AdController) {
        // Fallback or Error
        tg.showAlert("Ad Controller not ready. Retrying...");
        btn.innerText = "WATCH";
        btn.disabled = false;
        // Try re-init if needed or simulate for testing
        // setTimeout(() => claimReward(), 2000); 
        return;
    }

    AdController.show().then((result) => {
        // User watched ad successfully
        claimReward();
    }).catch((result) => {
        // User skipped or error
        tg.showAlert("Ad skipped or failed.");
        btn.innerText = "WATCH";
        btn.disabled = false;
    });
}

async function claimReward() {
    try {
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser.user_id, amount: 0.50 })
        });
        const data = await res.json();
        
        if (data.status === "success") {
            currentUser.balance = data.new_balance;
            updateUI();
            tg.showAlert("Success! +0.50 ETB Added.");
        }
    } catch (e) {
        tg.showAlert("Server Error.");
    } finally {
        const btn = document.getElementById('btn-watch');
        btn.innerText = "WATCH";
        btn.disabled = false;
    }
}

// ==========================================
// 💸 WALLET & ADMIN
// ==========================================
function selectMethod(method) {
    currentMethod = method;
    document.querySelectorAll('.method-card').forEach(el => el.classList.remove('active'));
    if(method === 'Telebirr') document.getElementById('method-telebirr').classList.add('active');
    if(method === 'CBE') document.getElementById('method-cbe').classList.add('active');
}

async function requestWithdraw() {
    const amt = document.getElementById('wd-amt').value;
    const acc = document.getElementById('wd-acc').value;
    if (!acc || !amt) return tg.showAlert("Fill all fields");
    if (parseFloat(amt) < 50) return tg.showAlert("Min 50 ETB");

    try {
        const res = await fetch(`${BACKEND_URL}/api/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                user_id: currentUser.user_id, 
                amount: parseFloat(amt), 
                account: acc, 
                method: currentMethod 
            })
        });
        const data = await res.json();
        if(data.error) tg.showAlert(data.error);
        else {
            tg.showAlert("Withdrawal Requested!");
            currentUser.balance -= parseFloat(amt);
            updateUI();
        }
    } catch(e) { tg.showAlert("Network Error"); }
}

function copyRefLink() {
    const link = document.getElementById('ref-link');
    link.select();
    document.execCommand('copy');
    tg.showAlert("Copied!");
}

function switchTab(tabId, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    if (el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
    if (tabId === 'admin') fetchAdminData();
}

async function fetchAdminData() { tg.showAlert("Refreshed"); }
async function toggleMaintenance() { tg.showAlert("Toggled"); }
