/* ================= CONFIG ================= */
const CONFIG = {
    version: "2.6.0",
    groqEndpoint: "https://api.groq.com/openai/v1/chat/completions",
    model: "mixtral-8x7b-32768",
    mqttBroker: "wss://test.mosquitto.org:8081/mqtt"
};

/* ================= STATE ================= */
const state = {
    username: "USER_" + Math.floor(Math.random() * 9999),
    xp: 0,
    level: 1,
    mode: 'local', // local, chat, api, livingroom
    apiKey: null,
    currentZone: null, // For Living Room
    mqttClient: null
};

/* ================= ZONES DATA ================= */
const ZONES = {
    library: { name: "Knowledge Library", icon: "📚", welcome: "Welcome to the Library. What do you want to learn?" },
    studio: { name: "Creative Studio", icon: "🎨", welcome: "Studio active. Let's create something." },
    workshop: { name: "Tech Workshop", icon: "💻", welcome: "Workshop online. Ready to code." },
    lounge: { name: "Entertainment Lounge", icon: "🎭", welcome: "Relax! Games and stories loaded." },
    thinktank: { name: "Think Tank", icon: "🧠", welcome: "Brainstorming mode activated." }
};

/* ================= INITIALIZATION ================= */
window.onload = () => {
    document.getElementById('user-display').textContent = "@" + state.username;
    initMatrix();
    runBootSequence();
};

/* ================= BOOT ================= */
function runBootSequence() {
    const logs = ["Loading Kernel...", "Mounting File System...", "Connecting to Matrix...", "System Ready."];
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
        return;
    }
    switchLayout(mode);
};

window.submitApiKey = () => {
    const key = document.getElementById('api-key-input').value;
    if (key) {
        state.apiKey = key;
        document.getElementById('api-modal').classList.add('hidden');
        switchLayout('api');
    }
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
    else if (mode === 'livingroom') { title.textContent = "LIVING ROOM"; addMsg("System", "Welcome Home! Type 'enter library' to start.", "system"); }
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
        // Local fallback
        setTimeout(() => addMsg("TermAi", "I heard you: " + text, "ai"), 500);
    }
};

function handleCommand(raw) {
    const parts = raw.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (cmd === '/ai') {
        if (!args) return addMsg("System", "Usage: /ai [prompt]", "system");
        if (state.mode !== 'api') addMsg("System", "Switching to API mode for this request...", "system");
        talkToGroq(args);
    } else if (cmd === '/help') {
        addMsg("System", "Commands: /ai [prompt], /clear, /help", "system");
    } else if (cmd === '/clear') {
        document.getElementById('chat-container').innerHTML = '';
    }
}

/* ================= AI LOGIC ================= */
async function talkToGroq(prompt) {
    const loadingId = addMsg("AI", "Thinking...", "loading");
    
    try {
        if (!state.apiKey) throw new Error("API Key missing.");

        const res = await fetch(CONFIG.groqEndpoint, {
            method: "POST",
            headers: { "Authorization": `Bearer ${state.apiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "system", content: "You are TermAi." }, { role: "user", content: prompt }],
                model: CONFIG.model
            })
        });

        if (!res.ok) throw new Error(`API Error: ${res.status}`);
        const data = await res.json();
        const reply = data.choices[0].message.content;

        document.getElementById(loadingId).remove();
        addMsg("Groq AI", reply, "ai");
        gainXP(25);

    } catch (err) {
        document.getElementById(loadingId)?.remove();
        addMsg("System", "Error: " + err.message, "system");
    }
}

/* ================= LIVING ROOM LOGIC ================= */
function handleLivingRoom(text) {
    const lower = text.toLowerCase();
    
    // Navigation
    for (const key in ZONES) {
        if (lower.includes(key) || lower.includes(ZONES[key].name.toLowerCase())) {
            state.currentZone = key;
            document.getElementById('room-title').textContent = ZONES[key].icon + " " + ZONES[key].name.toUpperCase();
            addMsg(ZONES[key].name, ZONES[key].welcome, "ai");
            gainXP(10);
            return;
        }
    }

    // Zone Interaction
    if (!state.currentZone) {
        addMsg("System", "Enter a zone first (e.g., 'enter library').", "system");
        return;
    }

    // Mock Zone Responses
    setTimeout(() => {
        let response = "I'm listening. Tell me more.";
        if (state.currentZone === 'library') response = "I have archived that data. Need a summary?";
        if (state.currentZone === 'studio') response = "Generating creative concept... Done.";
        if (state.currentZone === 'workshop') response = "Code snippet generated successfully.";
        if (state.currentZone === 'lounge') response = "That's funny! Tell me another.";
        if (state.currentZone === 'thinktank') response = "Brainstorming complete. Here is a solution.";
        addMsg(ZONES[state.currentZone].name, response, "ai");
    }, 800);
}

/* ================= UTILITIES ================= */
function addMsg(user, text, type) {
    const container = document.getElementById('chat-container');
    const div = document.createElement('div');
    div.className = "flex flex-col gap-1 animate-fade-in";
    
    // Loading handling
    if (type === 'loading') {
        div.id = text; // Use text as ID hack for removal
        div.innerHTML = `<span class="text-purple-400 text-xs animate-pulse">🤖 AI is thinking...</span>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return text; // Return ID
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
            ctx.fillText(chars[Math.floor(Math.random()*chars.length)], i*14, drops[i]*14);
            if(drops[i]*14>c.height && Math.random()>0.975) drops[i]=0;
            drops[i]++;
        }
    }, 33);
}
