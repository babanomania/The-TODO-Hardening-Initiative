# Deployment Phase Guide

This document explains how to deploy the hardened TODO application using Argo CD.
It assumes you already have container images built and signed in the GitLab registry.

## Prerequisites

- Access to a Kubernetes cluster (`kubectl` configured).
- Argo CD installed on the cluster.
- The `cosign.pub` key applied as a ConfigMap so Argo CD can verify images.

### Installing tools on macOS

```bash
brew install kubectl argocd
```

## Deploying with Argo CD

1. **Create the Argo CD namespace and install the controller**
   ```bash
   kubectl create namespace argocd
   kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
   ```
2. **Deploy application manifests**
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   kubectl apply -f k8s/todo-api-deployment.yaml
   kubectl apply -f k8s/todo-client-deployment.yaml
   kubectl apply -f k8s/cosign-public-key.yaml
   ```
3. **Create the Argo CD Application**
   ```bash
   kubectl apply -f k8s/argo-app.yaml
   ```
4. **Sync the application**
   ```bash
   argocd app sync todo
   ```

Argo CD verifies each image with `cosign verify` before deployment.
Once the application is synced, the TODO UI will be reachable via the `todo-client` service.
