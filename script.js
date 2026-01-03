const BACKEND_URL = "https://net-end.vercel.app";
const ADMIN_ID = "8519835529";

let user = { id: "0", first_name: "Guest", photo_url: "" };

document.addEventListener('DOMContentLoaded', () => {
    if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand();
        if (tg.initDataUnsafe?.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url;
        } else {
            // Test Mode
            user.id = ADMIN_ID; user.first_name = "Admin (Test)";
        }
    }
    
    // Admin Button
    if (user.id === ADMIN_ID) document.getElementById('admin-btn').classList.remove('hidden');

    initData();
});

async function initData() {
    try {
        // Backendን ስለ ተጠቃሚው ጠይቅ (User Sync)
        const res = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST', // ስሙን እና ፎቶውን Update ለማድረግ
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name,
                photo_url: user.photo_url 
            })
        });

        if (!res.ok) throw new Error("Backend Error");

        const data = await res.json();

        // UI ሙላ
        document.getElementById('username').innerText = data.first_name;
        document.getElementById('userid').innerText = user.id;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        
        // ፎቶ
        if (data.photo_url) document.getElementById('avatar').src = data.photo_url;

        // Stats
        if(document.getElementById('stat-ads')) {
            document.getElementById('stat-ads').innerText = data.today_ads || 0;
            document.getElementById('ads-left').innerText = 50 - (data.today_ads || 0);
        }

        // Hide Loader
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error(e);
        document.getElementById('loader').innerHTML = `<p style="color:red">Backend Connection Failed!<br>Please Redeploy Backend.</p>`;
    }
}

// Ads Logic
function watchAd() {
    // ... (የድሮው Ads Logic እንዳለ ነው) ...
    // ለሙከራ Simulation:
    const btn = document.querySelector('.btn-go');
    if(btn) btn.innerText = "...";
    
    setTimeout(() => {
        addMoney(0.50);
        if(btn) btn.innerText = "GO";
    }, 2000);
}

async function addMoney(amt) {
    try {
        const res = await fetch(`${BACKEND_URL}/api/add_balance`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ user_id: user.id, amount: amt })
        });
        const d = await res.json();
        if(d.status === 'success') {
            document.getElementById('balance').innerText = d.new_balance.toFixed(2);
            alert(`+${amt} ETB Added!`);
        }
    } catch(e) { alert("Network Error"); }
}

// Utils (Tabs, Links...)
function switchTab(id) {
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.getElementById(`tab-${id}`).classList.remove('hidden');
}
function openUrl(url) { window.open(url, '_blank'); }
