#!/bin/bash
# Fix script for Docker network issues

echo "=== WAF Project Docker Fix ==="
echo ""

# Option 1: Retry with explicit tags
echo "[1] Trying to pull images with retry..."
for i in {1..3}; do
    echo "Attempt $i..."
    docker pull redis:7.2-alpine && docker pull prom/prometheus:v2.50.1 && docker pull grafana/grafana:10.4.0
    if [ $? -eq 0 ]; then
        echo "Images pulled successfully!"
        break
    fi
    echo "Retrying in 5 seconds..."
    sleep 5
done

# Option 2: If still failing, use local build
echo ""
echo "[2] If image pull still fails, use local build:"
echo "   docker-compose -f docker-compose.local.yml up --build"
echo ""

# Option 3: Use docker compose (new CLI) instead of docker-compose (old)
echo "[3] Try using the new Docker Compose CLI:"
echo "   docker compose up --build"
echo ""

# Option 4: Check Docker daemon
echo "[4] Common fixes:"
echo "   - Restart Docker: sudo systemctl restart docker"
echo "   - Check internet: ping registry-1.docker.io"
echo "   - Use VPN if behind firewall"
echo "   - Set DNS: echo '{\"dns\":[\"8.8.8.8\",\"8.8.4.4\"]}' | sudo tee /etc/docker/daemon.json && sudo systemctl restart docker"
