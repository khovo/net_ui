// 🔥 BACKEND URL (መጨረሻ ላይ "/" የለውም) 🔥
const BACKEND_URL = "https://net-end.vercel.app";

let user = { id: 0, first_name: "Guest" };

document.addEventListener('DOMContentLoaded', () => {
    // 1. Telegram Init
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id;
            user.first_name = tg.initDataUnsafe.user.first_name;
        } else {
            console.warn("No Telegram User - Using Test ID");
            user.id = 8519835529; // Test ID
            user.first_name = "Admin (Test)";
        }
    }

    initData();
});

async function initData() {
    try {
        console.log("Fetching data from:", `${BACKEND_URL}/api/user/${user.id}`);
        
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`);
        
        if (!response.ok) throw new Error("Server Error: " + response.status);
        
        const data = await response.json();
        
        // UI Update
        document.getElementById('username').innerText = data.first_name || user.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        
        document.getElementById('userid').innerText = user.id;
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error("Fetch Error:", e);
        document.getElementById('loader').innerHTML = `<p style='color:red'>Connection Failed!<br>${e.message}</p>`;
    }
}

// ADS
function watchAd() {
    // Monetag Simulation for Testing
    // (እውነተኛው ስክሪፕት ካልመጣ በ Simulation እንሞክረው)
    const btn = event.currentTarget.querySelector('.btn-action');
    if(btn) btn.innerText = "...";

    setTimeout(() => {
        sendReward(0.50);
        if(btn) btn.innerText = "GO";
    }, 2000);
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
        } else {
            alert("❌ Error: " + (data.error || "Unknown"));
        }
    } catch (e) {
        alert("🌐 Network Error: " + e.message);
    }
}

// UTILS
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
    navigator.clipboard.writeText(`https://t.me/RiyalNetBot?start=${user.id}`);
    alert("Copied!");
}
