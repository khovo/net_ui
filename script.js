// ⚠️ ያንተን BACKEND URL እዚህ ጋር በትክክል አስገባ ⚠️
const BACKEND_URL = "https://net-end.vercel.app";

let user = { id: "0", first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram Check
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        if (tg.initDataUnsafe?.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url;
        } else {
            user.id = "8519835529"; // Test ID
            user.first_name = "Admin (Test)";
        }
    }

    // 2. Admin Icon Check
    if(user.id === "8519835529") document.getElementById('admin-icon').classList.remove('hidden');

    // 3. Load Data with TIMEOUT PROTECTION
    // (ዳታቤዙ ቢዘገይ እንኳን አፑ አይቆምም)
    const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Timeout")), 5000)
    );

    Promise.race([initData(), timeout])
        .catch(err => {
            console.warn("Backend slow/down, opening offline mode...");
            document.getElementById('loader').style.display = 'none';
            document.getElementById('app').classList.remove('hidden');
            // Show Local/Default Data
            document.getElementById('username').innerText = user.first_name;
            document.getElementById('balance').innerText = "0.00";
        });
});

async function initData() {
    console.log("Connecting to:", BACKEND_URL);
    
    // Fetch from Backend
    const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            first_name: user.first_name, 
            photo_url: user.photo_url 
        })
    });

    if (!res.ok) throw new Error("Server Error");

    const data = await res.json();

    // Update UI
    document.getElementById('username').innerText = data.first_name;
    document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
    document.getElementById('userid').innerText = user.id;
    
    if (data.photo_url) document.getElementById('avatar').src = data.photo_url;

    // Open App
    document.getElementById('loader').style.display = 'none';
    document.getElementById('app').classList.remove('hidden');
}

// --- ADS ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-action');
    btn.innerText = "...";
    
    // Monetag Logic
    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => claimReward(0.50, btn))
        .catch(() => {
            if(confirm("Ad Error. Simulate?")) claimReward(0.50, btn);
            else btn.innerText = "GO";
        });
    } else {
        if(confirm("Script Loading... Simulate?")) claimReward(0.50, btn);
        else btn.innerText = "GO";
    }
}

async function claimReward(amt, btn) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, amount: amt })
        });
        const data = await res.json();
        if(data.status === 'success') {
            document.getElementById('balance').innerText = data.new_balance.toFixed(2);
            alert(`+${amt} ETB Added!`);
        }
    } catch(e) { alert("Network Error"); }
    btn.innerText = "GO";
}

// Utils
function switchTab(id) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
}
function openUrl(url) { window.open(url, '_blank'); }
