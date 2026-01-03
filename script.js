// 🔥 ትክክለኛው የ Backend URL (መጨረሻ ላይ "/" የለውም) 🔥
const BACKEND_URL = "https://net-end.vercel.app";

// ለሙከራ የምንጠቀምበት Admin ID (Telegram ከሌለ)
const ADMIN_ID = "8519835529"; 

let user = { id: 0, first_name: "Guest", photo_url: "" };

// --- 1. STARTUP (አፑ ሲከፈት) ---
document.addEventListener('DOMContentLoaded', () => {
    // A. Telegram መኖሩን ማረጋገጥ
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.expand(); // ሙሉ ስክሪን ማድረግ
        
        // የተጠቃሚ መረጃ ካለ መቀበል
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            user.id = tg.initDataUnsafe.user.id.toString();
            user.first_name = tg.initDataUnsafe.user.first_name;
            user.photo_url = tg.initDataUnsafe.user.photo_url;
        } else {
            // Telegram ላይ ካልሆነ (Test Mode)
            console.warn("No Telegram User - Using Test ID");
            user.id = ADMIN_ID; 
            user.first_name = "Admin (Test)";
        }
    }

    // B. አድሚን ከሆነ የ Crown ምልክቱን ማሳየት
    if (user.id === ADMIN_ID) {
        const adminIcon = document.getElementById('admin-icon');
        if(adminIcon) adminIcon.classList.remove('hidden');
    }

    // C. መረጃ ከ Backend ማምጣት
    initData();
});

// --- 2. DATA FETCHING (ከ Backend ጋር መገናኘት) ---
async function initData() {
    try {
        console.log("Fetching data from:", `${BACKEND_URL}/api/user/${user.id}`);
        
        // Backendን ስለ ተጠቃሚው መጠየቅ (ወይም መመዝገብ)
        const response = await fetch(`${BACKEND_URL}/api/user/${user.id}`, {
            method: 'POST', // POST ለ Update ይጠቅማል (ፎቶ/ስም ከተቀየረ)
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                first_name: user.first_name, 
                photo_url: user.photo_url 
            })
        });
        
        if (!response.ok) throw new Error("Server Error: " + response.status);
        
        const data = await response.json();
        
        // UI ላይ መረጃውን መሙላት
        document.getElementById('username').innerText = data.first_name || user.first_name;
        document.getElementById('balance').innerText = (data.balance || 0).toFixed(2);
        document.getElementById('userid').innerText = user.id;
        
        // ፎቶ ካለ ማሳየት
        if(data.photo_url) {
            const avatar = document.getElementById('avatar');
            if(avatar) avatar.src = data.photo_url;
        }
        
        // Invite Link ማስተካከል
        const refInput = document.getElementById('ref-link');
        if(refInput) refInput.value = `https://t.me/RiyalNetBot?start=${user.id}`;

        // Loading ማጥፋት
        document.getElementById('loader').style.display = 'none';
        document.getElementById('app').classList.remove('hidden');

    } catch (e) {
        console.error("Fetch Error:", e);
        document.getElementById('loader').innerHTML = `<p style='color:red; text-align:center;'>Connection Failed!<br>Backend URL ትክክል መሆኑን አረጋግጥ<br>${e.message}</p>`;
    }
}

// --- 3. ADS LOGIC (ማስታወቂያ) ---
function watchAd() {
    const btn = event.currentTarget.querySelector('.btn-action') || event.currentTarget;
    const originalText = btn.innerText;
    btn.innerText = "...";

    // Monetag ስክሪፕት ካለ
    if (typeof window.show_10378147 === 'function') {
        window.show_10378147().then(() => {
            // ማስታወቂያውን አይቶ ሲጨርስ
            sendReward(0.50);
            btn.innerText = originalText;
        }).catch(() => {
            // ማስታወቂያው ካልመጣ (Simulation)
            if(confirm("Ad failed to load. Simulate for testing?")) {
                sendReward(0.50);
            }
            btn.innerText = originalText;
        });
    } else {
        // ስክሪፕቱ ገና ከሆነ (Simulation)
        if(confirm("Ad Script Loading... Simulate View?")) {
            setTimeout(() => { sendReward(0.50); btn.innerText = originalText; }, 1000);
        } else {
            btn.innerText = originalText;
        }
    }
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

// --- 4. NAVIGATION & UTILS ---
function switchTab(tabId, el) {
    // ሁሉንም ታቦች መደበቅ
    document.querySelectorAll('.tab-view').forEach(t => t.classList.add('hidden'));
    document.querySelectorAll('.tab-view').forEach(t => t.classList.remove('active'));
    
    // የተመረጠውን ማሳየት
    const target = document.getElementById(`tab-${tabId}`);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('active');
    }

    // የታችኛውን በተን ማብራት
    if(el) {
        document.querySelectorAll('.nav-btn').forEach(n => n.classList.remove('active'));
        el.classList.add('active');
    }
}

function openUrl(url) {
    if(window.Telegram?.WebApp?.openLink) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function copyLink() {
    const el = document.getElementById('ref-link');
    if(el) {
        el.select();
        document.execCommand('copy');
        alert("Link Copied!");
    }
}

// --- 5. ADMIN FUNCTIONS (ከ Backend ጋር የሚገናኙ) ---
async function adminAddTask() {
    const title = document.getElementById('adm-task-title').value;
    const link = document.getElementById('adm-task-link').value;
    const reward = document.getElementById('adm-task-reward').value;
    
    if(!title || !link) return alert("Please fill all fields");
    
    await fetch(`${BACKEND_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, link, reward: parseFloat(reward) })
    });
    alert("Task Added Successfully!");
}

async function adminAddMoney() {
    const uid = document.getElementById('adm-uid').value;
    const amt = document.getElementById('adm-amt').value;
    
    if(!uid || !amt) return alert("Fill ID and Amount");

    await fetch(`${BACKEND_URL}/api/add_balance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: uid, amount: parseFloat(amt) })
    });
    alert("Money Sent!");
}

async function loadWithdrawals() {
    const res = await fetch(`${BACKEND_URL}/api/admin/withdrawals`);
    const data = await res.json();
    const box = document.getElementById('admin-withdrawals');
    
    if(data.length === 0) {
        box.innerHTML = "<p style='color:#777'>No requests pending.</p>";
    } else {
        box.innerHTML = data.map(w => 
            `<div style="background:#111; padding:10px; margin:5px; border-radius:5px; font-size:12px;">
                <b>ID:</b> ${w.user_id} <br> 
                <b>Amt:</b> ${w.amount} ETB <br> 
                <b>To:</b> ${w.method} (${w.account})
            </div>`
        ).join('');
    }
}
