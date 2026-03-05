#!/bin/bash
# Start ws-helper as a detached background process and log output
# Change to the directory containing this script (project root)
cd "$(dirname "$0")"
# Start the bot with nohup, redirect both stdout and stderr to a log file, and run in background
nohup npm start > ws-helper.log 2>&1 &
# Save the PID so we can stop it later
echo $! > ws-helper.pid
