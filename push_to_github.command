#!/bin/bash
clear
echo "============================================================"
echo "🚀 TRADE2OPTIONS — 1-Click GitHub Push"
echo "Repository: https://github.com/Trade2Optionss/Dalal-Street-AI"
echo "============================================================"
echo ""

# Locate project directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
if [ -d "$SCRIPT_DIR/final files of screener/.git" ]; then
    TARGET_DIR="$SCRIPT_DIR/final files of screener"
elif [ -d "$SCRIPT_DIR/.git" ]; then
    TARGET_DIR="$SCRIPT_DIR"
else
    echo "❌ Error: Could not locate git repository folder."
    read -p "Press Enter to exit..."
    exit 1
fi

cd "$TARGET_DIR"

echo "📁 Working directory: $(pwd)"
echo ""
echo "🔑 Please enter / paste your GitHub Personal Access Token (PAT):"
echo "   (Characters will be hidden for security)"
read -s -p "Token (ghp_...): " GITHUB_TOKEN
echo ""

if [ -z "$GITHUB_TOKEN" ]; then
    echo "❌ Token cannot be empty. Please run the script again."
    read -p "Press Enter to exit..."
    exit 1
fi

echo ""
echo "📦 1. Staging and verifying all latest changes..."
git add -A
git commit -m "feat: Trade2Options Dalal Street Indian Market Multi-Agent Intelligence Suite" 2>/dev/null || echo "Working tree already committed."

echo "🚀 2. Pushing to GitHub (Trade2Optionss/Dalal-Street-AI)..."
git push "https://Trade2Optionss:${GITHUB_TOKEN}@github.com/Trade2Optionss/Dalal-Street-AI.git" main --force

if [ $? -eq 0 ]; then
    echo ""
    echo "============================================================"
    echo "🎉 SUCCESS! All files uploaded to GitHub:"
    echo "   https://github.com/Trade2Optionss/Dalal-Street-AI"
    echo "============================================================"
else
    echo ""
    echo "❌ Push failed. Please verify that your token has 'repo' permissions."
fi

echo ""
read -p "Press [Enter] to close..."
