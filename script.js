// --- CONFIGURATION ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

let currentUser = null;
let currentMethod = 'Telebirr'; 
const AD_DURATION = 15000; // 15 Seconds per Ad (ለ Monetag ጊዜ መስጠት አለብን)

// Telegram Setup
const tg = window.Telegram.WebApp;
tg.expand();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    const user = tg.initDataUnsafe?.user || { id: "0", first_name: "Test User", photo_url: "" };
    
    // Set UI
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-id').innerText = "ID: " + user.id;
    if (user.photo_url) document.getElementById('u-avatar').src = user.photo_url;
    
    if (String(user.id) === ADMIN_ID) {
        document.getElementById('nav-admin').classList.remove('hidden');
        document.getElementById('admin-icon').classList.remove('hidden');
    }

    // Sync
    await syncUser(user);

    // Hide Startup Loader
    setTimeout(() => {
        document.getElementById('startup-loader').style.opacity = '0';
        setTimeout(() => document.getElementById('startup-loader').classList.add('hidden'), 500);
    }, 1500);
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
// 🔥 MONETAG SLIDESHOW LOGIC (SIMULATION) 🔥
// ==========================================

async function startStorySequence() {
    // 1. Show Overlay
    document.getElementById('story-overlay').classList.remove('hidden');

    // 2. Reset Bars
    [1, 2, 3].forEach(i => {
        const bar = document.getElementById(`seg-${i}`);
        bar.classList.remove('filled');
        bar.style.transition = 'none'; 
        bar.style.width = '0%';
    });

    try {
        // --- STEP 1 ---
        updateStoryStatus("Opening Ad 1... (Wait 15s)");
        animateBar(1); // Start Bar Animation
        showMonetagAd(); // Show Ad
        await wait(AD_DURATION); // Wait 15s
        
        // --- STEP 2 ---
        updateStoryStatus("Opening Ad 2... (Wait 15s)");
        animateBar(2);
        showMonetagAd();
        await wait(AD_DURATION);

        // --- STEP 3 ---
        updateStoryStatus("Opening Ad 3... (Wait 15s)");
        animateBar(3);
        showMonetagAd();
        await wait(AD_DURATION);

        // --- FINISH ---
        updateStoryStatus("Completed! Adding Reward...");
        await claimReward();

    } catch (error) {
        tg.showAlert("Ad sequence failed.");
        closeStoryOverlay();
    }
}

// Helper: Animate the progress bar smoothly
function animateBar(num) {
    const bar = document.getElementById(`seg-${num}`);
    // Force Reflow
    void bar.offsetWidth;
    bar.style.transition = `width ${AD_DURATION}ms linear`;
    bar.style.width = '100%';
}

// Helper: Trigger Monetag
function showMonetagAd() {
    if (typeof show_10378147 === 'function') {
        show_10378147().catch(e => console.log("Ad Error"));
    } else {
        console.log("Monetag SDK missing or Blocked.");
    }
}

// Helper: Wait function
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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

async function fetchAdminData() { tg.showAlert("Data Refreshed"); }
async function toggleMaintenance() { tg.showAlert("Maintenance Toggled"); }
async function banUser() { tg.showAlert("User Banned"); }
