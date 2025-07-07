# Project Setup

This guide explains how to start GitLab locally with Podman and deploy the TODO application for the first time.

## Running GitLab locally

Follow the steps in [GITLAB_SETUP.md](GITLAB_SETUP.md) to start GitLab CE using Podman. The guide explains how to copy `.env.example` to `.env`, run `. ./.env` to load the variables, and launch the container with those values.

---

## Deployment Steps (Phase 1)

These steps reproduce the baseline insecure deployment. They assume you have Podman installed and access to a Kubernetes cluster.

1. **Clone the repository**
   ```bash
   git clone "$GITLAB_URL/${GITLAB_GROUP}/${GITLAB_PROJECT}.git"
   cd "$GITLAB_PROJECT"
   ```
2. **Install prerequisites**
   - Node.js and npm
   - Java 17 JDK and Maven
   - GitLab CLI (`glab`)
   - `kubectl` for Kubernetes access
3. **Build and push images**
   ```bash
   podman build -t "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest" todo-client
   podman build -t "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest" todo-api
   podman login "$GITLAB_REGISTRY" -u "$GITLAB_USERNAME" -p "$GITLAB_TOKEN"
   podman push "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest"
   podman push "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest"
   ```
4. **Deploy PostgreSQL, API and client**
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   kubectl apply -f k8s/todo-api-deployment.yaml
   kubectl apply -f k8s/todo-client-deployment.yaml
   ```
5. **Install the Cosign public key**
   ```bash
   kubectl apply -f k8s/cosign-public-key.yaml
   ```
6. **Set up ArgoCD** (once per cluster)
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   kubectl apply -f k8s/argo-app.yaml
   ```

After ArgoCD syncs the application, the TODO app will be accessible via the `todo-client` service.

**Warning:** The default passwords and `/debug-shell` endpoint are intentionally insecure. Do not expose this environment to untrusted networks.
