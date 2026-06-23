#!/bin/bash
# Self-healing tunnel — restarts instantly on disconnect

PORT=5174

echo "Starting self-healing tunnel on port $PORT..."

while true; do
  echo "[$(date '+%H:%M:%S')] Connecting to localhost.run..."
  
  ssh \
    -o StrictHostKeyChecking=no \
    -o ServerAliveInterval=20 \
    -o ServerAliveCountMax=3 \
    -o ExitOnForwardFailure=yes \
    -o ConnectTimeout=15 \
    -R 80:localhost:$PORT \
    nokey@localhost.run 2>&1 | tee /tmp/tunnel_last.log

  EXIT_CODE=$?
  echo "[$(date '+%H:%M:%S')] Tunnel exited (code $EXIT_CODE). Restarting in 3s..."
  sleep 3
done
