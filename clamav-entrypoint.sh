#!/bin/sh
set -e

echo "Updating ClamAV definitions..."
freshclam

echo "ClamAV definitions updated, starting clamd..."
exec clamd --foreground=true
