#!/bin/bash
echo "========================================"
echo "  STARTING TERMOS LT BUILD PROCESS"
echo "========================================"

# 1. Check Files
echo "[1/3] Checking Files..."
FILES=("index.html" "script.js" "style.css")
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then echo "   ✓ Found: $file"; else echo "   ✗ Missing: $file"; exit 1; fi
done

# 2. Prepare Distribution
echo "[2/3] Creating Distribution Folder..."
mkdir -p dist
cp index.html dist/
cp script.js dist/
cp style.css dist/

# 3. Done
echo "[3/3] Build Complete!"
echo "To run: python3 -m http.server 8000"
echo "Or open dist/index.html"
