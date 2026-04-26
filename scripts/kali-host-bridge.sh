#!/usr/bin/env bash
# Helper installed inside the Kali container so Claude (and other tools running
# in the container) can reach the host services: Hermes bridge + ImageSmith.

set -euo pipefail

HOST_IP="$(ip route | awk '/default/ {print $3}')"
export CONTROLA_HOST_IP="$HOST_IP"
export HERMES_BRIDGE_URL="http://${HOST_IP}:7771"
export IMAGESMITH_URL="http://${HOST_IP}:8700"

cmd="${1:-status}"

case "$cmd" in
  status)
    echo "Host gateway: $HOST_IP"
    echo -n "Hermes bridge ($HERMES_BRIDGE_URL/chat): "
    curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 -X POST -H "Content-Type: application/json" -d '{"message":"ping"}' "$HERMES_BRIDGE_URL/chat" || echo "unreachable"
    echo -n "ImageSmith ($IMAGESMITH_URL): "
    curl -s -o /dev/null -w "%{http_code}\n" --max-time 5 "$IMAGESMITH_URL/" || echo "unreachable"
    ;;
  ask)
    shift
    msg="$*"
    [ -z "$msg" ] && { echo "usage: kali-host-bridge ask <message>"; exit 1; }
    user_id="${USER_ID:-claude-kali}"
    user_name="${USER_NAME:-Claude Kali}"
    curl -s --max-time 240 -X POST -H "Content-Type: application/json" \
      -d "$(jq -n --arg msg "$msg" --arg uid "$user_id" --arg uname "$user_name" \
        '{profile: "default", message: $msg, user_id: $uid, user_name: $uname}')" \
      "$HERMES_BRIDGE_URL/chat"
    echo
    ;;
  imagesmith)
    shift
    endpoint="${1:-/generate}"
    shift || true
    curl -s --max-time 240 -X POST -H "Content-Type: application/json" -d "${1:-{}}" "$IMAGESMITH_URL$endpoint"
    echo
    ;;
  *)
    echo "Unknown command: $cmd"
    echo "Usage: kali-host-bridge {status|ask <message>|imagesmith <endpoint> <json>}"
    exit 2
    ;;
esac
