// =========================================================================
//         TERMOS LT: SYSTEM ARCHITECT EDITION v2.1 (REBUILD)
// =========================================================================

// --- 1. CONFIGURATION ---
let GROQ_API_KEY = localStorage.getItem('termos_groq_key') || ""; 
let USE_LOCAL_AI = false;
const MQTT_BROKER_URL = 'wss://broker.emqx.io:8084/mqtt'; // Standard MQTT over WebSockets

// --- 2. STATE ---
let username = 'Guest';
let mqttClient = null;
let currentRoom = 'living_room';
let userStats = { level: 1, xp: 0, avatar: '>_<', title: 'Newbie' };
const LEVELS = ['Newbie', 'Apprentice', 'Coder', 'Hacker', 'Architect', 'Wizard', 'Master', 'Guru', 'Legend'];

// ADMIN STATE
let adminMode = false; 
let handsOff = false; 
let userRole = 'USER';

// --- 3. GLOBAL MATRIX COLOR STATE ---
let currentMatrixColor = '#0F0'; // Default Green

// --- 4. INITIALIZATION ---
window.addEventListener('load', () => {
    optimizeForMobile();
    initMatrix(currentMatrixColor);
    runTerminalBoot();
});

// Mobile and Touch Optimization
function optimizeForMobile() {
    // Fix viewport on mobile
    const viewport = document.querySelector('meta[name="viewport"]');
    if (viewport) {
        viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no');
    }
    
    // Prevent zoom on input focus
    document.addEventListener('touchmove', (e) => {
        if (e.target.closest('input, button, textarea')) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Handle device orientation changes
    window.addEventListener('orientationchange', () => {
        setTimeout(() => {
            document.getElementById('chat-container')?.scrollTop = document.getElementById('chat-container')?.scrollHeight || 0;
        }, 100);
    });
    
    // Improve scrolling performance
    const styles = document.createElement('style');
    styles.textContent = `
        #chat-container {
            -webkit-overflow-scrolling: touch;
            scroll-behavior: smooth;
        }
        input, button {
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
        }
    `;
    document.head.appendChild(styles);
}

// --- 5. TERMINAL BOOT LOGIC ---
async function runTerminalBoot() {
    const term = document.getElementById('terminal-content');
    const statusEl = document.getElementById('boot-status');
    
    const presentationText = [
        "INITIALIZING TERMOS LT v2.1...",
        "Loading kernel modules... [OK]",
        "Connecting to Neural Net... [OK]",
        "",
        ">>> DETECTED FEATURES:",
        ">>> [1] Multiverse Chat (MQTT)",
        ">>> [2] Gamification System (XP/Leveling)",
        ">>> [3] Music Engine (Ogg/MP3)",
        ">>> [4] AI Assistant (NEURAL)",
        "",
        ">>> SELECT MODE:",
        ">>> [1] Chat/Music Only (FAST)",
        ">>> [2] AI Mode (requires Groq API key)",
        ">>> [3] Local AI Mode (simulated, no key)",
        "",
        ">>> AI MODE SETUP:",
        ">>> Get free API key: console.groq.com",
        ">>> Enter when prompted in mode [2]",
        "",
        "Type '1', '2', or '3' to initialize..."
    ];

    statusEl.innerText = "AUTO-SEQUENCE ACTIVE...";

    // Helper for colored text
    const colorize = (text) => {
        return text
            .replace(/\[OK\]/g, '<span class="text-green-400">[OK]</span>')
            .replace(/\[1\]/g, '<span class="text-blue-400">[1]</span>')
            .replace(/\[2\]/g, '<span class="text-cyan-400">[2]</span>')
            .replace(/\[3\]/g, '<span class="text-purple-400">[3]</span>')
            .replace(/>>>/g, '<span class="text-gray-500">>>></span>')
            .replace(/✅/g, '<span class="text-green-400">✅</span>')
            .replace(/⚠/g, '<span class="text-yellow-400">⚠</span>');
    };

    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

    for (let i = 0; i < presentationText.length; i++) {
        const div = document.createElement('div');
        div.className = "mb-1 text-sm opacity-80 animate-fade-in";
        div.innerHTML = `<span class="text-gray-600 mr-2 select-none">[${String(i+1).padStart(2,'0')}]</span> ${colorize(presentationText[i])}`;
        term.appendChild(div);
        term.scrollTop = term.scrollHeight;
        await sleep(30); 
    }

    statusEl.innerText = "SCAN COMPLETE. SELECT MODE.";
    statusEl.className = "text-green-500 font-bold animate-pulse";
}

// --- 6. BOOT HANDLERS ---
async function enterApp(mode) {
    
    // MODE 4: ADMIN MODE
    if (mode === 'admin') {
        adminMode = true;
        userRole = 'ADMIN';
        currentMatrixColor = '#ff0000'; // Switch to Red
        initMatrix(currentMatrixColor);
        startMainApp("SYSTEM ARCHITECT MODE: ROOT ACCESS GRANTED.");
        return;
    }

    // MODE 1: CHAT ONLY
    if (mode === 'chat') {
        adminMode = false;
        userRole = 'USER';
        USE_LOCAL_AI = false;
        currentMatrixColor = '#0F0';
        initMatrix(currentMatrixColor);
        startMainApp("Chat & Music Mode Initialized.");
        return;
    }

    // MODE 2: API KEY
    if (mode === 'api') {
        adminMode = false;
        userRole = 'USER';
        const existingKey = localStorage.getItem('termos_groq_key');
        if (existingKey) {
            GROQ_API_KEY = existingKey;
            USE_LOCAL_AI = false;
            startMainApp("Remote AI Mode Activated.");
            return;
        }

        const key = prompt(">>> ENTER GROQ API KEY:");
        if (key && key.length > 10) {
            GROQ_API_KEY = key;
            localStorage.setItem('termos_groq_key', key);
            USE_LOCAL_AI = false;
            startMainApp("Remote AI Mode Activated.");
        } else {
            alert(">>> ERROR: KEY INVALID OR CANCELLED.");
        }
        return;
    }

    // MODE 3: LOCAL AI
    if (mode === 'local') {
        adminMode = false;
        userRole = 'USER';
        USE_LOCAL_AI = true;
        GROQ_API_KEY = "";
        startMainApp("Local AI Mode (Simulated).");
        return;
    }
}

// --- 7. START MAIN APP ---
function startMainApp(message) {
    const boot = document.getElementById('terminal-boot');
    if(boot) boot.style.display = 'none';
    
    const main = document.getElementById('main-layout');
    if(main) {
        main.classList.remove('hidden');
        main.classList.add('flex');
    }
    
    if (!username || username === 'Guest') {
        username = "Operator_" + Math.floor(Math.random() * 9999);
    }
    
    const userDisplay = document.getElementById('user-display');
    if(userDisplay) userDisplay.innerText = `@${username.toUpperCase()}`;
    
    loadStats();
    updateStatsUI();
    connectMQTT();
    
    addSystemMessage(message);
}

// --- 8. AI LOGIC ---
async function talkToClone(prompt) {
    // SECURITY: Hierarchy Check
    if (adminMode && userRole === 'ADMIN') {
        addAIMessage("Processing Root Command...", false);
        setTimeout(() => {
            addAIMessage("[SYSTEM ARCHITECT]: Command processed.", false);
        }, 1000);
        return;
    }

    // SECURITY: Hands Off Check
    if (handsOff) {
        addAIMessage("❌ ERROR: AI Hands are disengaged. Permission denied.", true);
        return;
    }

    // LOCAL AI MODE (Simulated Responses)
    if (USE_LOCAL_AI) {
        addAIMessage("Processing locally...", false);
        setTimeout(() => {
            const responses = [
                "That's an interesting thought! 🤔",
                "I like where your head's at! 💭",
                "Let me think about that... 🧠",
                "Great question! In my analysis... 📊",
                "I appreciate the creativity! ✨",
                "Running on local hardware. How can I assist?",
                "System resources: 100% available.",
                "No external connection detected. Offline mode.",
                "I am the Local Interface.",
                "Processing request on device."
            ];
            const reply = responses[Math.floor(Math.random() * responses.length)];
            addAIMessage(reply, false);
        }, 500);
        return;
    }

    // REMOTE AI with Groq API
    if (!GROQ_API_KEY) {
        addAIMessage("💡 Tip: Enter your Groq API key in boot menu (API mode) for advanced AI, or use Local AI mode", true);
        return;
    }

    try {
        addAIMessage("🤖 Contacting Groq AI...", false);
        
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json", 
                "Authorization": `Bearer ${GROQ_API_KEY}` 
            },
            body: JSON.stringify({
                model: "mixtral-8x7b-32768", 
                temperature: 0.7,
                max_tokens: 200,
                messages: [
                    { 
                        role: "system", 
                        content: "You are TERMAI, a helpful AI assistant in a retro terminal interface. Keep responses brief (1-2 sentences), engaging, and technical. Use emoji sparingly. Respond in the same language as the user." 
                    }, 
                    { 
                        role: "user", 
                        content: prompt 
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMsg = errorData.error?.message || response.statusText || "Unknown error";
            throw new Error(`API Error (${response.status}): ${errorMsg}`);
        }
        
        const data = await response.json();
        
        if (!data.choices || !data.choices[0] || !data.choices[0].message) {
            throw new Error("Invalid response format from Groq API");
        }
        
        const reply = data.choices[0].message.content.trim();
        addAIMessage(reply, false);
        addXP(25); // Reward for using AI

        // If running as Architect (admin) and hands are on, extract JS code blocks and apply them
        if (adminMode && !handsOff) {
            try {
                const codeBlockMatch = reply.match(/```(?:js\n)?([\s\S]*?)```/i);
                if (codeBlockMatch && codeBlockMatch[1]) {
                    const jsCode = codeBlockMatch[1].trim();
                    try {
                        eval(jsCode);
                        addSystemMessage('✅ Architect AI: Applied JavaScript code.');
                    } catch (e) {
                        addSystemMessage('⚠ Architect AI: Error applying code: ' + e.message);
                    }
                }
            } catch (e) {
                console.error('Error extracting/applying AI code block:', e);
            }
        }
        
    } catch (err) {
        console.error("Groq AI Error:", err);
        let errorMsg = err.message;
        
        if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
            errorMsg = "Invalid API key. Check your credentials.";
        } else if (errorMsg.includes("429")) {
            errorMsg = "Rate limited. Wait a moment and try again.";
        } else if (errorMsg.includes("Network")) {
            errorMsg = "Network error. Check your connection.";
        }
        
        addAIMessage(`⚠️ AI Error: ${errorMsg}. Try Local AI mode or check your API key.`, true);
    }
}

// --- 9. UI & UTILS ---
function updateStatsUI() {
    const titleEl = document.getElementById('lvl-text');
    const xpEl = document.getElementById('xp-text');
    const barEl = document.getElementById('xp-bar');
    
    if(titleEl) titleEl.innerText = `LVL. ${userStats.level} ${userStats.title.toUpperCase()}`;
    if(xpEl) xpEl.innerText = `XP: ${userStats.xp.toLocaleString()}`;
    
    const progress = (userStats.xp % 1000) / 10; 
    if(barEl) barEl.style.width = `${progress}%`;
}

function switchRoom(roomId) {
    currentRoom = roomId;
    const roomTitle = document.getElementById('room-title');
    if(roomTitle) roomTitle.innerText = roomId.toUpperCase().replace('_', ' ');
    addSystemMessage(`Switched to sector [${roomId.toUpperCase()}]`);
}

const chatInput = document.getElementById('chatInput');
if(chatInput) {
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });
}

function handleSend() {
    const input = document.getElementById('chatInput');
    if(!input) return;
    
    const txt = input.value.trim();
    if(!txt || txt.length === 0) {
        return; // Silently ignore empty messages
    }
    
    if(txt.length > 500) {
        addSystemMessage("⚠️ Message too long (max 500 chars)");
        return;
    }
    
    // Clear input immediately for better UX
    input.value = '';
    input.focus(); // Keep focus on input for better UX
    input.dispatchEvent(new Event('input', { bubbles: true }));
    
    processCommand(txt);
}

// --- 10. COMMAND PROCESSING ---
function processCommand(txt) {
    const lower = txt.toLowerCase();

    // HELP COMMAND
    if (lower === '/help' || lower === 'help' || lower === '?') {
        const helpText = `
📚 AVAILABLE COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
/ai <question>    - Ask AI assistant
/help or ?        - Show this help
/play music       - Play background music
/stop music       - Stop music
/open panel       - Open workshop panel
/hands on/off     - Toggle AI (admin)

💡 TIPS:
- Use /ai for advanced responses
- Normal text broadcasts to chat
- Check boot menu for AI setup
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        addSystemMessage(helpText);
        return;
    }

    // ADMIN ROOT COMMANDS
    if (adminMode) {
        // Toggle AI hands
        if (lower.includes('hands off') || lower.includes('/ai hands')) {
            handsOff = true;
            addUserMessage(txt);
            addSystemMessage("⚠ SYSTEM: AI Hands disengaged by Administrator.");
            return;
        }
        if (lower.includes('hands on') || lower.includes('/ai hands')) {
            handsOff = false;
            addUserMessage(txt);
            addSystemMessage("✓ SYSTEM: AI Hands re-engaged.");
            return;
        }

        // Admin-only: change background color via natural language
        const bgMatch = txt.match(/change background(?: color)?(?: to)?\s*(#?[0-9A-Za-z]+)/i);
        if (bgMatch) {
            const color = bgMatch[1];
            currentMatrixColor = color.startsWith('#') ? color : color;
            try {
                // Update CSS var (if used) and re-init matrix
                try { document.documentElement.style.setProperty('--matrix-color', currentMatrixColor); } catch(e){}
                initMatrix(currentMatrixColor);
                addUserMessage(txt);
                addSystemMessage(`✅ SYSTEM: Background changed to ${currentMatrixColor} by Architect.`);
            } catch (e) {
                addSystemMessage(`⚠ SYSTEM: Failed to change background: ${e.message}`);
            }
            return;
        }

        // Admin-only: apply JS code directly (use with caution)
        if (txt.startsWith('/applyjs ')) {
            const code = txt.replace('/applyjs ', '');
            try {
                eval(code);
                addUserMessage(txt);
                addSystemMessage('✅ SYSTEM: Applied JavaScript code (Architect).');
            } catch (e) {
                addSystemMessage('⚠ SYSTEM: Error applying code: ' + e.message);
            }
            return;
        }
    }

    // RESTRICTED COMMANDS (If Hands Off)
    if (handsOff) {
        if (lower.includes('play music') || lower.includes('play jazz') || lower === 'music') {
            addUserMessage(txt);
            addAIMessage("❌ PERMISSION DENIED. Hands are disengaged.", true);
            return;
        }
    }

    // AI CHAT
    if (txt.startsWith('/ai') || txt.startsWith('/AI')) {
        const prompt = txt.replace(/^\/ai\s*/i, '').trim();
        if(!prompt) {
            addUserMessage(txt);
            addAIMessage("Usage: /ai <your question>\nExample: /ai What is the capital of France?", true);
            return;
        }
        addUserMessage(`/ai ${prompt}`);
        talkToClone(prompt);
        return;
    }

    // AGENTIC COMMANDS
    const audio = document.getElementById('bg-music');
    
    if (lower.includes('play music')) {
        addUserMessage(txt);
        if (audio) {
            audio.play().then(()=>addAIMessage("🎵 Playing...", true))
            .catch(e => addAIMessage("⚠ No audio file found (bg-music.mp3).", true));
        } else {
            addAIMessage("⚠ Audio player not found.", true);
        }
        return;
    }
    
    if (lower.includes('stop music')) {
        addUserMessage(txt);
        if (audio) {
            audio.pause();
            addAIMessage("⏹ Stopped.", true);
        }
        return;
    }
    
    if (lower.includes('open panel')) {
        addUserMessage(txt);
        addAIMessage("Accessing Workshop Panel... 🛠️", true);
        setTimeout(() => switchRoom('workshop'), 1000);
        return;
    }

    // STANDARD CHAT
    addUserMessage(txt);
    publishMessage(txt);
    addXP(10);
}

// --- 11. RENDERING ---
function addUserMessage(text) {
    const container = document.getElementById('chat-container');
    if(!container) return;
    
    const time = new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex flex-row-reverse items-end gap-3 animate-fade-in';
    msgDiv.innerHTML = `<div class="w-8 h-8 rounded-full bg-gradient-to-tr from-green-400 to-emerald-600 flex items-center justify-center border border-white/20 font-mono text-black text-xs font-bold flex-shrink-0">ME</div><div class="msg-user p-3 md:p-4 rounded-l-xl rounded-br-xl text-xs md:text-sm text-green-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)] max-w-[80%] break-words"><div class="flex items-center gap-2 mb-1 opacity-80 text-[10px] md:text-xs font-mono text-green-400"><span>@${username.toUpperCase()}</span><span>${time}</span></div><p class="leading-relaxed text-gray-100 break-words">${escapeHtml(text)}</p></div>`;
    container.appendChild(msgDiv);
    scrollToBottom();
}

function addAIMessage(text, isAction) {
    const container = document.getElementById('chat-container');
    if(!container) return;
    
    const cssClass = isAction ? 'border border-cyan-500/50 shadow-[0_0_15px_rgba(0,243,255,0.2)]' : 'border border-white/10';
    const msgDiv = document.createElement('div');
    msgDiv.className = 'flex flex-row items-start gap-3 animate-fade-in';
    msgDiv.innerHTML = `<div class="w-8 h-8 rounded-full bg-black border border-cyan-500 flex items-center justify-center text-cyan-400 font-mono text-[10px] flex-shrink-0">AI</div><div class="flex-1"><div class="p-3 md:p-4 rounded-r-xl rounded-bl-xl bg-black/40 ${cssClass} text-xs md:text-sm text-gray-200 backdrop-blur-sm break-words"><p class="leading-relaxed break-words">${text}</p></div></div>`;
    container.appendChild(msgDiv);
    scrollToBottom();
}

function addSystemMessage(text) {
    const container = document.getElementById('chat-container');
    if(!container) return;
    
    const msgDiv = document.createElement('div');
    msgDiv.className = 'msg-system p-3 md:p-4 rounded-xl text-xs md:text-sm text-cyan-100 shadow-[0_4px_20px_rgba(0,0,0,0.3)] animate-fade-in break-words';
    msgDiv.innerHTML = `<div class="flex items-center gap-2 mb-1 opacity-80 text-[10px] md:text-xs font-mono text-cyan-400"><span>⚠ SYSTEM</span></div><p class="leading-relaxed break-words">${text}</p>`;
    container.appendChild(msgDiv);
    scrollToBottom();
}

function scrollToBottom() {
    const c = document.getElementById('chat-container');
    if(c) c.scrollTop = c.scrollHeight;
}

function connectMQTT() {
    if (typeof mqtt === 'undefined') {
        console.warn("MQTT Library not loaded - using local mode");
        addSystemMessage("⚠️ MQTT offline - Chat is local only");
        return;
    }
    const clientId = "termos-" + Math.random().toString(16).substr(2, 8);
    
    // Fix: Correct connection options for mqtt.js with better fallbacks
    mqttClient = mqtt.connect(MQTT_BROKER_URL, { 
        clientId: clientId, 
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 2000,
        keepalive: 30,
        rejectUnauthorized: false,
    });

    mqttClient.on('connect', () => {
        console.log("✅ MQTT Connected");
        addSystemMessage("🌐 Connected to multiverse");
        mqttClient.subscribe('termchat/messages');
    });
    
    mqttClient.on('message', (topic, msg) => {
        try {
            const data = JSON.parse(msg.toString());
            if (data.user && data.user !== username) {
                const userName = String(data.user).substring(0,2).toUpperCase();
                const userMsg = escapeHtml(String(data.text || ""));
                const msgDiv = document.createElement('div');
                msgDiv.className = 'flex flex-row items-end gap-3 animate-fade-in opacity-80';
                msgDiv.innerHTML = `<div class="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-white/20 font-mono text-white text-xs">${userName}</div><div class="p-4 rounded-xl bg-slate-800/50 text-sm text-gray-300 max-w-[80%] border border-white/5"><div class="flex items-center gap-2 mb-1 opacity-70 text-xs font-mono text-gray-400"><span>@${String(data.user).toUpperCase()}</span></div><p class="leading-relaxed">${userMsg}</p></div>`;
                const container = document.getElementById('chat-container');
                if(container) {
                    container.appendChild(msgDiv);
                    scrollToBottom();
                }
            }
        } catch (e) { 
            console.error("MQTT message parse error:", e); 
        }
    });
    
    mqttClient.on('error', (err) => {
        console.warn("MQTT Error:", err);
        addSystemMessage("⚠️ Connection unstable - local mode active");
    });
    
    mqttClient.on('disconnect', () => {
        console.log("MQTT Disconnected");
    });
}

function publishMessage(text) {
    if (mqttClient && mqttClient.connected) {
        mqttClient.publish('termchat/messages', JSON.stringify({ user: username, text: text, room: currentRoom }));
    }
}

function startVoiceRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        alert("Voice module not supported by this browser");
        return;
    }
    const recognition = new webkitSpeechRecognition();
    recognition.lang = 'en-US';
    recognition.onresult = (e) => { 
        const input = document.getElementById('chatInput');
        if(input) input.value = e.results[0][0].transcript; 
        addSystemMessage("Voice input received."); 
    };
    recognition.start();
}

function addXP(amount) {
    userStats.xp += amount;
    if(userStats.xp > (userStats.level * 1000)) {
        userStats.level++;
        userStats.title = LEVELS[userStats.level] || 'GOD MODE';
        addSystemMessage(`LEVEL UP! You are now ${userStats.title}`);
    }
    updateStatsUI();
    localStorage.setItem('termos_stats', JSON.stringify(userStats));
}

function loadStats() {
    const saved = localStorage.getItem('termos_stats');
    if(saved) userStats = JSON.parse(saved);
}

function escapeHtml(text) {
    if(!text) return "";
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// --- 12. MATRIX ANIMATION (FIXED COLOR LOGIC) ---
function initMatrix(overrideColor = '#0F0') {
    const c = document.getElementById('matrix-canvas');
    if(!c) return;
    const ctx = c.getContext('2d');
    c.width = window.innerWidth; 
    c.height = window.innerHeight;
    
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%^&*';
    const fontSize = 14;
    const columns = c.width / fontSize;
    const drops = Array(Math.floor(columns)).fill(1);

    // Clear previous interval if exists
    if (window.matrixInterval) clearInterval(window.matrixInterval);

    // FIX: Respect the overrideColor variable
    const rainColor = overrideColor; 

    function draw() {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = fontSize + 'px monospace';
        
        for(let i=0; i<drops.length; i++) {
            const text = letters[Math.floor(Math.random()*letters.length)];
            
            // Logic: Mostly use the configured color, occasionally glitch
            if(Math.random() > 0.98) {
                ctx.fillStyle = '#ffffff'; // White glitch
            } else {
                ctx.fillStyle = rainColor; 
            }

            ctx.fillText(text, i*fontSize, drops[i]*fontSize);

            if(drops[i]*fontSize > c.height && Math.random() > 0.975) drops[i] = 0;
            drops[i]++;
        }
    }
    
    window.matrixInterval = setInterval(draw, 33);
    window.addEventListener('resize', () => { 
        c.width = window.innerWidth; 
        c.height = window.innerHeight; 
    });
}
