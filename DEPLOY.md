# Deployment Phase Guide

This document explains how to deploy the hardened TODO application using **Helm**.
Helm can be invoked directly or managed through **Argo CD** for GitOps workflows.
It assumes you already have container images built and signed in the GitLab registry.

## Prerequisites

- Access to a Kubernetes cluster (`kubectl` configured).
- Helm installed on your local system.
- Argo CD installed in your Kubernetes cluster. Install it with:
  ```bash
  kubectl create namespace argocd
  kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
  ```
- The chart automatically embeds the `cosign.pub` key from the repository's `cosign` directory as the `cosign-public-key` ConfigMap so the init containers can verify images.
- Export `POSTGRES_PASSWORD` in your shell. Helm will create the `pg-password`
  Kubernetes Secret from this value when deploying.
- Copy `.env.example` to `.env` and set `GITLAB_URL`, `GITLAB_GROUP`, and `GITLAB_PROJECT`.
- Set `GITLAB_USERNAME` and `GITLAB_TOKEN` for GitLab authentication when adding
  the repository to Argo CD.
- These values are consumed by the Helm chart in `charts/todo-app` and to define the Argo CD repository URL.

### Installing tools on macOS

```bash
brew install kubectl helm argocd
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

## Deploying with Argo CD

Argo CD can continuously manage the Helm release using a GitOps workflow. After installing Argo CD:

1. **Add the repository**
   ```bash
   REPO_URL="$GITLAB_URL/$GITLAB_GROUP/$GITLAB_PROJECT.git"
   argocd repo add "$REPO_URL" \
     --username "$GITLAB_USERNAME" \
     --password "$GITLAB_TOKEN"
   ```

2. **Create an Application** pointing at the chart:
   ```bash
  cat <<EOF | kubectl apply -f -
   apiVersion: argoproj.io/v1alpha1
   kind: Application
   metadata:
     name: todo
     namespace: argocd
   spec:
     project: default
     source:
       repoURL: $GITLAB_URL/$GITLAB_GROUP/$GITLAB_PROJECT.git
       path: charts/todo-app
       targetRevision: HEAD
       helm:
         values: |
           gitlab:
             group: "$GITLAB_GROUP"
             project: "$GITLAB_PROJECT"
           pgPassword: "$POSTGRES_PASSWORD"
     destination:
       server: https://kubernetes.default.svc
       namespace: todo
     syncPolicy:
       automated: {}
   EOF
   ```

Argo CD will install the chart and keep it synchronized with Git.

### Checking the deployment in the Argo CD UI

Forward the Argo CD server service locally and log in to verify the release:

```bash
kubectl -n argocd port-forward svc/argocd-server 8082:443
argocd login localhost:8082 --username admin \
  --password $(kubectl -n argocd get secret argocd-initial-admin-secret \
    -o jsonpath="{.data.password}" | base64 -d) --insecure
```

Fetch the initial admin password and open the web UI:

```bash
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d; echo
```

Navigate to <https://localhost:8082>, sign in as `admin` with the retrieved
password, and confirm the `todo` application reports a **Synced** and
**Healthy** status.

## Accessing Services Locally

Use `kubectl port-forward` to expose the services on your laptop or Mac. Each command
forwards the service into a local port so you can browse the UIs and test the API.

### TODO app

Run two port‑forward commands—one for the API and one for the UI—in separate terminals:

```bash
# Terminal 1
kubectl -n todo port-forward svc/todo-api 8080:8080

# Terminal 2
kubectl -n todo port-forward svc/todo-client 3000:80
```

Open <http://localhost:3000> in your browser. The web UI expects the API on
`localhost:8080`, so both commands must remain running. Verify the API works
with `curl http://localhost:8080/api/todos`.

### Grafana dashboard

```bash
kubectl -n monitoring port-forward svc/grafana 3001:3000
```

Navigate to <http://localhost:3001> (default credentials `admin`/`admin`).
From the *Explore* tab, query the Loki data source. You should see logs from the
`todo-api` and `todo-client` pods, confirming Grafana can reach the
application's log stream.

### Falco events

Falco runs as a daemonset. Forward a pod port to view the real-time event stream:

```bash
POD=$(kubectl -n falco get pods -l app=falco -o jsonpath='{.items[0].metadata.name}')
kubectl -n falco port-forward $POD 8765:8765
```

Connecting to `localhost:8765` with a tool like `nc` or `curl` should return
event messages. Look for references to the `todo-api` and `todo-client` pods to
verify Falco is monitoring the entire application stack.

