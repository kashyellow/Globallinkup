#!/usr/bin/env bash

BRANCH=$(git branch --show-current)

if [ "$BRANCH" != "main" ]; then
  echo "❌ Deploy dibatalkan: hanya branch main yang boleh deploy."
  exit 1
fi

# vercel --prod
