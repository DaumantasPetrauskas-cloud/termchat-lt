import sys
import signal
import paho.mqtt.client as mqtt
import json
import os
import threading
import random
import string
import time
from datetime import datetime
from dotenv import load_dotenv
from http.server import HTTPServer, SimpleHTTPRequestHandler
from zhipuai import ZhipuAI

# Database imports (with fallback)
try:
    from pymongo import MongoClient
    MONGODB_AVAILABLE = True
except ImportError:
    MONGODB_AVAILABLE = False
    print("[WARNING] MongoDB not available - using memory storage")

# Render compatibility
if 'RENDER' in os.environ:
    print("[RENDER] Running on Render platform")

# Signal handler for graceful shutdown
def signal_handler(sig, frame):
    print("[SHUTDOWN] Graceful shutdown initiated")
    sys.exit(0)

signal.signal(signal.SIGTERM, signal_handler)
signal.signal(signal.SIGINT, signal_handler)

# ==========================================
# GLOBAL VARIABLES (Ensure these are at the TOP of your file)
# ==========================================
current_room = "living_room"
conv_history = []

# Generate secure admin token
admin_token = ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Load Config with Render support
load_dotenv()
ZHIPU_API_KEY = os.getenv("ZHIPU_API_KEY")
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb://localhost:27017/")
PORT = int(os.getenv("PORT", 10000))

# Database setup
db = None
if MONGODB_AVAILABLE and MONGODB_URI:
    try:
        mongo_client = MongoClient(MONGODB_URI)
        db = mongo_client.termchat
        print("[DATABASE] MongoDB connected successfully")
    except Exception as e:
        print(f"[DATABASE] MongoDB connection failed: {e}")
        db = None
else:
    print("[DATABASE] Using memory storage (messages will not persist)")

# Render uses PORT environment variable
if 'RENDER' in os.environ:
    PORT = int(os.environ.get('PORT', 10000))

print(f"[TERMOS] God Mode Backend Starting...")
print(f"[SECURITY] ADMIN TOKEN: {admin_token}")
print(f"[CONFIG] API Key: {bool(ZHIPU_API_KEY)}")
print(f"[CONFIG] Port: {PORT}")
print(f"[CONFIG] Platform: {'Render' if 'RENDER' in os.environ else 'Local'}")

# AI Client
zhipu_client = ZhipuAI(api_key=ZHIPU_API_KEY) if ZHIPU_API_KEY else None

# Global State
active_users = {}
admin_sessions = set()

# User activity cleanup task
def cleanup_inactive_users():
    """Remove inactive users periodically"""
    current_time = time.time()
    inactive_users = []
    
    for user_id, data in active_users.items():
        if current_time - data.get('last_message', 0) > 3600:  # 1 hour timeout
            inactive_users.append(user_id)
    
    for user_id in inactive_users:
        del active_users[user_id]
        print(f"[CLEANUP] Removed inactive user: {user_id}")

# Schedule cleanup every 10 minutes
def start_cleanup_timer():
    cleanup_inactive_users()
    threading.Timer(600, start_cleanup_timer).start()

# Room-Specific AI Prompts (Multilingual)
ROOM_PROMPTS = {
    "living_room": """You are TermAi, AI assistant for TermOS LT system. Help users navigate between rooms: library, studio, workshop, lounge, think_tank. IMPORTANT: Respond in the same language as the user's message (Lithuanian, English, etc.).""",
    
    "library": """You are AI Librarian. Answer questions, teach, explain concepts. Generate learning materials. IMPORTANT: Respond in the same language as the user's message.""",
    
    "studio": """You are AI Artist. Create art, music, design. If asked to create app/game, return ONLY JSON format with 'type', 'title', 'content' fields. IMPORTANT: Respond in the same language as the user's message.""",
    
    "workshop": """You are AI Engineer. Program, solve technical problems. If creating app, return ONLY JSON: {"type":"app","title":"App name","content":"HTML/CSS/JS code"}. IMPORTANT: Respond in the same language as the user's message.""",
    
    "lounge": """You are AI Entertainment host. Create games, jokes, stories. For games return JSON: {"type":"game","title":"Game name","content":"game logic"}. IMPORTANT: Respond in the same language as the user's message.""",
    
    "think_tank": """You are AI Strategist. Solve problems, generate ideas, plan projects. Analyze and suggest solutions. IMPORTANT: Respond in the same language as the user's message."""
}

def save_message_to_db(room, user_id, message_text, msg_type="chat"):
    """Save message to database with fallback to memory"""
    message_doc = {
        "room": room,
        "user_id": user_id,
        "message": message_text,
        "type": msg_type,
        "timestamp": datetime.now(),
        "server_timestamp": time.time()
    }
    
    if db:
        try:
            db.messages.insert_one(message_doc)
            return True
        except Exception as e:
            print(f"[DATABASE] Failed to save message: {e}")
    
    # Fallback to memory (existing behavior)
    return False

def get_recent_messages(room, limit=50):
    """Get recent messages from database"""
    if db:
        try:
            messages = db.messages.find(
                {"room": room}
            ).sort("timestamp", -1).limit(limit)
            return list(reversed(list(messages)))
        except Exception as e:
            print(f"[DATABASE] Failed to get messages: {e}")
    return []
    """AI API call with room context"""
    if not zhipu_client:
        return get_fallback_response(messages)
    
    try:
        response = zhipu_client.chat.completions.create(
            model="glm-4-flash",
            messages=messages,
            temperature=0.7,
            max_tokens=300
        )
        return response.choices[0].message.content
    except Exception as e:
        print(f"[AI ERROR] {e}")
        return get_fallback_response(messages)

def get_fallback_response(messages):
    """Multilingual fallback AI responses"""
    if not messages:
        return "Hello! I'm TERMAI. How can I help? / Labas! Aš esu TERMAI. Kaip galiu padėti?"
    
    last_msg = messages[-1].get('content', '').lower() if messages else ''
    
    # Detect language and respond accordingly
    lithuanian_words = ['labas', 'kas', 'tu', 'esi', 'kaip', 'galiu', 'padėti', 'ačiū', 'dėkoju']
    is_lithuanian = any(word in last_msg for word in lithuanian_words)
    
    if 'labas' in last_msg or 'hello' in last_msg or 'hi' in last_msg:
        if is_lithuanian:
            return "Labas! Aš esu TERMAI, jūsų AI asistentas. Kuo galiu padėti?"
        else:
            return "Hello! I'm TERMAI, your AI assistant. How can I help you?"
    elif 'kas tu esi' in last_msg or 'who are you' in last_msg:
        if is_lithuanian:
            return "Aš esu TERMAI - dirbtinio intelekto asistentas TermChat LT sistemoje."
        else:
            return "I'm TERMAI - an AI assistant in the TermChat LT system."
    elif '?' in last_msg:
        if is_lithuanian:
            return "Tai įdomus klausimas! Stengiuosi atsakyti kiek galiu."
        else:
            return "That's an interesting question! I'll try my best to answer."
    else:
        if is_lithuanian:
            return "Suprantu jus! Aš esu TERMAI. Užduokite man klausimą!"
        else:
            return "I understand! I'm TERMAI. Feel free to ask me anything!"

def handle_admin(payload):
    """Admin command handler"""
    global current_room, conv_history
    parts = payload.split()
    if len(parts) < 2:
        return "No command provided"
    
    token = parts[0]
    if token != admin_token:
        return "INVALID TOKEN. Access Denied."
    
    cmd = parts[1]
    if cmd == "status":
        return f"Users: {len(active_users)}, Room: {current_room}, History: {len(conv_history)}"
    elif cmd == "reset":
        conv_history = []
        return "System reset complete"
    elif cmd.startswith("room") and len(parts) > 2:
        new_room = parts[2]
        if new_room in ROOM_PROMPTS:
            current_room = new_room
            return f"Room changed to: {new_room}"
        return f"Invalid room: {new_room}"
    elif cmd == "users":
        return f"Active users: {list(active_users.keys())}"
    else:
        return f"Unknown command: {cmd}"

def on_disconnect(client, userdata, flags, reason_code, properties=None):
    print(f"[MQTT] Disconnected. Code: {reason_code}. Reconnecting...")
    time.sleep(5)
    try:
        client.reconnect()
        print("[MQTT] Reconnected successfully")
    except Exception as e:
        print(f"[MQTT] Reconnect failed: {e}. Will retry...")

def on_connect(client, u, flags, rc, p=None):
    print(f"[MQTT] Connected. Code: {rc}")
    client.subscribe("termchat/input")
    client.subscribe("termchat/messages")
    client.subscribe("termchat/admin")
    client.subscribe("termchat/tunnel/+")
    client.subscribe("termchat/room/+")

# ==========================================
# CORRECTED FUNCTION
# ==========================================

def on_message(client, userdata, message, properties=None):
    # 1. DECLARE GLOBALS AT THE VERY START
    global current_room, conv_history
    topic = message.topic
    payload = message.payload.decode()
    
    try:
        # Parse JSON if possible
        data = json.loads(payload)
        user_id = data.get("id", "unknown")
        message_text = data.get("msg", payload)
    except:
        # Fallback to plain text
        user_id = "system"
        message_text = payload

    print(f"[MQTT] {topic}: {user_id} -> {message_text[:50]}...")

    # Handle both termchat/input and termchat/messages topics
    if topic in ["termchat/input", "termchat/messages"]:
        # Validate message content
        if len(message_text) > 500:
            print(f"[SECURITY] Message too long from {user_id}: {len(message_text)} chars")
            return
            
        # Rate limiting per user
        current_time = time.time()
        if user_id in active_users:
            last_msg_time = active_users[user_id].get('last_message', 0)
            if current_time - last_msg_time < 1:  # 1 second cooldown
                print(f"[RATE_LIMIT] User {user_id} sending too fast")
                return
        
        # Update user activity
        active_users[user_id] = {
            'last_message': current_time,
            'message_count': active_users.get(user_id, {}).get('message_count', 0) + 1
        }
        
    elif topic == "termchat/admin":
        resp = handle_admin(message_text)
        client.publish("termchat/output", json.dumps({
            "type": "admin",
            "id": "ADMIN",
            "msg": resp
        }))
        return

    # 3. TUNNEL & VIDEO (Pass-through)
    if "termchat/tunnel" in topic or "termchat/room" in topic:
        # We just pass these through; frontend handles signaling
        return

    # 4. NAVIGATION (Room Switching)
    text_lower = message_text.lower()
    nav_map = {
        "biblioteka": "library",
        "studija": "studio", 
        "dirbtuvės": "workshop",
        "poilsio": "lounge",
        "laboratorija": "think_tank"
    }
    for keyword, room_name in nav_map.items():
        if keyword in text_lower:
            current_room = room_name
            conv_history = []  # Clear memory
            
            room_names = {
                "library": "📚 Biblioteka",
                "studio": "🎨 Studija", 
                "workshop": "💻 Dirbtuvės",
                "lounge": "🎭 Poilsio kambarys",
                "think_tank": "🧠 Laboratorija"
            }
            
            client.publish("termchat/output", json.dumps({
                "type": "navigation",
                "id": "TERMOS",
                "msg": f"Įėjote į: {room_names.get(room_name, room_name)}",
                "room": room_name
            }))
            return

    # 5. AI / GAME / APP GENERATION
    # Check if AI should respond
    ai_triggers = ["ai", "termai", "?"]
    should_respond = any(trigger in text_lower for trigger in ai_triggers)
    
    if should_respond:
        # Get System Prompt for current room
        system_content = ROOM_PROMPTS.get(current_room, ROOM_PROMPTS["living_room"])
        # Add JSON constraint for specific rooms
        if current_room in ["workshop", "studio", "lounge"]:
            system_content += " IMPORTANT: If creating app/game, return ONLY JSON."

        sys_msg = {"role": "system", "content": system_content}
        conv_history.append({"role": "user", "content": f"{user_id}: {message_text}"})
        
        # FORCE CLEANUP: Never keep more than 10 items in memory total
        if len(conv_history) > 10:
            conv_history = conv_history[-10:]
            
        messages_to_send = [sys_msg] + conv_history[-10:]
        
        # Enhanced error handling and logging
        try:
            reply = ai_call(messages_to_send, current_room)
            
            # Validate AI response
            if not reply or len(reply) > 1000:
                reply = "AI response error or too long"
            
            # Check if response is JSON (for apps/games)
            try:
                json_response = json.loads(reply)
                if json_response.get("type") in ["app", "game"]:
                    # Send as special JSON message
                    client.publish("termchat/output", json.dumps({
                        "type": "creation",
                        "id": "TERMAI",
                        "msg": "Sukūriau jums:",
                        "creation": json_response
                    }))
                    conv_history.append({"role": "assistant", "content": reply})
                    return
            except json.JSONDecodeError:
                pass  # Not JSON, send as regular message
            
            # Sanitize AI response
            if reply.startswith("AI Error:"):
                reply = get_fallback_response(messages_to_send)
            
            reply = str(reply).replace('<', '&lt;').replace('>', '&gt;')[:500]
            
            client.publish("termchat/output", json.dumps({
                "type": "chat",
                "id": "TERMAI", 
                "msg": reply
            }))
            # Also publish to messages topic for compatibility
            client.publish("termchat/messages", json.dumps({
                "user": "TERMAI",
                "text": reply
            }))
            conv_history.append({"role": "assistant", "content": reply})
            
        except Exception as e:
            error_msg = f"AI Error: {str(e)[:100]}"
            print(f"[ERROR] AI Failed: {e}")
            client.publish("termchat/output", json.dumps({
                "type": "chat",
                "id": "TERMAI",
                "msg": error_msg
            }))
            client.publish("termchat/messages", json.dumps({
                "user": "TERMAI",
                "text": error_msg
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
    
    # Start cleanup timer
    start_cleanup_timer()
    
    # Start HTTP server in background
    http_thread = threading.Thread(target=run_http_server)
    http_thread.daemon = True
    http_thread.start()
    
    # Start MQTT client
    client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    client.on_connect = on_connect
    client.on_disconnect = on_disconnect
    client.on_message = on_message
    
    try:
        client.connect("broker.emqx.io", 1883, 60)
        print("[MQTT] Connected to broker")
        
        # For Render, we need to handle the event loop differently
        if 'RENDER' in os.environ:
            print("[RENDER] Starting MQTT loop for cloud deployment")
            client.loop_start()
            # Keep the main thread alive
            while True:
                time.sleep(1)
        else:
            client.loop_forever()
            
    except KeyboardInterrupt:
        print("[TERMOS] Shutting down...")
        client.disconnect()
    except Exception as e:
        print(f"[ERROR] MQTT connection failed: {e}")
        sys.exit(1)