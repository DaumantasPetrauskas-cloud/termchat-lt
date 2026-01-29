/* ================= CONFIG ================= */
const CONFIG = {
    // Using corsproxy.io to bypass browser security restrictions
    proxyUrl: "https://corsproxy.io/?", 
    groqEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "mixtral-8x7b-32768", // Fast, efficient model
    mqttBroker: "wss://test.mosquitto.org:8081/mqtt",
    // UPDATED API KEY
    apiKey: "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" 
};

/* ================= STATE ================= */
const state = {
    username: "USER_" + Math.floor(Math.random() * 9999),
    xp: 0,
    level: 1,
    mode: 'local', 
    apiKey: localStorage.getItem('termos_api_key') || CONFIG.apiKey, // Use config key first, then local storage
    currentZone: null,
    mqttClient: null
};

/* ================= ZONES DATA ================= */
const ZONES = {
    library: { name: "Knowledge Library", icon: "📚", welcome: "Welcome to the Library. Searching archives..." },
    studio: { name: "Creative Studio", icon: "🎨", welcome: "Studio active. Canvas ready." },
    workshop: { name: "Tech Workshop", icon: "💻", welcome: "Workshop online. Tools loaded." },
    lounge: { name: "Entertainment Lounge", icon: "🎭", welcome: "Relax! Music initialized." },
    thinktank: { name: "Think Tank", icon: "🧠", welcome: "Brainstorming mode active." }
};

/* ================= INITIALIZATION ================= */
window.onload = () => {
    document.getElementById('user-display').textContent = "@" + state.username;
    initMatrix();
    runBootSequence();
};

/* ================= BOOT ================= */
function runBootSequence() {
    const logs = [
        "Loading Kernel...", 
        "Checking API Status...", 
        "Mounting File System...", 
        "Connecting to Neural Net...", 
        "System Ready."
    ];
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
    // If API mode, check if we need to show the modal (only if no key exists)
    if (mode === 'api' && !state.apiKey) {
        document.getElementById('api-modal').classList.remove('hidden');
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
    if (mode === 'chat') { 
        title.textContent = "GLOBAL CHAT"; 
        connectMQTT(); 
        addMsg("System", "Connected to Global Chat (MQTT).", "system"); 
    } else if (mode === 'api') { 
        title.textContent = "GROQ AI TERMINAL"; 
        addMsg("System", "API Connected. Type directly to chat.", "system"); 
    } else if (mode === 'livingroom') { 
        title.textContent = "LIVING ROOM"; 
        addMsg("System", "Welcome Home! Try 'go to library'", "system"); 
    } else { 
        title.textContent = "LOCAL MODE"; 
        addMsg("System", "Offline mode active. Echo enabled.", "system"); 
    }
    
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
        setTimeout(() => addMsg("TermAi", "Echo: " + text, "ai"), 500);
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
    } else if (cmd === '/help') {
        addMsg("System", "Commands: /ai [prompt], /clear", "system");
    } else {
        addMsg("System", `Unknown command: ${cmd}`, "system");
    }
}

/* ================= AI LOGIC (FIXED) ================= */
async function talkToGroq(prompt) {
    // Ensure we have a key
    const activeKey = state.apiKey || CONFIG.apiKey;
    if (!activeKey) {
        addMsg("System", "No API Key found.", "system");
        return;
    }

    const loadingId = addMsg("Groq", "Thinking...", "loading");
    
    try {
        // Strategy 1: Try Direct Connection first (Faster)
        let url = CONFIG.groqEndpoint;
        
        const response = await fetch(url, {
            method: "POST",
            headers: { 
                "Authorization": `Bearer ${activeKey}`, 
                "Content-Type": "application/json" 
            },
            body: JSON.stringify({
                messages: [
                    { role: "system", content: "You are a helpful, concise AI assistant in a cyberpunk terminal." }, 
                    { role: "user", content: prompt }
                ],
                model: CONFIG.model
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            // If we suspect CORS or opaque failure
            if (response.type === 'opaque' || response.status === 0) {
                throw new Error("CORS_BLOCK");
            }
            throw new Error(errData.error?.message || `API Error ${response.status}`);
        }

        const data = await response.json();
        const reply = data.choices[0].message.content;
        
        removeMsg(loadingId);
        addMsg("Groq AI", reply, "ai");
        gainXP(25);

    } catch (error) {
        // FALLBACK: Try Proxy if direct connection failed
        if (error.message === "CORS_BLOCK") {
            updateMsg(loadingId, "🔄 Switching to Proxy...");
            
            try {
                const proxyUrl = CONFIG.proxyUrl + encodeURIComponent(CONFIG.groqEndpoint);
                const proxyResponse = await fetch(proxyUrl, {
                    method: "POST",
                    headers: { 
                        "Authorization": `Bearer ${activeKey}`, 
                        "Content-Type": "application/json" 
                    },
                    body: JSON.stringify({
                        messages: [
                            { role: "system", content: "You are a helpful, concise AI assistant." }, 
                            { role: "user", content: prompt }
                        ],
                        model: CONFIG.model
                    })
                });

                if (!proxyResponse.ok) throw new Error("Proxy Failed");
                const data = await proxyResponse.json();
                const reply = data.choices[0].message.content;
                
                removeMsg(loadingId);
                addMsg("Groq AI (Proxy)", reply, "ai");
                gainXP(25);

            } catch (proxyError) {
                removeMsg(loadingId);
                addMsg("System", "Connection Failed. CORS/Network Error.", "system");
                console.error(proxyError);
            }
        } else {
            removeMsg(loadingId);
            addMsg("System", `API Error: ${error.message}`, "system");
        }
    }
}

/* ================= LIVING ROOM LOGIC ================= */
function handleLivingRoom(text) {
    const lower = text.toLowerCase();
    
    // Check for zone switching
    for (const key in ZONES) {
        if (lower.includes('go to ' + key) || lower.includes(ZONES[key].name.toLowerCase())) {
            state.currentZone = key;
            document.getElementById('room-title').textContent = ZONES[key].icon + " " + ZONES[key].name.toUpperCase();
            addMsg("Room", ZONES[key].welcome, "ai");
            gainXP(10);
            return;
        }
    }

    // If in a zone, respond based on context
    if (!state.currentZone) return addMsg("System", "Enter a zone first (e.g., 'go to library').", "system");
    
    setTimeout(() => {
        let response = "I'm listening.";
        if (state.currentZone === 'library') response = "Data archived successfully.";
        if (state.currentZone === 'studio') response = "I've generated a creative concept.";
        if (state.currentZone === 'workshop') response = "Code compiled. 0 Errors.";
        if (state.currentZone === 'lounge') response = "Playing a chill track.";
        if (state.currentZone === 'thinktank') response = "Calculation complete. Probability high.";
        addMsg(ZONES[state.currentZone].name, response, "ai");
    }, 800);
}

/* ================= UTILITIES ================= */
function addMsg(user, text, type) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex flex-col gap-1 animate-fade-in max-w-full";
    
    if (type === 'loading') {
        div.id = "msg-" + Date.now();
        div.innerHTML = `<span class="text-purple-400 text-xs animate-pulse font-bold">🤖 ${text}</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div.id;
    }

    if (type === 'system') {
        div.innerHTML = `<div class="text-center text-[10px] text-gray-600 my-2 font-bold tracking-widest">--- ${text} ---</div>`;
    } else {
        const color = type === 'user' ? 'text-purple-400' : (type === 'remote' ? 'text-orange-400' : 'text-green-400');
        div.innerHTML = `
            <span class="text-[10px] text-gray-500 uppercase font-bold tracking-wide">${user}</span>
            <div class="${color} bg-white/5 p-2 rounded border border-white/5 text-sm break-words shadow-sm">${text}</div>
        `;
    }
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
}

function updateMsg(id, text) {
    const el = document.getElementById(id);
    if(el) el.querySelector('span').textContent = text;
}

function removeMsg(id) {
    const el = document.getElementById(id);
    if(el) el.remove();
}

function gainXP(amount) {
    state.xp += amount;
    const next = state.level * 100;
    if (state.xp >= next) {
        state.level++;
        state.xp = 0;
        addMsg("SYSTEM", `LEVEL UP! LVL ${state.level}`, "system");
    }
    document.getElementById('xp-text').textContent = `XP: ${state.xp}`;
    document.getElementById('lvl-text').textContent = `LVL. ${state.level}`;
    document.getElementById('xp-bar').style.width = `${(state.xp/next)*100}%`;
}

/* ================= MQTT ================= */
function connectMQTT() {
    try {
        // Using MQTT over WebSockets
        state.mqttClient = mqtt.connect(CONFIG.mqttBroker);
        
        state.mqttClient.on('connect', () => {
            console.log("MQTT Connected");
            state.mqttClient.subscribe("termchat-lt/public");
        });
        
        state.mqttClient.on('message', (t, m) => {
            try {
                const d = JSON.parse(m.toString());
                if (d.user !== state.username) addMsg(d.user, d.text, 'remote');
            } catch(e) { /* ignore malformed packets */ }
        });

        state.mqttClient.on('error', (err) => {
            console.log("MQTT Error", err);
        });
    } catch(e) {
        console.log("MQTT Library not loaded", e);
    }
}

function publishMQTT(text) {
    if (state.mqttClient && state.mqttClient.connected) {
        state.mqttClient.publish("termchat-lt/public", JSON.stringify({ user: state.username, text: text }));
    } else {
        addMsg("System", "Chat Disconnected. Retrying...", "system");
        connectMQTT();
    }
}

/* ================= MATRIX BG ================= */
function initMatrix() {
    const c = document.getElementById('matrix-canvas');
    if (!c) return;
    
    const ctx = c.getContext('2d');
    
    // Resize handler
    const resize = () => {
        c.width = window.innerWidth; 
        c.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const chars = "010101XYZ<>[];{}";
    const fontSize = 14;
    const columns = c.width / fontSize;
    const drops = [];
    
    for(let x = 0; x < columns; x++) drops[x] = 1;

    setInterval(() => {
        // Fade effect
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, c.width, c.height);
        
        ctx.fillStyle = "#0F0"; // Green text
        ctx.font = fontSize + "px monospace";
        
        for(let i = 0; i < drops.length; i++) {
            const text = chars.charAt(Math.floor(Math.random() * chars.length));
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);
            
            // Reset drop to top randomly
            if(drops[i] * fontSize > c.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }, 33);
}
