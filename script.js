// --- CONFIG ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";
// 🔥 UPDATED BLOCK ID 🔥
const ADSGRAM_BLOCK_ID = "20796"; 

let currentUser = null;
let currentMethod = 'Telebirr';
let AdController = null; 

const tg = window.Telegram.WebApp;
tg.expand();

// --- INIT ---
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

    // Initialize Adsgram with YOUR ID
    if (window.Adsgram) {
        AdController = window.Adsgram.init({ blockId: ADSGRAM_BLOCK_ID });
    }

    // Backend Sync
    await syncUser(user);

    // Hide Loader
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
// 🔥 ADSGRAM STORY LOGIC (CHAINED) 🔥
// ==========================================

async function startAdsgramSequence() {
    // Show Overlay
    document.getElementById('story-overlay').classList.remove('hidden');

    // Reset Bars
    [1, 2, 3].forEach(i => {
        const bar = document.getElementById(`seg-${i}`);
        bar.classList.remove('filled');
    });

    try {
        // --- AD 1 ---
        updateStoryStatus("Loading Ad 1 of 3...");
        await showAd(); 
        document.getElementById('seg-1').classList.add('filled');
        await wait(1000);

        // --- AD 2 ---
        updateStoryStatus("Loading Ad 2 of 3...");
        await showAd();
        document.getElementById('seg-2').classList.add('filled');
        await wait(1000);

        // --- AD 3 ---
        updateStoryStatus("Loading Ad 3 of 3...");
        await showAd();
        document.getElementById('seg-3').classList.add('filled');

        // --- SUCCESS ---
        updateStoryStatus("Success! Crediting...");
        await claimReward();

    } catch (error) {
        tg.showAlert("Ad sequence stopped.");
        closeStoryOverlay();
    }
}

function showAd() {
    return new Promise((resolve, reject) => {
        if (!AdController) {
            // Fallback for testing
            console.log("Adsgram missing/blocked. Simulating...");
            setTimeout(resolve, 2000); 
            return;
        }

        AdController.show().then((result) => {
            // result.done = true means fully watched
            resolve();
        }).catch((result) => {
            // result.done = false or error
            console.error("Adsgram Error/Skip:", result);
            reject(result);
        });
    });
}

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function updateStoryStatus(text) {
    document.getElementById('story-status').innerText = text;
}

function closeStoryOverlay() {
    document.getElementById('story-overlay').classList.add('hidden');
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
        closeStoryOverlay();
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
