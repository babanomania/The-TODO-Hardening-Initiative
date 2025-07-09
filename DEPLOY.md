# Deployment Phase Guide

This document explains how to deploy the hardened TODO application using **Helm**.
It assumes you already have container images built and signed in the GitLab registry.

## Prerequisites

- Access to a Kubernetes cluster (`kubectl` configured).
- Helm installed on your local system.
- The `cosign.pub` key applied as a ConfigMap so the init containers can verify images.
- The Bitnami Sealed Secrets controller installed and the `kubeseal` CLI
  available.
  This is required for `pg-password-sealed.yaml`.
- Copy `.env.example` to `.env` and set `GITLAB_GROUP` and `GITLAB_PROJECT`.
- These values are consumed by the Helm chart in `charts/todo-app`.

### Installing tools on macOS

```bash
brew install kubectl helm
```

## Deploying with Helm

1. **Create the target namespace**
   ```bash
   kubectl create namespace todo || true
   ```
2. **Install the chart**
   ```bash
   helm upgrade --install todo charts/todo-app \
     --namespace todo \
     --set gitlab.group=$GITLAB_GROUP \
     --set gitlab.project=$GITLAB_PROJECT
   ```

The Helm chart deploys PostgreSQL, Grafana Loki, and Falco alongside the TODO application.
Once installation completes, the TODO UI will be reachable via the `todo-client` service.
