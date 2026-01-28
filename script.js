/* ================= CONFIGURATION ================= */
const APP_CONFIG = {
    version: "2.4.0",
    // REPLACE WITH YOUR REAL KEY IF NEEDED, or leave empty for local mock
    apiKey: "", 
    mqttBroker: "wss://test.mosquitto.org:8081/mqtt", // Public broker for testing
    chatTopic: "termchat-lt/public"
};

/* ================= STATE MANAGEMENT ================= */
const state = {
    username: "GUEST_" + Math.floor(Math.random() * 1000),
    xp: 0,
    level: 1,
    mode: 'local', // local, chat, termai, admin
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
const xpText = document.getElementById('xp-text');
const lvlText = document.getElementById('lvl-text');
const xpBar = document.getElementById('xp-bar');

/* ================= INITIALIZATION ================= */
window.addEventListener('load', () => {
    userDisplay.textContent = "@" + state.username;
    runBootSequence();
});

/* ================= BOOT SEQUENCE ================= */
function runBootSequence() {
    const lines = [
        "Initializing TermAi Core v" + APP_CONFIG.version + "...",
        "Loading Matrix driver...",
        "Mounting virtual file system...",
        "Checking dependencies... OK",
        "Establishing secure handshake...",
        "Bypassing firewall...",
        "Access Granted."
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
    }, 400); // Speed of text
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
    
    // 1. Hide Boot Screen
    bootScreen.classList.add('hidden');
    
    // 2. Show Main Layout
    mainLayout.classList.remove('hidden');
    
    // 3. Mode Specific Setup
    const roomTitle = document.getElementById('room-title');
    
    if (mode === 'chat') {
        roomTitle.textContent = "GLOBAL CHAT [MQTT]";
        connectMQTT();
        addSystemMessage("Connected to Global Matrix.");
    } else if (mode === 'termai') {
        roomTitle.textContent = "TERM_AI [LOCAL NEURAL NET]";
        addSystemMessage("TermAi Initialized. Ask me anything.");
    } else if (mode === 'local') {
        roomTitle.textContent = "LOCAL TERMINAL";
        addSystemMessage("Offline mode active.");
    } else if (mode === 'admin') {
        roomTitle.textContent = "ADMIN CONSOLE";
        addSystemMessage("Warning: Admin privileges logged.");
    }
    
    // Focus input
    setTimeout(() => chatInput.focus(), 100);
};

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

    // 2. Logic based on mode
    if (state.mode === 'chat' && state.mqttClient) {
        // Publish to MQTT
        state.mqttClient.publish(APP_CONFIG.chatTopic, JSON.stringify({
            user: state.username,
            text: text,
            timestamp: Date.now()
        }));
    } else if (state.mode === 'termai') {
        // Simulated AI Response
        simulateTyping();
        setTimeout(() => {
            const responses = [
                "I hear you, " + state.username + ".",
                "Processing query within the matrix...",
                "That is an interesting perspective.",
                "Data confirmed.",
                "I am TermAi v2.4. How can I assist?"
            ];
            const randomResponse = responses[Math.floor(Math.random() * responses.length)];
            addMessage("TermAi", randomResponse, 'ai');
        }, 1500);
    } else {
        // Local echo
        addSystemMessage("Message saved to local log.");
    }
};

function addMessage(user, text, type) {
    const div = document.createElement('div');
    div.className = "flex flex-col gap-1 animate-fade-in";
    
    let colorClass = "text-gray-300";
    if (type === 'user') colorClass = "text-purple-400 font-bold";
    if (type === 'ai') colorClass = "text-green-400 font-bold";

    div.innerHTML = `
        <span class="text-[10px] text-gray-500 uppercase tracking-wider">${user}</span>
        <div class="${colorClass} bg-white/5 p-2 rounded border border-white/5 break-words text-sm">
            ${text}
        </div>
    `;
    
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    gainXP(10);
}

function addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = "text-center text-xs text-gray-500 my-2 font-mono";
    div.textContent = `--- ${text} ---`;
    chatContainer.appendChild(div);
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

/* ================= MQTT CONNECTION ================= */
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
            if (state.mode !== 'chat') return; // Only receive if in chat mode
            try {
                const data = JSON.parse(message.toString());
                // Don't show own messages (handled by handleSend)
                if (data.user !== state.username) {
                    addMessage(data.user, data.text, 'remote');
                }
            } catch (e) {
                console.error("Error parsing message", e);
            }
        });
        
        client.on('error', (err) => {
            console.error("MQTT Error:", err);
            addSystemMessage("Connection Error. Retrying...");
        });
    } catch (e) {
        addSystemMessage("MQTT Library not loaded or blocked.");
    }
}

/* ================= GAMIFICATION ================= */
function gainXP(amount) {
    state.xp += amount;
    
    // Level up logic: Level * 100 XP required
    const nextLevelXp = state.level * 100;
    
    if (state.xp >= nextLevelXp) {
        state.level++;
        state.xp = 0; // Reset or carry over? Let's reset for simplicity
        addSystemMessage(`LEVEL UP! WELCOME TO LEVEL ${state.level}`);
        // Play sound effect here if you want
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
    if (level < 10) return "OPERATOR";
    if (level < 20) return "HACKER";
    if (level < 50) return "THE ONE";
    return "ARCHITECT";
}

/* ================= UTILS ================= */
function simulateTyping() {
    // Visual indicator for AI typing could go here
}

window.startVoiceRecognition = function() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice recognition not supported in this browser.");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.start();
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        chatInput.value = transcript;
    };
};
