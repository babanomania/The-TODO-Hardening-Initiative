# Deployment Phase Guide

This document explains how to deploy the hardened TODO application using Argo CD.
It assumes you already have container images built and signed in the GitLab registry.

## Prerequisites

- Access to a Kubernetes cluster (`kubectl` configured).
- Argo CD installed on the cluster.
- The `cosign.pub` key applied as a ConfigMap so Argo CD can verify images.
- The Bitnami Sealed Secrets controller installed and the `kubeseal` CLI
  available.
  This is required for `pg-password-sealed.yaml`.
- Replace `REPLACE_GROUP` and `REPLACE_PROJECT` in the manifests under
  `k8s/` with your GitLab namespace and project name before applying them.

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
2. **Apply the Cosign public key and sealed secret**
   ```bash
   kubectl apply -f k8s/cosign-public-key.yaml
   kubectl apply -f k8s/pg-password-sealed.yaml
   ```
3. **Deploy core services**
   ```bash
   kubectl apply -f k8s/postgres-deployment.yaml
   kubectl apply -f k8s/todo-api-deployment.yaml
   kubectl apply -f k8s/todo-client-deployment.yaml
   ```
4. **Deploy runtime monitoring and logging**
   ```bash
   kubectl apply -f k8s/falco-rules.yaml
   kubectl apply -f k8s/falco-daemonset.yaml
   kubectl apply -f k8s/loki-stack.yaml
   ```
5. **Create the Argo CD Application**
   ```bash
   kubectl apply -f k8s/argo-app.yaml
   ```
6. **Sync the application**
   ```bash
   argocd app sync todo-app
   ```

Argo CD verifies each image with `cosign verify` before deployment.
Once the application is synced, the TODO UI will be reachable via the `todo-client` service.
