#!/bin/bash
set -e

cd /workspaces/termchat-lt

# Configure git user
git config user.email "bot@github.com"
git config user.name "TermChat Bot"

# Show what's staged
echo "📦 Staged changes:"
git diff --cached --name-only

# Commit
echo "📝 Committing changes..."
git commit -m "Fix: Multi-device typing and responsive design improvements

- Added mobile viewport meta tags for iOS/notch support
- Fixed text wrapping and word-break for all devices  
- Added responsive padding and font sizing (mobile-first)
- Input font-size 16px to prevent mobile auto-zoom
- Safe area insets for devices with notches
- Touch action manipulation to prevent double-tap delay
- Improved message bubble rendering across all screen sizes
- Responsive button sizing and layout

Ready for deployment to GitHub Pages."

# Show commit
echo ""
echo "✅ Commit created:"
git log --oneline -1
echo ""

# Push to origin
echo "🚀 Pushing to GitHub..."
git push origin main

echo ""
echo "✨ Deployment successful!"
echo "Live at: https://DaumantasPetrauskas-cloud.github.io/termchat-lt"
