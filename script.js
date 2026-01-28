/* ================= CONFIGURATION ================= */
const APP_CONFIG = {
    version: "2.5.0",
    mqttBroker: "wss://test.mosquitto.org:8081/mqtt", // Public broker
    chatTopic: "termchat-lt/public"
};

/* ================= LIVING ROOM DATA ================= */
const ZONES = {
    library: {
        id: 'library',
        name: 'Knowledge Library',
        icon: '📚',
        color: 'text-yellow-400',
        tools: ['librarian', 'book', 'research', 'tutor'],
        welcome: "Welcome to the Knowledge Library. I can answer questions, write stories, or teach you languages."
    },
    studio: {
        id: 'studio',
        name: 'Creative Studio',
        icon: '🎨',
        color: 'text-pink-400',
        tools: ['artist', 'music', 'video', '3d'],
        welcome: "Welcome to the Creative Studio! Let's paint, compose music, or design something amazing."
    },
    workshop: {
        id: 'workshop',
        name: 'Tech Workshop',
        icon: '💻',
        color: 'text-blue-400',
        tools: ['code', 'app', 'web', 'data'],
        welcome: "Systems online. Ready to code, debug, or build applications."
    },
    lounge: {
        id: 'lounge',
        name: 'Entertainment Lounge',
        icon: '🎭',
        color: 'text-orange-400',
        tools: ['game', 'story', 'joke', 'trivia'],
        welcome: "Relax! Would you like to play a game, hear a story, or laugh at some jokes?"
    },
    thinktank: {
        id: 'thinktank',
        name: 'Think Tank',
        icon: '🧠',
        color: 'text-green-400',
        tools: ['solve', 'brainstorm', 'strategy', 'innovate'],
        welcome: "Problem solving mode activated. What challenge can we tackle today?"
    }
};

/* ================= STATE MANAGEMENT ================= */
const state = {
    username: "GUEST_" + Math.floor(Math.random() * 1000),
    xp: 0,
    level: 1,
    mode: 'local', // local, chat, livingroom, admin
    currentZone: null, // 'library', 'studio', etc.
    currentTool: null,
    connected: false
};

/* ================= DOM ELEMENTS ================= */
const bootScreen = document.getElementById('terminal-boot');
const mainLayout = document.getElementById('main-layout');
const terminalContent = document.getElementById('terminal-content');
const bootStatus = document.getElementById('boot-status');
const chatContainer = document.getElementById('chat-container');
const chatInput = document.getElementById('chatInput');
const userDisplay = document.getElementById('user-display');
const roomTitle = document.getElementById('room-title');
const xpText = document.getElementById('xp-text');
const lvlText = document.getElementById('lvl-text');
const xpBar = document.getElementById('xp-bar');

/* ================= INITIALIZATION ================= */
window.addEventListener('load', () => {
    userDisplay.textContent = "@" + state.username;
    runBootSequence();
    initMatrix();
});

/* ================= BOOT SEQUENCE ================= */
function runBootSequence() {
    const lines = [
        "Initializing TermAi Living Room v" + APP_CONFIG.version + "...",
        "Loading Environment Modules...",
        " > Library... OK",
        " > Studio... OK",
        " > Workshop... OK",
        "Calibrating AI Neural Interfaces...",
        "Connecting to Mainframe...",
        "System Ready."
    ];

    let i = 0;
    const interval = setInterval(() => {
        if (i < lines.length) {
            addLog(lines[i]);
            i++;
        } else {
            clearInterval(interval);
            bootStatus.textContent = "SYSTEM READY. SELECT MODE.";
            bootStatus.classList.remove('animate-pulse');
            bootStatus.classList.add('text-green-400');
        }
    }, 300);
}

function addLog(text) {
    const p = document.createElement('div');
    const time = new Date().toLocaleTimeString('en-US', { hour12: false });
    p.innerHTML = `<span class="text-gray-500">[${time}]</span> <span class="text-green-500">></span> ${text}`;
    terminalContent.appendChild(p);
    terminalContent.scrollTop = terminalContent.scrollHeight;
}

/* ================= APP NAVIGATION ================= */
window.enterApp = function(mode) {
    state.mode = mode;
    
    // UI Switch
    bootScreen.classList.add('hidden');
    mainLayout.classList.remove('hidden');
    
    // Mode Setup
    if (mode === 'livingroom') {
        roomTitle.textContent = "AI LIVING ROOM";
        addSystemMessage("🏠 Welcome to the AI Living Room!");
        setTimeout(() => {
            addSystemMessage("Type 'enter library', 'studio', 'workshop', 'lounge', or 'thinktank' to explore.");
        }, 1000);
    } else if (mode === 'chat') {
        roomTitle.textContent = "GLOBAL CHAT";
        connectMQTT();
        addSystemMessage("Connected to Global Matrix.");
    } else if (mode === 'termai') {
        roomTitle.textContent = "TERM_AI CONSOLE";
        addSystemMessage("Direct AI connection established.");
    } else {
        roomTitle.textContent = "ADMIN CONSOLE";
        addSystemMessage("Root access granted.");
    }
    
    setTimeout(() => chatInput.focus(), 100);
};

/* ================= LIVING ROOM LOGIC ================= */
function handleLivingRoomInput(text) {
    const lowerText = text.toLowerCase();

    // 1. Navigation Logic
    if (lowerText.includes('enter') || lowerText.includes('go to') || lowerText.includes('visit')) {
        for (const key in ZONES) {
            if (lowerText.includes(key) || lowerText.includes(ZONES[key].name.toLowerCase())) {
                changeZone(key);
                return;
            }
        }
        addMessage("System", "I didn't recognize that room. Try: Library, Studio, Workshop, Lounge, or Think Tank.", 'system');
        return;
    }

    // 2. Zone-Specific Interactions
    if (!state.currentZone) {
        addMessage("System", "Please enter a zone first (e.g., 'enter studio').", 'system');
        return;
    }

    // Mock Tool Logic based on keywords
    const currentZoneData = ZONES[state.currentZone];
    addMessage(currentZoneData.name, "Processing request: '" + text + "'...", 'ai');

    setTimeout(() => {
        let response = "";
        if (state.currentZone === 'library') {
            response = generateLibraryResponse(text);
        } else if (state.currentZone === 'studio') {
            response = generateStudioResponse(text);
        } else if (state.currentZone === 'workshop') {
            response = generateWorkshopResponse(text);
        } else if (state.currentZone === 'lounge') {
            response = generateLoungeResponse(text);
        } else if (state.currentZone === 'thinktank') {
            response = generateThinkTankResponse(text);
        }
        
        addMessage(currentZoneData.name, response, 'ai');
    }, 800);
}

function changeZone(zoneKey) {
    state.currentZone = zoneKey;
    const zone = ZONES[zoneKey];
    
    // Update Header
    roomTitle.textContent = `${zone.icon} ${zone.name.toUpperCase()}`;
    
    // Visual Feedback
    addSystemMessage(`--- Entering ${zone.name} ---`);
    addMessage(zone.name, zone.welcome, 'ai');
    gainXP(20);
}

/* ================= GENERATIVE RESPONSES (MOCK AI) ================= */
function generateLibraryResponse(input) {
    if (input.includes('write') || input.includes('story')) return "Once upon a time in a digital realm...";
    if (input.includes('explain')) return "This concept involves the interaction between data structures and algorithms...";
    return "I've archived that information in the main database. Is there anything else you'd like to research?";
}

function generateStudioResponse(input) {
    if (input.includes('paint') || input.includes('image')) return "Generating visual composition... 🎨 [Image Placeholder: A digital sunset over mountains]";
    if (input.includes('music')) return "Composing melody... 🎵 [Audio Placeholder: Upbeat Synthwave track]";
    return "I've sketched a draft for you. Would you like to refine the colors or add more details?";
}

function generateWorkshopResponse(input) {
    if (input.includes('code') || input.includes('function')) return "Here is the Python snippet you requested:\n`def init_system():\n  return 'Online'`";
    if (input.includes('debug')) return "Error found on line 42: Missing semicolon. Fixing...";
    return "I've compiled the build. Tests passed successfully.";
}

function generateLoungeResponse(input) {
    if (input.includes('game')) return "Starting Trivia! Question: What is the capital of Lithuania?";
    if (input.includes('joke')) return "Why do programmers prefer dark mode? Because light attracts bugs!";
    return "That's entertaining! Let's keep the vibe going.";
}

function generateThinkTankResponse(input) {
    if (input.includes('solve') || input.includes('problem')) return "Analyzing variables... Solution A: Efficiency increase. Solution B: Cost reduction.";
    if (input.includes('idea')) return "Innovation suggestion: Combine AI with IoT for smart home automation.";
    return "Brainstorming session complete. Here are 3 strategic options...";
}

/* ================= CHAT SYSTEM ================= */
chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
});

window.handleSend = function() {
    const text = chatInput.value.trim();
    if (!text) return;

    // 1. Add User Message
    addMessage(state.username, text, 'user');
    chatInput.value = "";

    // 2. Route Logic
    if (state.mode === 'livingroom') {
        handleLivingRoomInput(text);
    } else if (state.mode === 'chat' && state.mqttClient) {
        // MQTT
        state.mqttClient.publish(APP_CONFIG.chatTopic, JSON.stringify({
            user: state.username,
            text: text,
            timestamp: Date.now()
        }));
    } else if (state.mode === 'termai') {
        // Generic AI
        setTimeout(() => addMessage("TermAi", "I processed: " + text, 'ai'), 1000);
    } else {
        addSystemMessage("Command executed locally.");
    }
};

function addMessage(user, text, type) {
    const div = document.createElement('div');
    div.className = "flex flex-col gap-1 animate-fade-in";
    
    let colorClass = "text-gray-300";
    let bgClass = "bg-white/5";
    if (type === 'user') { colorClass = "text-purple-400 font-bold"; bgClass = "bg-purple-500/10"; }
    if (type === 'ai') { colorClass = "text-green-400 font-bold"; bgClass = "bg-green-500/10"; }
    if (type === 'system') { 
        div.innerHTML = `<div class="text-center text-xs text-gray-500 my-2 font-mono truncate">--- ${text} ---</div>`; 
        chatContainer.appendChild(div);
        chatContainer.scrollTop = chatContainer.scrollHeight;
        return; 
    }

    div.innerHTML = `
        <span class="text-[10px] text-gray-500 uppercase tracking-wider ml-1">${user}</span>
        <div class="${colorClass} ${bgClass} p-3 rounded-lg border border-white/5 break-words text-sm whitespace-pre-wrap shadow-sm">
            ${text}
        </div>
    `;
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    if (type === 'user' || type === 'ai') gainXP(5);
}

function addSystemMessage(text) {
    addMessage("System", text, 'system');
}

/* ================= MQTT ================= */
function connectMQTT() {
    try {
        const clientId = 'termchat_' + Math.random().toString(16).substr(2, 8);
        const client = mqtt.connect(APP_CONFIG.mqttBroker, { clientId: clientId });

        client.on('connect', () => {
            console.log("MQTT Connected");
            state.connected = true;
            state.mqttClient = client;
            client.subscribe(APP_CONFIG.chatTopic);
        });

        client.on('message', (topic, message) => {
            if (state.mode !== 'chat') return;
            try {
                const data = JSON.parse(message.toString());
                if (data.user !== state.username) {
                    addMessage(data.user, data.text, 'remote');
                }
            } catch (e) { console.error(e); }
        });
    } catch (e) { console.log("MQTT Error"); }
}

/* ================= GAMIFICATION & MATRIX ================= */
function gainXP(amount) {
    state.xp += amount;
    const nextLevelXp = state.level * 100;
    if (state.xp >= nextLevelXp) {
        state.level++;
        state.xp = 0;
        addSystemMessage(`LEVEL UP! WELCOME TO LEVEL ${state.level}`);
    }
    updateUI();
}

function updateUI() {
    xpText.textContent = `XP: ${state.xp}`;
    lvlText.textContent = `LVL. ${state.level} ${getTitle(state.level)}`;
    const nextLevelXp = state.level * 100;
    const percent = (state.xp / nextLevelXp) * 100;
    xpBar.style.width = `${percent}%`;
}

function getTitle(level) {
    if (level < 5) return "NEWBIE";
    if (level < 10) return "EXPLORER";
    if (level < 20) return "CREATOR";
    return "ARCHITECT";
}

/* ================= BACKGROUND EFFECT ================= */
function initMatrix() {
    const canvas = document.getElementById('matrix-canvas');
    const ctx = canvas.getContext('2d');
    
    // Resize fix
    const resize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789@#$%^&*()*&^%";
    const fontSize = 14;
    let columns = canvas.width / fontSize;
    const drops = [];

    for (let i = 0; i < columns; i++) drops[i] = 1;

    function draw() {
        ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        ctx.fillStyle = "#0F0";
        ctx.font = fontSize + "px monospace";

        for (let i = 0; i < drops.length; i++) {
            const text = chars[Math.floor(Math.random() * chars.length)];
            ctx.fillText(text, i * fontSize, drops[i] * fontSize);

            if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                drops[i] = 0;
            }
            drops[i]++;
        }
    }
    setInterval(draw, 33);
}

/* ================= VOICE ================= */
window.startVoiceRecognition = function() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice not supported.");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    recognition.onresult = function(event) {
        chatInput.value = event.results[0][0].transcript;
    };
};
