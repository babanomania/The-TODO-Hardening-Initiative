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
- Copy `.env.example` to `.env` and set `GITLAB_GROUP` and `GITLAB_PROJECT`.
- These variables are inserted into `k8s/argo-app.yaml` and passed to the Helm chart in `charts/todo-app`.

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
2. **Lint the Helm chart and create the Argo CD Application**
   ```bash
   helm lint charts/todo-app
   envsubst < k8s/argo-app.yaml | kubectl apply -f -
   ```
3. **Sync the application**
   ```bash
   argocd app sync todo-app
   ```

Argo CD verifies each image with `cosign verify` before deployment.
Once the application is synced, the TODO UI will be reachable via the `todo-client` service.
