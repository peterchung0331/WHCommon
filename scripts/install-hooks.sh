#!/bin/bash

# ============================================
# Git Hooks 설치 스크립트
# WHCommon/scripts의 Git Hook을 프로젝트에 설치
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GIT_ROOT="$(git rev-parse --show-toplevel)"
HOOKS_DIR="$GIT_ROOT/.git/hooks"

echo "${YELLOW}🔧 Installing Git Hooks...${NC}"
echo ""

# pre-commit hook 설치
if [ -f "$SCRIPT_DIR/pre-commit" ]; then
  ln -sf "$SCRIPT_DIR/pre-commit" "$HOOKS_DIR/pre-commit"
  chmod +x "$HOOKS_DIR/pre-commit"
  echo "${GREEN}✅ Installed pre-commit hook${NC}"
else
  echo "⚠️  Warning: pre-commit not found in $SCRIPT_DIR"
fi

# post-merge hook 설치
if [ -f "$SCRIPT_DIR/post-merge" ]; then
  ln -sf "$SCRIPT_DIR/post-merge" "$HOOKS_DIR/post-merge"
  chmod +x "$HOOKS_DIR/post-merge"
  echo "${GREEN}✅ Installed post-merge hook${NC}"
else
  echo "⚠️  Warning: post-merge not found in $SCRIPT_DIR"
fi

echo ""
echo "${GREEN}🎉 Git Hooks installation complete!${NC}"
echo ""
echo "Hooks installed:"
echo "  - pre-commit: Syncs .env.local to Doppler Development before commit"
echo "  - post-merge: Syncs Doppler Development to .env.local after pull"
