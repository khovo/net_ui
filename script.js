// --- CONFIGURATION ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

let currentUser = null;
let currentMethod = 'Telebirr'; // Default
let storyStep = 1;
let storyTimer = null;
const STORY_DURATION = 5000; // 5 seconds per ad for demo

// Telegram Setup
const tg = window.Telegram.WebApp;
tg.expand();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. Simulate fetching Telegram User
    const user = tg.initDataUnsafe?.user || { id: "0", first_name: "Browser Test", photo_url: "" };
    
    // 2. Set UI immediately
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-id').innerText = "ID: " + user.id;
    if (user.photo_url) document.getElementById('u-avatar').src = user.photo_url;
    
    // Admin Check
    if (String(user.id) === ADMIN_ID) {
        document.getElementById('nav-admin').classList.remove('hidden');
    }

    // 3. Sync & Remove Loader
    await syncUser(user);
    
    // Hide startup loader after 1.5s delay for effect
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

    } catch (e) {
        console.error("Sync failed", e);
        // Even if fail, hide loader to show error UI if needed
        document.querySelector('.loading-text').innerText = "Connection Failed. Retry?";
    }
}

function updateUI() {
    if(!currentUser) return;
    document.getElementById('bal-amount').innerText = currentUser.balance.toFixed(2);
    document.getElementById('stat-ads').innerText = currentUser.today_ads || 0;
    
    // Referral UI
    document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${currentUser.user_id}`;
    document.getElementById('page-ref-count').innerText = "0"; // Add logic if backend returns this
    document.getElementById('page-ref-earn').innerText = "0.00";
}

// --- STORY MODE ADS ---
function openStoryMode() {
    storyStep = 1;
    document.getElementById('story-overlay').classList.remove('hidden');
    document.getElementById('btn-claim-reward').classList.add('hidden');
    
    // Reset Bars
    [1,2,3].forEach(i => {
        const bar = document.getElementById(`bar-${i}`);
        bar.style.transition = 'none';
        bar.style.width = '0%';
    });

    playStoryStep(1);
}

function playStoryStep(step) {
    storyStep = step;
    const status = document.getElementById('story-status');
    const timerEl = document.getElementById('story-timer');
    const bar = document.getElementById(`bar-${step}`);
    
    status.innerText = `Watching Ad ${step}...`;
    
    // Animate Bar
    // Force reflow
    void bar.offsetWidth;
    bar.style.transition = `width ${STORY_DURATION}ms linear`;
    bar.style.width = '100%';

    // Monetag Call (Simulated)
    if (typeof show_10378147 === 'function') {
        show_10378147().catch(e => console.log("Ad Blocked or Error"));
    }

    // Countdown
    let timeLeft = STORY_DURATION / 1000;
    timerEl.innerText = timeLeft;
    
    storyTimer = setInterval(() => {
        timeLeft--;
        timerEl.innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(storyTimer);
            if (storyStep < 3) {
                playStoryStep(storyStep + 1);
            } else {
                finishStory();
            }
        }
    }, 1000);
}

function finishStory() {
    document.getElementById('story-status').innerText = "All Ads Watched!";
    document.getElementById('story-timer').innerText = "DONE";
    document.getElementById('btn-claim-reward').classList.remove('hidden');
}

async function claimStoryReward() {
    try {
        const btn = document.getElementById('btn-claim-reward');
        btn.innerText = "Processing...";
        
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser.user_id, amount: 0.50 })
        });
        const data = await res.json();
        
        if (data.status === "success") {
            currentUser.balance = data.new_balance;
            updateUI();
            tg.showAlert("You earned 0.50 ETB!");
            closeStoryMode();
        }
    } catch (e) {
        tg.showAlert("Error claiming reward.");
    }
}

function closeStoryMode() {
    clearInterval(storyTimer);
    document.getElementById('story-overlay').classList.add('hidden');
}

// --- WALLET LOGIC ---
function selectMethod(method) {
    currentMethod = method;
    
    // UI Update
    document.querySelectorAll('.method-card').forEach(el => el.classList.remove('active'));
    if(method === 'Telebirr') document.getElementById('method-telebirr').classList.add('active');
    if(method === 'CBE') document.getElementById('method-cbe').classList.add('active');
}

async function requestWithdraw() {
    const amt = document.getElementById('wd-amt').value;
    const acc = document.getElementById('wd-acc').value;

    if (!acc || !amt) return tg.showAlert("Please fill all fields");
    if (parseFloat(amt) < 50) return tg.showAlert("Minimum is 50 ETB");

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
            tg.showAlert(`Request Sent for ${amt} ETB via ${currentMethod}`);
            currentUser.balance -= parseFloat(amt);
            updateUI();
        }
    } catch(e) { tg.showAlert("Network Error"); }
}

// --- REFERRAL LOGIC ---
function copyRefLink() {
    const link = document.getElementById('ref-link');
    link.select();
    document.execCommand('copy');
    tg.showAlert("Link Copied!");
}

// --- UTILS ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    if (el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
}

// Basic Admin (Fetch only)
async function fetchAdminData() {
    // ... Existing logic from previous snippet ...
    // Placeholder to prevent errors if clicked
    document.getElementById('adm-withdrawals').innerText = "Data refreshed.";
}
