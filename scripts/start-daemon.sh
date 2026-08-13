#!/bin/bash
# Starts the dev server as a detached daemon.
# Safe to call from a non-TTY environment (post-merge, CI, etc.)
cd /home/runner/workspace
exec setsid nohup npm run dev > /tmp/thriveup-dev.log 2>&1 &
echo $! > /tmp/thriveup-dev.pid
echo "Started PID $(cat /tmp/thriveup-dev.pid)"
