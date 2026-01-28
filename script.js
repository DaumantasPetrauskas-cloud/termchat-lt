/* ================= CONFIG ================= */
const CONFIG = {
    // Try this public proxy first to fix CORS errors
    proxyUrl: "https://corsproxy.io/?", 
    groqEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "mixtral-8x7b-32768", // Fastest model
    mqttBroker: "wss://test.mosquitto.org:8081/mqtt"
};

/* ================= STATE ================= */
const state = {
    username: "USER_" + Math.floor(Math.random() * 9999),
    xp: 0,
    level: 1,
    mode: 'local', 
    apiKey: localStorage.getItem('termos_api_key') || null, // Load saved key
    currentZone: null,
    mqttClient: null
};

/* ================= ZONES DATA ================= */
const ZONES = {
    library: { name: "Knowledge Library", icon: "📚", welcome: "Welcome to the Library." },
    studio: { name: "Creative Studio", icon: "🎨", welcome: "Studio active." },
    workshop: { name: "Tech Workshop", icon: "💻", welcome: "Workshop online." },
    lounge: { name: "Entertainment Lounge", icon: "🎭", welcome: "Relax!" },
    thinktank: { name: "Think Tank", icon: "🧠", welcome: "Brainstorming mode." }
};

/* ================= INITIALIZATION ================= */
window.onload = () => {
    document.getElementById('user-display').textContent = "@" + state.username;
    initMatrix();
    runBootSequence();
};

/* ================= BOOT ================= */
function runBootSequence() {
    const logs = ["Loading Kernel...", "Checking API Status...", "Mounting File System...", "System Ready."];
    const term = document.getElementById('terminal-content');
    let i = 0;
    const interval = setInterval(() => {
        if (i < logs.length) {
            const p = document.createElement('div');
            p.textContent = `> ${logs[i]}`;
            term.appendChild(p);
            i++;
        } else {
            clearInterval(interval);
            document.getElementById('boot-status').textContent = "SELECT MODE";
            document.getElementById('boot-status').classList.remove('animate-pulse');
        }
    }, 400);
}

/* ================= NAVIGATION ================= */
window.enterApp = (mode) => {
    if (mode === 'api') {
        document.getElementById('api-modal').classList.remove('hidden');
        if (state.apiKey) document.getElementById('api-key-input').value = state.apiKey; // Pre-fill if exists
        return;
    }
    switchLayout(mode);
};

window.submitApiKey = () => {
    const key = document.getElementById('api-key-input').value.trim();
    if (!key.startsWith('gsk_')) {
        alert("Invalid Key: Must start with 'gsk_'");
        return;
    }
    state.apiKey = key;
    localStorage.setItem('termos_api_key', key); // Save key locally
    document.getElementById('api-modal').classList.add('hidden');
    switchLayout('api');
};

window.cancelApiKey = () => {
    document.getElementById('api-modal').classList.add('hidden');
};

function switchLayout(mode) {
    document.getElementById('terminal-boot').classList.add('hidden');
    document.getElementById('main-layout').classList.remove('hidden');
    state.mode = mode;
    
    const title = document.getElementById('room-title');
    if (mode === 'chat') { title.textContent = "GLOBAL CHAT"; connectMQTT(); addMsg("System", "Connected to Global Chat.", "system"); }
    else if (mode === 'api') { title.textContent = "GROQ AI"; addMsg("System", "API Connected. Use /ai [prompt]", "system"); }
    else if (mode === 'livingroom') { title.textContent = "LIVING ROOM"; addMsg("System", "Welcome Home!", "system"); }
    else { title.textContent = "LOCAL MODE"; addMsg("System", "Offline mode active.", "system"); }
    
    setTimeout(() => document.getElementById('chatInput').focus(), 100);
}

/* ================= CHAT LOGIC ================= */
const chatInput = document.getElementById('chatInput');
chatInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });

window.handleSend = () => {
    const text = chatInput.value.trim();
    if (!text) return;
    addMsg(state.username, text, 'user');
    chatInput.value = "";

    if (text.startsWith('/')) {
        handleCommand(text);
    } else if (state.mode === 'livingroom') {
        handleLivingRoom(text);
    } else if (state.mode === 'api') {
        talkToGroq(text);
    } else if (state.mode === 'chat') {
        publishMQTT(text);
    } else {
        setTimeout(() => addMsg("TermAi", "Local: " + text, "ai"), 500);
    }
};

function handleCommand(raw) {
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (cmd === '/ai') {
        if (!args) return addMsg("System", "Usage: /ai [prompt]", "system");
        talkToGroq(args);
    } else if (cmd === '/clear') {
        document.getElementById('chat-container').innerHTML = '';
    }
}

/* ================= AI LOGIC (FIXED ERRORS) ================= */
async function talkToGroq(prompt) {
    if (!state.apiKey) {
        addMsg("System", "No API Key found. Please restart and enter key.", "system");
        return;
    }

    const loadingId = addMsg("AI", "Connecting to Groq...", "loading");
    
    try {
        // Strategy 1: Try direct connection
        let url = CONFIG.groqEndpoint;
        let useProxy = false;

        // NOTE: If direct connection fails, we will retry with the proxy below
        
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${state.apiKey}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
                model: CONFIG.model
            })
        });

        // Check for CORS or Network Errors
        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            
            // If it's a CORS error (opaque) or network failure
            if (response.type === 'opaque' || !response.statusText) {
                throw new Error("CORS_BLOCK");
            }
            
            throw new Error(errData.error?.message || `API Error ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        document.getElementById(loadingId).remove();
        addMsg("Groq AI", reply, "ai");
        gainXP(25);

    } catch (error) {
        // FALLBACK: Try using a Proxy if CORS blocked the first attempt
        if (error.message === "CORS_BLOCK") {
            document.getElementById(loadingId).textContent = "🔄 Retrying via Proxy...";
            
            try {
                const proxyUrl = CONFIG.proxyUrl + encodeURIComponent(CONFIG.groqEndpoint);
                const proxyResponse = await fetch(proxyUrl, {
                    method: "POST",
                    headers: { 
                        "Authorization": `Bearer ${state.apiKey}`, 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({
                        messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: prompt }],
                        model: CONFIG.model
                    })
                });

                if (!proxyResponse.ok) throw new Error("Proxy Failed");
                const data = await proxyResponse.json();
                const reply = data.choices[0].message.content;
                
                document.getElementById(loadingId).remove();
                addMsg("Groq AI (Proxy)", reply, "ai");
                gainXP(25);

            } catch (proxyError) {
                document.getElementById(loadingId).remove();
                addMsg("System", "Error: Blocked by Browser CORS. Try a different browser or disable web security for testing.", "system");
                console.error(proxyError);
            }
        } else {
            // Standard API Errors (Invalid Key, Rate Limit)
            document.getElementById(loadingId).remove();
            addMsg("System", `API Error: ${error.message}`, "system");
        }
    }
}

/* ================= LIVING ROOM LOGIC ================= */
function handleLivingRoom(text) {
    const lower = text.toLowerCase();
    for (const key in ZONES) {
        if (lower.includes(key) || lower.includes(ZONES[key].name.toLowerCase())) {
            state.currentZone = key;
            document.getElementById('room-title').textContent = ZONES[key].icon + " " + ZONES[key].name.toUpperCase();
            addMsg(ZONES[key].name, ZONES[key].welcome, "ai");
            gainXP(10);
            return;
        }
    }
    if (!state.currentZone) return addMsg("System", "Enter a zone first.", "system");
    
    setTimeout(() => {
        let response = "I'm listening.";
        if (state.currentZone === 'library') response = "Data archived.";
        if (state.currentZone === 'studio') response = "Creative concept generated.";
        if (state.currentZone === 'workshop') response = "Code compiled.";
        if (state.currentZone === 'lounge') response = "Haha, good one!";
        if (state.currentZone === 'thinktank') response = "Solution calculated.";
        addMsg(ZONES[state.currentZone].name, response, "ai");
    }, 800);
}

/* ================= UTILITIES ================= */
function addMsg(user, text, type) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex flex-col gap-1 animate-fade-in";
    
    if (type === 'loading') {
        div.id = "loading-" + Date.now();
        div.innerHTML = `<span class="text-orange-400 text-xs animate-pulse">🤖 ${text}</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div.id;
    }

    if (type === 'system') {
        div.innerHTML = `<div class="text-center text-[10px] text-gray-500 my-2">--- ${text} ---</div>`;
    } else {
        const color = type === 'user' ? 'text-purple-400' : 'text-green-400';
        div.innerHTML = `
            <span class="text-[10px] text-gray-500 uppercase">${user}</span>
            <div class="${color} bg-white/5 p-2 rounded border border-white/5 text-sm break-words">${text}</div>
        `;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function gainXP(amount) {
    state.xp += amount;
    const next = state.level * 100;
    if (state.xp >= next) {
        state.level++;
        state.xp = 0;
        addMsg("System", `LEVEL UP! LVL ${state.level}`, "system");
    }
    document.getElementById('xp-text').textContent = `XP: ${state.xp}`;
    document.getElementById('lvl-text').textContent = `LVL. ${state.level}`;
    document.getElementById('xp-bar').style.width = `${(state.xp/next)*100}%`;
}

/* ================= MQTT ================= */
function connectMQTT() {
    try {
        state.mqttClient = mqtt.connect(CONFIG.mqttBroker);
        state.mqttClient.on('connect', () => {
            state.mqttClient.subscribe("termchat-lt/public");
        });
        state.mqttClient.on('message', (t, m) => {
            const d = JSON.parse(m.toString());
            if (d.user !== state.username) addMsg(d.user, d.text, 'remote');
        });
    } catch(e) {}
}

function publishMQTT(text) {
    if (state.mqttClient && state.mqttClient.connected) {
        state.mqttClient.publish("termchat-lt/public", JSON.stringify({ user: state.username, text: text }));
    }
}

/* ================= MATRIX BG ================= */
function initMatrix() {
    const c = document.getElementById('matrix-canvas');
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; c.height = window.innerHeight;
    const chars = "010101ABCDEF";
    const drops = [];
    for(let x=0; x<c.width/14; x++) drops[x]=1;
    setInterval(()=>{
        ctx.fillStyle="rgba(0,0,0,0.05)";
        ctx.fillRect(0,0,c.width,c.height);
        ctx.fillStyle="#0F0";
        ctx.font="14px monospace";
        for(let i=0;i<drops.length;i++){
            ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*14, drops[i
