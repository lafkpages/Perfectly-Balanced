#!/bin/bash

echo -n "https://replit-database-viewer.luisafk.repl.co/?url="
base64 -w 0 - <<< "$REPLIT_DB_URL"
echo ""
