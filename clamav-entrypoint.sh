#!/bin/sh
set -e

echo "Updating ClamAV definitions..."
freshclam

# max_wait=30
# waited=0
# while [ ! -f /var/lib/clamav/main.cvd ] && [ ! -f /var/lib/clamav/main.cld ]; do
#     echo "Waiting for ClamAV definitions to be updated..."
#     sleep 1
#     waited=$((waited + 1))
#     if [ "$waited" -ge "$max_wait" ]; then
#         echo "Timeout waiting for ClamAV definitions."
#         exit 1
#     fi
# done

echo "ClamAV definitions updated, starting clamd..."
exec clamd --foreground=true
