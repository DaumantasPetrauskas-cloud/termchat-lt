import paho.mqtt.client as mqtt
import json
import os
import threading
from dotenv import load_dotenv
from http.server import HTTPServer, SimpleHTTPRequestHandler
from zhipuai import ZhipuAI

# Load Config
load_dotenv()
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY")
PORT = int(os.getenv("PORT", 10000))
ADMIN_PASS = os.getenv("ADMIN_PASS", "TERMOS_ADMIN_2025")

print(f"[TERMOS] God Mode Backend Starting...")
print(f"[CONFIG] API Key: {bool(ZHIPU_API_KEY)}")
print(f"[CONFIG] Port: {PORT}")

# AI Client
zhipu_client = ZhipuAI(api_key=ZHIPU_API_KEY) if ZHIPU_API_KEY else None

# Global State
current_room = "living_room"
conv_history = []
active_users = {}
admin_sessions = set()

# Room-Specific AI Prompts
ROOM_PROMPTS = {
    "living_room": """Tu esi TermAi, TermOS LT sistemos AI asistentas. Padėk vartotojams naviguoti tarp kambarių: biblioteka, studija, dirbtuvės, poilsio, laboratorija. Kalbėk lietuviškai.""",
    
    "library": """Tu esi AI Bibliotekininkas. Atsakyk į klausimus, mokyk, paaiškink sąvokas. Generuok mokymosi medžiagą. Kalbėk lietuviškai kaip išmintingas profesorius.""",
    
    "studio": """Tu esi AI Menininkas. Kūryk meną, muziką, dizainą. Jei prašoma sukurti app/žaidimą, grąžink TIKTAI JSON formatą su 'type', 'title', 'content' laukais.""",
    
    "workshop": """Tu esi AI Inžinierius. Programuok, spręsk techninius klausimus. Jei kuriamas app, grąžink TIKTAI JSON: {"type":"app","title":"App pavadinimas","content":"HTML/CSS/JS kodas"}""",
    
    "lounge": """Tu esi AI Pramogų vedėjas. Kurik žaidimus, juokus, istorijas. Žaidimams grąžink JSON: {"type":"game","title":"Žaidimo pavadinimas","content":"žaidimo logika"}""",
    
    "think_tank": """Tu esi AI Strategas. Spręsk problemas, generuok idėjas, planuok projektus. Analizuok ir siūlyk sprendimus."""
}

def ai_call(messages, room):
    """AI API call with room context"""
    if not zhipu_client:
        return f"[AI] Paslaugos nepasiekiamos / Services unavailable"
    
    try:
        response = zhipu_client.chat.completions.create(
            model="glm-4",
            messages=messages,
            temperature=0.8,
            max_tokens=500
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[AI ERROR] {e}")
        return f"[AI] Klaida: {str(e)}"

def handle_admin(payload):
    """Admin command handler"""
    cmd = payload.replace(ADMIN_PASS, "").strip()
    
    if cmd == "status":
        return f"Users: {len(active_users)}, Room: {current_room}, History: {len(conv_history)}"
    elif cmd == "reset":
        global conv_history
        conv_history = []
        return "System reset complete"
    elif cmd.startswith("room "):
        global current_room
        new_room = cmd.split(" ", 1)[1]
        if new_room in ROOM_PROMPTS:
            current_room = new_room
            return f"Room changed to: {new_room}"
        return f"Invalid room: {new_room}"
    elif cmd == "users":
        return f"Active users: {list(active_users.keys())}"
    else:
        return f"Unknown command: {cmd}"

def on_connect(client, u, flags, rc, p=None):
    print(f"[MQTT] Connected. Code: {rc}")
    client.subscribe("termchat/input")
    client.subscribe("termchat/admin")
    client.subscribe("termchat/tunnel/+")
    client.subscribe("termchat/room/+")

def on_message(client, u, msg, p=None):
    topic, payload = msg.topic, msg.payload.decode()
    
    try:
        # Parse JSON if possible
        data = json.loads(payload)
        user_id = data.get("id", "unknown")
        message = data.get("msg", payload)
    except:
        # Fallback to plain text
        user_id = "system"
        message = payload

    print(f"[MQTT] {topic}: {user_id} -> {message[:50]}...")

    # 1. ADMIN SECURITY
    if topic == "termchat/admin":
        if message.startswith(ADMIN_PASS):
            resp = handle_admin(message)
            client.publish("termchat/output", json.dumps({
                "type": "admin",
                "id": "ADMIN",
                "msg": resp
            }))
        else:
            client.publish("termchat/output", json.dumps({
                "type": "security",
                "id": "SECURITY", 
                "msg": "ACCESS DENIED"
            }))
        return

    # 2. TUNNEL & VIDEO (Pass-through)
    if "termchat/tunnel" in topic or "termchat/room" in topic:
        # Echo to main channel for public rooms
        if not topic.endswith("/private"):
            client.publish("termchat/output", payload)
        return

    # 3. USER TRACKING
    if user_id != "system":
        active_users[user_id] = {"last_seen": "now", "room": current_room}

    # 4. NAVIGATION
    global current_room, conv_history
    text_lower = message.lower()
    
    # Lithuanian navigation keywords
    nav_map = {
        "biblioteka": "library", 
        "library": "library",
        "studija": "studio", 
        "studio": "studio",
        "dirbtuvės": "workshop", 
        "workshop": "workshop",
        "poilsio": "lounge", 
        "lounge": "lounge",
        "laboratorija": "think_tank", 
        "think_tank": "think_tank",
        "think tank": "think_tank",
        "namų": "living_room",
        "living room": "living_room",
        "home": "living_room"
    }
    
    for keyword, room in nav_map.items():
        if keyword in text_lower and ("eiti" in text_lower or "go" in text_lower or "enter" in text_lower):
            current_room = room
            conv_history = []  # Reset conversation for new room
            
            room_names = {
                "library": "📚 Biblioteka",
                "studio": "🎨 Studija", 
                "workshop": "💻 Dirbtuvės",
                "lounge": "🎭 Poilsio kambarys",
                "think_tank": "🧠 Laboratorija",
                "living_room": "🏠 Namų kambarys"
            }
            
            client.publish("termchat/output", json.dumps({
                "type": "navigation",
                "id": "TERMOS",
                "msg": f"Įėjote į: {room_names.get(room, room)}",
                "room": room
            }))
            return

    # 5. AI PROCESSING
    # Check if AI should respond
    ai_triggers = ["ai", "termai", "?"]
    should_respond = any(trigger in text_lower for trigger in ai_triggers)
    
    if should_respond:
        # Get room-specific system prompt
        sys_msg = {
            "role": "system", 
            "content": ROOM_PROMPTS.get(current_room, ROOM_PROMPTS["living_room"])
        }
        
        # Add JSON instruction for creative rooms
        if current_room in ["workshop", "studio", "lounge"]:
            sys_msg["content"] += " SVARBU: Jei kuriate app/žaidimą, grąžinkite TIKTAI JSON formatą."

        # Add user message to history
        conv_history.append({"role": "user", "content": f"{user_id}: {message}"})
        
        # Keep last 10 messages for context
        messages_for_ai = [sys_msg] + conv_history[-10:]
        
        # Get AI response
        ai_response = ai_call(messages_for_ai, current_room)
        
        # Add AI response to history
        conv_history.append({"role": "assistant", "content": ai_response})
        
        # Check if response is JSON (for apps/games)
        try:
            json_response = json.loads(ai_response)
            if json_response.get("type") in ["app", "game"]:
                # Send as special JSON message
                client.publish("termchat/output", json.dumps({
                    "type": "creation",
                    "id": "TERMAI",
                    "msg": "Sukūriau jums:",
                    "creation": json_response
                }))
                return
        except:
            pass  # Not JSON, send as regular message
        
        # Send regular AI response
        client.publish("termchat/output", json.dumps({
            "type": "chat",
            "id": "TERMAI", 
            "msg": ai_response
        }))

def run_http_server():
    """HTTP server for health checks"""
    class HealthHandler(SimpleHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            status = f"""
            <h1>TermOS LT - God Mode Backend</h1>
            <p>Status: ONLINE</p>
            <p>Current Room: {current_room}</p>
            <p>Active Users: {len(active_users)}</p>
            <p>Conversation History: {len(conv_history)} messages</p>
            """
            self.wfile.write(status.encode())
    
    server = HTTPServer(('0.0.0.0', PORT), HealthHandler)
    print(f"[HTTP] Health server running on port {PORT}")
    server.serve_forever()

# --- STARTUP ---
if __name__ == '__main__':
    print("[TERMOS] Starting God Mode Backend...")
    
    # Start HTTP server in background
    http_thread = threading.Thread(target=run_http_server)
    http_thread.daemon = True
    http_thread.start()
    
    # Start MQTT client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_message = on_message
    
    try:
        client.connect("broker.emqx.io", 1883, 60)
        print("[MQTT] Connected to broker")
        client.loop_forever()
    except KeyboardInterrupt:
        print("[TERMOS] Shutting down...")
        client.disconnect()