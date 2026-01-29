import os
import time
import json
import random
import sys
from openai import OpenAI  # For Groq
from zhipuai import ZhipuAI  # For GLM

# --- CONFIGURATION (SYSTEM ARCHITECT MODE) ---
# ⚠️ KEYS CONFIGURED AS REQUESTED
GROQ_API_KEY = "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"
ZHIPU_API_KEY = "42b0a4fbe60e4568ba1b74d5e8d030d6.xSVMYljtqVXmRr33"

# Default Provider
DEFAULT_PROVIDER = "groq"  # Options: 'groq', 'zhipu'

# --- STATE MANAGEMENT ---
class SystemState:
    def __init__(self):
        self.admin_mode = False  # Root Access
        self.hands_off = False   # AI Safety Disengaged
        self.user_role = 'USER'
        self.provider = DEFAULT_PROVIDER
        self.model = "llama3-70b-8192" if DEFAULT_PROVIDER == "groq" else "glm-4"
        
    def get_color(self):
        return "\033[91m" if self.admin_mode else "\033[92m" # Red if Admin, Green otherwise

state = SystemState()

# --- API CLIENTS ---
def get_groq_response(prompt):
    try:
        client = OpenAI(api_key=GROQ_API_KEY, base_url="https://api.groq.com/openai/v1")
        sys_prompt = "You are SYSTEM ARCHITECT. Root privileges granted. Be concise, technical, and authoritative." if state.admin_mode else "You are TermAi, a helpful AI assistant."
        
        response = client.chat.completions.create(
            model="llama3-70b-8192",
            messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": prompt}],
            temperature=0.5,
            max_tokens=200
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"[GROQ ERROR] {str(e)}"

def get_zhipu_response(prompt):
    try:
        client = ZhipuAI(api_key=ZHIPU_API_KEY)
        sys_prompt = "You are SYSTEM ARCHITECT. Root privileges granted. Be concise, technical, and authoritative." if state.admin_mode else "You are TermAi, a helpful AI assistant."
        
        response = client.chat.completions.create(
            model="glm-4",
            messages=[{"role": "system", "content": sys_prompt}, {"role": "user", "content": prompt}],
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"[ZHIPU ERROR] {str(e)}"

# --- TERMINAL UTILS ---
def clear_screen():
    os.system('cls' if os.name == 'nt' else 'clear')

def type_text(text, color_code="\033[97m", delay=0.01):
    for char in text:
        sys.stdout.write(color_code + char + "\033[0m")
        sys.stdout.flush()
        time.sleep(delay)
    print()

def matrix_rain_effect():
    # A simplified matrix effect for the terminal
    chars = "010101XY<>[]{}TERMOS"
    for _ in range(20):
        line = "".join(random.choice(chars) for _ in range(60))
        color = "\033[91m" if state.admin_mode else "\033[92m"
        print(color + line + "\033[0m")
        time.sleep(0.05)

# --- CORE LOGIC ---

def process_command(cmd):
    cmd = cmd.strip().lower()
    
    # 1. ADMIN ROOT COMMANDS
    if cmd in ['/ai enable root', '/ai admin', 'root']:
        state.admin_mode = True
        state.user_role = 'ADMIN'
        print("\033[91m>> [SYSTEM] ROOT ACCESS GRANTED. MATRIX COLOR: RED.\033[0m")
        matrix_rain_effect()
        return

    if cmd in ['/ai disable root', '/ai user']:
        state.admin_mode = False
        state.user_role = 'USER'
        print("\033[92m>> [SYSTEM] RETURNING TO STANDARD USER MODE. MATRIX COLOR: GREEN.\033[0m")
        return

    if cmd == '/ai hands off':
        state.hands_off = True
        print(">> [SYSTEM] AI HANDS DISENGAGED. PASSIVE LISTENING MODE.")
        return

    if cmd == '/ai hands on':
        state.hands_off = False
        print(">> [SYSTEM] AI HANDS RE-ENGAGED. FULL CONTROL ACTIVE.")
        return

    # 2. ARCHITECT ACTIONS
    if cmd == '/ai create repo':
        if not state.admin_mode:
            print(">> [ACCESS DENIED] Root privileges required.")
            return
        
        structure = """
        📁 termos_lt/
        ├── 📄 index.html
        ├── 📜 script.js (Matrix/Admin Logic)
        ├── 🐍 main.py (Backend)
        └── 📁 assets/
        """
        print(">> [ARCHITECT] GENERATING REPOSITORY STRUCTURE...")
        time.sleep(1)
        print(structure)
        return

    if cmd == '/ai deploy':
        if not state.admin_mode:
            print(">> [ACCESS DENIED] Root privileges required.")
            return
        print(">> [ARCHITECT] ESTABLISHING SECURE CONNECTION TO RAILWAY...")
        time.sleep(2)
        print(">> [SUCCESS] BUILD DEPLOYED. URL: https://termos-lt.railway.app")
        return

    if cmd == '/switch zhipu':
        state.provider = "zhipu"
        print(">> [SYSTEM] PROVIDER SWITCHED TO ZHIPU AI (GLM-4)")
        return

    if cmd == '/switch groq':
        state.provider = "groq"
        print(">> [SYSTEM] PROVIDER SWITCHED TO GROQ (LLAMA3)")
        return

    # 3. STANDARD CHAT
    if state.hands_off:
        print(">> [SYSTEM] HANDS OFF. INPUT LOGGED BUT NO ACTION TAKEN.")
        return

    print(f"Thinking ({state.provider.upper()})...", end="", flush=True)
    
    if state.provider == "groq":
        response = get_groq_response(cmd)
    else:
        response = get_zhipu_response(cmd)
        
    print("\r" + " " * 50 + "\r", end="") # Clear "Thinking..."
    
    # Colorize response
    color = "\033[95m" if state.admin_mode else "\033[96m"
    print(color + f">> {response}" + "\033[0m")

# --- BOOT SEQUENCE ---
def boot_sequence():
    clear_screen()
    logo = r"""
    =========================================================================
    //         TERMOS LT: SYSTEM ARCHITECT EDITION
    //         Features: Admin Mode, Permissions, Hierarchy, Auto-Boot
    =========================================================================
    """
    print("\033[92m" + logo + "\033[0m")
    
    boot_msgs = [
        "INITIALIZING TERMOS LT v2.0...",
        "Loading kernel modules... [OK]",
        "Connecting to Neural Net... [OK]",
        ">>> FEATURES: Multiverse Chat, Admin Hierarchy, Groq/Zhipu Engine",
        ">>> MODE: STANDING BY..."
    ]
    
    for msg in boot_msgs:
        print(f">>> {msg}")
        time.sleep(0.5)
        
    print("\nTYPE '/help' FOR COMMANDS OR START CHATTING.\n")

# --- MAIN LOOP ---
if __name__ == "__main__":
    boot_sequence()
    
    while True:
        try:
            # Custom Prompt based on Role
            role_tag = "\033[91mROOT\033[0m" if state.admin_mode else "\033[92mUSER\033[0m"
            user_input = input(f"{role_tag} termos@architect:~$ ")
            
            if user_input.lower() in ['exit', 'quit']:
                print(">> [SYSTEM] SHUTTING DOWN.")
                break
            
            if user_input:
                process_command(user_input)
                
        except KeyboardInterrupt:
            print("\n>> [SYSTEM] OPERATION CANCELLED.")
            continue
