#!/bin/bash
# Stop the ws-helper background process started by start.sh.
# This script will kill the PID recorded in ws-helper.pid (created by start.sh).
# If that PID no longer exists, it will remove the stale PID file.
# If the PID file is missing, it will attempt to kill any running ws-helper process.
cd "$(dirname "$0")"
if [ -f ws-helper.pid ]; then
  pid=$(cat ws-helper.pid)
  if kill -0 "$pid" 2>/dev/null; then
    echo "Stopping ws-helper (PID $pid)..."
    kill "$pid"
    rm -f ws-helper.pid
  else
    echo "Process $pid not running. Removing stale PID file."
    rm -f ws-helper.pid
  fi
else
  echo "PID file not found. Attempting to kill any ws-helper process..."
  pkill -f "node ws-helper.js" || echo "No ws-helper process found."
fi
