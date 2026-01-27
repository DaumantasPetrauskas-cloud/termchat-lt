git commit -m "Fix: Multi-device typing and responsive design"
git push origin main#!/usr/bin/env python3
import subprocess
import os
import sys

os.chdir('/workspaces/termchat-lt')

print("🔧 Configuring Git...")
subprocess.run(['git', 'config', 'user.email', 'bot@github.com'], check=False)
subprocess.run(['git', 'config', 'user.name', 'TermChat Bot'], check=False)

print("📦 Showing staged files...")
result = subprocess.run(['git', 'diff', '--cached', '--name-only'], capture_output=True, text=True)
print(result.stdout)

print("📝 Creating commit...")
commit_msg = """Fix: Multi-device typing and responsive design improvements

- Added mobile viewport meta tags for iOS/notch support
- Fixed text wrapping and word-break for all devices  
- Added responsive padding and font sizing (mobile-first)
- Input font-size 16px to prevent mobile auto-zoom
- Safe area insets for devices with notches
- Touch action manipulation to prevent double-tap delay
- Improved message bubble rendering across all screen sizes
- Responsive button sizing and layout

Ready for deployment to GitHub Pages."""

try:
    result = subprocess.run(['git', 'commit', '-m', commit_msg], capture_output=True, text=True)
    print(result.stdout)
    print(result.stderr)
    
    print("\n✅ Commit successful!")
    print("\n📊 Latest commit:")
    result = subprocess.run(['git', 'log', '--oneline', '-1'], capture_output=True, text=True)
    print(result.stdout)
    
    print("\n🚀 Pushing to GitHub...")
    result = subprocess.run(['git', 'push', '-u', 'origin', 'main'], capture_output=True, text=True)
    print(result.stdout)
    print(result.stderr)
    
    print("\n✨ Deployment successful!")
    print("🌐 Live at: https://DaumantasPetrauskas-cloud.github.io/termchat-lt")
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
