// --- CONFIG ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

// --- STATE ---
let currentUser = null;
let currentMethod = 'Telebirr';

// Telegram SDK
const tg = window.Telegram.WebApp;
tg.expand();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Get User
    const user = tg.initDataUnsafe?.user || { id: "0", first_name: "Browser Test", photo_url: "" };

    // 2. Set Header UI
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-id').innerText = "ID: " + user.id;
    if (user.photo_url) document.getElementById('u-avatar').src = user.photo_url;
    
    if (String(user.id) === ADMIN_ID) {
        document.getElementById('nav-admin').classList.remove('hidden');
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    // 3. Backend Sync
    await syncUser(user);

    // 4. Hide Loader
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
    } catch (e) {
        console.error("Sync Error:", e);
    }
}

function updateUI() {
    if (!currentUser) return;
    document.getElementById('bal-amount').innerText = currentUser.balance.toFixed(2);
    document.getElementById('stat-ads').innerText = currentUser.today_ads || 0;
    
    // Referral Link
    document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${currentUser.user_id}`;
}

// ==========================================
// 🔥 STORY MODE AD LOGIC (CHAIN REACTION) 🔥
// ==========================================

async function startStorySequence() {
    // 1. Show Overlay
    const overlay = document.getElementById('story-overlay');
    overlay.classList.remove('hidden');

    // 2. Reset Bars
    document.getElementById('seg-1').classList.remove('filled');
    document.getElementById('seg-2').classList.remove('filled');
    document.getElementById('seg-3').classList.remove('filled');

    // 3. Start Ad Chain
    try {
        // --- AD 1 ---
        updateStoryStatus("Loading Ad 1 of 3...");
        await playMonetagAd(); // Wait for Ad 1 to close
        document.getElementById('seg-1').classList.add('filled'); // Fill Bar 1

        // --- AD 2 ---
        updateStoryStatus("Loading Ad 2 of 3...");
        await playMonetagAd(); // Wait for Ad 2 to close
        document.getElementById('seg-2').classList.add('filled'); // Fill Bar 2

        // --- AD 3 ---
        updateStoryStatus("Loading Ad 3 of 3...");
        await playMonetagAd(); // Wait for Ad 3 to close
        document.getElementById('seg-3').classList.add('filled'); // Fill Bar 3

        // --- SUCCESS ---
        updateStoryStatus("All Done! Crediting...");
        await claimReward();

    } catch (error) {
        // User closed prematurely or error
        tg.showAlert("Ad sequence interrupted. No reward.");
        closeStoryOverlay();
    }
}

// Wrapper for Monetag SDK to make it awaitable
function playMonetagAd() {
    return new Promise((resolve, reject) => {
        if (typeof show_10378147 === 'function') {
            // SDK Exists: Call it
            show_10378147().then(() => {
                // Ad finished/closed successfully
                resolve();
            }).catch((e) => {
                // Ad failed to load or error
                console.error("Ad Error:", e);
                // We resolve anyway to let them continue OR reject to stop.
                // Usually better to resolve if it's just a 'no fill' to not block user,
                // BUT for 'Watch to Earn', we might want to be strict.
                // Let's resolve to be user-friendly for now (or use Simulation).
                resolve(); 
            });
        } else {
            // SDK Missing (AdBlock or Dev Mode): Simulate 3s delay
            console.log("Monetag SDK missing. Simulating...");
            setTimeout(resolve, 3000);
        }
    });
}

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
// 💸 WALLET & ADMIN LOGIC
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
}

// Admin Placeholders
async function fetchAdminData() { tg.showAlert("Refreshed"); }
async function toggleMaintenance() { tg.showAlert("Toggled"); }
async function banUser() { tg.showAlert("User Banned"); }
