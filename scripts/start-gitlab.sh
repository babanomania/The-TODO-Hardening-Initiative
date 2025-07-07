#!/bin/sh
# Simple helper to run GitLab CE using Podman
# Customize with environment variables or a .env file:
#   GITLAB_HOME   - location for GitLab data (default: ./gitlab)
#   GITLAB_HOSTNAME - hostname used inside the container (default: gitlab.local)
#   HTTP_PORT     - local port for HTTP access (default: 8929)
#   SSH_PORT      - local port for SSH access (default: 2224)
set -e

# Load variables from .env if present
[ -f .env ] && . ./.env

GITLAB_HOME=${GITLAB_HOME:-$PWD/gitlab}
GITLAB_HOSTNAME=${GITLAB_HOSTNAME:-gitlab.local}
HTTP_PORT=${HTTP_PORT:-8929}
SSH_PORT=${SSH_PORT:-2224}

mkdir -p "$GITLAB_HOME/config" "$GITLAB_HOME/logs" "$GITLAB_HOME/data"

podman run --detach \
    --hostname "$GITLAB_HOSTNAME" \
    --publish "${HTTP_PORT}:80" \
    --publish "${SSH_PORT}:22" \
    --name gitlab \
    --restart always \
    --volume "$GITLAB_HOME/config":/etc/gitlab \
    --volume "$GITLAB_HOME/logs":/var/log/gitlab \
    --volume "$GITLAB_HOME/data":/var/opt/gitlab \
    gitlab/gitlab-ce:latest

echo "GitLab CE is starting on http://${GITLAB_HOSTNAME}:${HTTP_PORT}"

