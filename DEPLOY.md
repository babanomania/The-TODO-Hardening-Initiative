# Deployment Phase Guide

This document explains how to deploy the hardened TODO application using **Helm**.
It assumes you already have container images built and signed in the GitLab registry.

## Prerequisites

- Access to a Kubernetes cluster (`kubectl` configured).
- Helm installed on your local system.
- The `cosign.pub` key applied as a ConfigMap so the init containers can verify images.
- Export `POSTGRES_PASSWORD` in your shell. Helm will create the `pg-password`
  Kubernetes Secret from this value when deploying.
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
     --set gitlab.project=$GITLAB_PROJECT \
     --set pgPassword=$POSTGRES_PASSWORD
   ```

The Helm chart deploys PostgreSQL, Grafana Loki, and Falco alongside the TODO application.
Once installation completes, the TODO UI will be reachable via the `todo-client` service.
