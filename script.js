// 🔥 BACKEND URL (አንተ የሰጠኸኝ) 🔥
const BACKEND_URL = "https://net-end.vercel.app";

let user = { id: 0, first_name: "Guest" };

// --- STARTUP ---
document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram Init
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id;
            user.first_name = tg.initDataUnsafe.user.first_name;
        } else {
            // Testing Mode
            user.id = 8519835529; 
            user.first_name = "Admin (Test)";
        }
    }

    // 2. Load Data from Backend
    initData();
});

async function initData() {
    try {
        // Backend API መጥራት
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`);
        const data = await response.json();

        if (data.error) {
            console.log("New User or Connection Error");
        } else {
            document.getElementById('username').innerText = data.first_name || user.first_name;
            if(data.balance !== undefined) {
                document.getElementById('balance').innerText = data.balance.toFixed(2);
            }
        }
        
        document.getElementById('userid').innerText = user.id;
        document.getElementById('ref-link').value = `https://t.me/RiyalNetBot?start=${user.id}`;
        
        // Hide Loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error("Connection Error:", e);
        // Error ቢኖርም አፑን አሳይ (ባዶ እንዳይሆን)
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');
        alert("Connecting to server...");
    }
}

// --- ADS LOGIC ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-action');
    
    // Check Monetag
    if (typeof window.show_10378147 === 'function') {
        btn.innerText = "...";
        window.show_10378147().then(() => {
            sendReward(0.50);
            btn.innerText = "GO";
        }).catch(() => {
            if(confirm("Ad failed. Simulate?")) sendReward(0.50);
            btn.innerText = "GO";
        });
    } else {
        if(confirm("Ad Script loading... Simulate View?")) sendReward(0.50);
    }
}

async function sendReward(amount) {
    document.getElementById('balance').innerText = "...";
    
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
        } else {
            alert("Error saving balance");
        }
    } catch (e) {
        alert("Network Error: " + e);
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

function copyLink() {
    const el = document.getElementById('ref-link');
    el.select();
    document.execCommand('copy');
    alert("Copied!");
}
