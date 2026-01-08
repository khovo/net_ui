// --- CONFIGURATION ---
const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

let currentUser = null;
let adStep = 0; // 0=Start, 1=Watched 1, 2=Watched 2, 3=Ready to Claim
let isTimerRunning = false;

// Telegram Setup
const tg = window.Telegram.WebApp;
tg.expand();

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', async () => {
    const user = tg.initDataUnsafe?.user || { id: "0", first_name: "Browser Test", photo_url: "" };
    
    // Set local data for immediate UI feedback
    document.getElementById('u-name').innerText = user.first_name;
    document.getElementById('u-id').innerText = "ID: " + user.id;
    if (user.photo_url) document.getElementById('u-avatar').src = user.photo_url;

    // Admin Check
    if (String(user.id) === ADMIN_ID) {
        document.getElementById('admin-icon').style.display = 'block';
        document.getElementById('nav-admin').style.display = 'flex';
    }

    // Sync with Backend
    await syncUser(user);
});

async function syncUser(user) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });

        if (res.status === 503) return showMaintenance();
        
        const data = await res.json();
        currentUser = data.user;
        
        // Update Balance
        document.getElementById('bal-amount').innerText = currentUser.balance.toFixed(2);
        document.getElementById('loader').classList.add('hidden');

        if (currentUser.banned) {
            document.body.innerHTML = "<h1 style='color:red; text-align:center; margin-top:50px;'>YOU ARE BANNED</h1>";
        }

    } catch (e) {
        console.error(e);
        alert("Connection Failed. Check Backend URL.");
        document.getElementById('loader').classList.add('hidden');
    }
}

// --- AD LOGIC (3-STEP SEQUENTIAL) ---
function handleAdLogic() {
    if (isTimerRunning) return;
    const btn = document.getElementById('btn-ad-action');
    const status = document.getElementById('ad-status');
    const progress = document.getElementById('ad-progress');

    // CLAIM REWARD
    if (adStep === 3) {
        claimReward();
        return;
    }

    // WATCH AD PROCESS
    // 1. Show Ad (Monetag simulation)
    if (typeof show_10378147 === 'function') {
        show_10378147().then(() => startTimer()).catch(() => startTimer()); // Fallback if ad fails
    } else {
        startTimer(); // Fallback if script missing
    }

    function startTimer() {
        isTimerRunning = true;
        btn.disabled = true;
        btn.innerText = "Watching... (10s)";
        
        let timeLeft = 10;
        const timer = setInterval(() => {
            timeLeft--;
            btn.innerText = `Wait ${timeLeft}s...`;
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                isTimerRunning = false;
                btn.disabled = false;
                advanceStep();
            }
        }, 1000);
    }
}

function advanceStep() {
    adStep++;
    const btn = document.getElementById('btn-ad-action');
    const status = document.getElementById('ad-status');
    const progress = document.getElementById('ad-progress');

    // Visual Updates
    document.getElementById(`step-${adStep}`).classList.add('done');
    progress.style.width = `${(adStep/3)*100}%`;

    if (adStep < 3) {
        btn.innerText = `Watch Next Ad (${adStep+1}/3)`;
        status.innerText = "Great! Watch the next one.";
    } else {
        btn.innerText = "CLAIM 0.50 ETB";
        btn.style.background = "var(--success)";
        status.innerText = "Cycle Complete! Claim your reward.";
    }
}

async function claimReward() {
    const btn = document.getElementById('btn-ad-action');
    btn.innerText = "Claiming...";
    
    try {
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser.user_id, amount: 0.50 })
        });
        
        const data = await res.json();
        
        if (data.status === "success") {
            // Update Balance UI
            document.getElementById('bal-amount').innerText = data.new_balance.toFixed(2);
            tg.showAlert("You earned 0.50 ETB!");
            
            // Reset Logic
            adStep = 0;
            document.querySelectorAll('.step').forEach(s => s.classList.remove('done'));
            document.getElementById('ad-progress').style.width = "0%";
            btn.innerText = "Start Watching";
            btn.style.background = ""; // Reset color
            document.getElementById('ad-status').innerText = "Watch 3 ads to earn 0.50 ETB";
        }
    } catch (e) {
        tg.showAlert("Error claiming reward.");
    }
}

// --- WITHDRAWAL ---
async function requestWithdraw() {
    const amt = document.getElementById('wd-amt').value;
    const acc = document.getElementById('wd-acc').value;

    if (amt < 50) return tg.showAlert("Minimum withdrawal is 50 ETB");
    if (!acc) return tg.showAlert("Enter Account Number");

    try {
        const res = await fetch(`${BACKEND_URL}/api/withdraw`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_id: currentUser.user_id, amount: parseFloat(amt), account: acc })
        });
        const data = await res.json();
        
        if (data.error) tg.showAlert(data.error);
        else {
            tg.showAlert("Request Sent!");
            syncUser(currentUser); // Refresh balance
        }
    } catch (e) { tg.showAlert("Network Error"); }
}

// --- ADMIN PANEL ---
async function fetchAdminData() {
    const res = await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: ADMIN_ID, action: "get_full_data" })
    });
    const data = await res.json();
    
    // Render Withdrawals
    const wList = data.withdrawals || [];
    const container = document.getElementById('adm-withdrawals');
    
    if (wList.length === 0) container.innerHTML = "<small>No Pending Requests</small>";
    else {
        container.innerHTML = wList.map(w => `
            <div class="req-card">
                <div>
                    <b>${w.amount} ETB</b><br>
                    ${w.account} (${w.method})<br>
                    <span style="color:${w.status==='Pending'?'orange':w.status==='Approved'?'green':'red'}">${w.status}</span>
                </div>
                <div class="req-actions">
                    ${w.status === 'Pending' ? `
                    <button class="btn-approve" onclick="decideWithdraw(${w.id}, 'Approved')">✓</button>
                    <button class="btn-reject" onclick="decideWithdraw(${w.id}, 'Rejected')">✗</button>` : ''}
                </div>
            </div>
        `).join('');
    }
}

async function decideWithdraw(reqId, decision) {
    await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: ADMIN_ID, action: "handle_withdrawal", req_id: reqId, decision })
    });
    fetchAdminData(); // Refresh
}

async function toggleMaintenance() {
    const res = await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: ADMIN_ID, action: "toggle_maintenance" })
    });
    const data = await res.json();
    alert("Maintenance Mode: " + data.mode);
}

async function banUser() {
    const target = document.getElementById('adm-target-id').value;
    if (!target) return;
    const res = await fetch(`${BACKEND_URL}/api/admin/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ admin_id: ADMIN_ID, action: "ban_user", target_id: target })
    });
    const data = await res.json();
    alert("User Banned Status: " + data.is_banned);
}

// --- UI UTILS ---
function switchTab(tabId, el) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    document.getElementById(`tab-${tabId}`).classList.add('active');
    
    if (el) {
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }

    if (tabId === 'admin') fetchAdminData();
}

function showMaintenance() {
    document.body.innerHTML = `
        <div style="height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; text-align:center; padding:20px;">
            <i class="fas fa-tools" style="font-size:50px; color:gold; margin-bottom:20px;"></i>
            <h2>Maintenance Break</h2>
            <p style="color:var(--muted)">We are upgrading the servers. Please come back later!</p>
        </div>
    `;
}
