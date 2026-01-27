#!/bin/bash
cd /workspaces/termchat-lt

# Set git user if not already set
git config user.email "automation@github.com" || true
git config user.name "GitHub Automation" || true

# Commit the staged changes
git commit -F .git_commit_msg.txt

# Push to origin main
git push -u origin main

echo "✅ Deployment complete!"
git log --oneline -1
