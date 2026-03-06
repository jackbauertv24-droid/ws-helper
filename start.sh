#!/bin/bash
# Start ws-helper as a detached background process and log output.
# This script launches the bot in the background (via nohup) and records its PID.
# IMPORTANT: The bot runs indefinitely. When you are done, stop it with ./stop.sh
# or by killing the PID stored in ws-helper.pid.
cd "$(dirname "$0")"
nohup npm start >> ws-helper.log 2>&1 &
# Save the PID so we can stop it later (used by stop.sh)
echo $! > ws-helper.pid
