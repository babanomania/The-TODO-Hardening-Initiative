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

**Warning:** The default passwords are intentionally insecure. Do not expose this environment to untrusted networks.

To experiment with the remote shell backdoor, follow
[malicious/README.md](malicious/README.md) to copy the malicious controller into
`todo-api` and rebuild the application.

## SBOM and Dependency Scanning (Phase 2)

1. **Generate SBOMs using Syft**
   ```bash
   syft "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest" -o cyclonedx-json > sboms/sbom-client.json
   syft "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest" -o cyclonedx-json > sboms/sbom-api.json
   ```
   Commit the resulting files so changes can be tracked.

2. **Run Grype vulnerability scans**
   ```bash
   grype "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest" --fail-on critical
   grype "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest" --fail-on critical
   ```
   The `--fail-on` flag stops the pipeline if critical CVEs are found.

3. **Scan dependencies with OWASP Dependency-Check**
   ```bash
   podman run --rm -v $(pwd):/src owasp/dependency-check \
       --project todo-api --scan /src/todo-api --format JSON --out /src/odc-api
   podman run --rm -v $(pwd):/src owasp/dependency-check \
       --project todo-client --scan /src/todo-client --format JSON --out /src/odc-client
   ```

## Image Signing and Provenance (Phase 3)

1. **Sign images with Cosign and record in Rekor**
   ```bash
   cosign generate-key-pair
   cosign sign --key cosign.key --rekor-url https://rekor.sigstore.dev "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest"
   cosign sign --key cosign.key --rekor-url https://rekor.sigstore.dev "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest"
   ```
   Store `cosign.pub` in the repository for verification.

2. **Generate SLSA provenance**
   ```bash
   echo '{}' > provenance.json
   cosign attest --key cosign.key --rekor-url https://rekor.sigstore.dev \
       --predicate provenance.json --type slsaprovenance \
       "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-client:latest"
   cosign attest --key cosign.key --rekor-url https://rekor.sigstore.dev \
       --predicate provenance.json --type slsaprovenance \
       "$GITLAB_REGISTRY/${GITLAB_GROUP}/${GITLAB_PROJECT}/todo-api:latest"
   ```

3. **Verify signatures before deployment**
   ArgoCD Deployments run an init container that executes `cosign verify` with the stored public key. If verification fails, the pod will not start.

## Secrets Management and IaC Security (Phase 4)

1. **Store credentials with Sealed Secrets**
   ```bash
   kubectl create secret generic pg-password --from-literal=POSTGRES_PASSWORD=<password> --dry-run=client -o yaml > pg-secret.yaml
   kubeseal < pg-secret.yaml -o yaml > k8s/pg-password-sealed.yaml
   ```

2. **Reference secrets in Deployments**
   Environment variables use `valueFrom.secretKeyRef` instead of plaintext values (see `postgres-deployment.yaml` and `todo-api-deployment.yaml`).

3. **Scan manifests with Checkov and Conftest**
   The pipeline runs Checkov and OPA policies to block privileged containers, plaintext secrets, or use of the `latest` tag.

## Runtime Security with Falco (Phase 5)

1. **Deploy Falco using ArgoCD**
   ```bash
   kubectl apply -f k8s/falco-daemonset.yaml
   kubectl apply -f k8s/falco-rules.yaml
   ```
   These manifests install the Falco daemon on each node and load custom rules.

2. **Check Falco alerts**
   ```bash
   kubectl logs -n falco -l app=falco
   ```
Integrate with Promtail/Loki or Slack for centralized alerting.

## Simulated Incident and Detection (Phase 6)

1. **Deploy Loki, Promtail and Grafana**
   ```bash
   kubectl apply -f k8s/loki-stack.yaml
   ```
   This stack collects pod logs and provides a Grafana dashboard at the `grafana` service.

2. **Trigger the `/leak` endpoint**
   ```bash
   curl http://<todo-api-service>/leak
   ```
   Falco should detect suspicious file access while logs appear in Grafana.

3. **Review `INCIDENT_REPORT.md`** for an example timeline of detection and response steps.

## Supply Chain Attack Simulation (Bonus Phase)

1. **Introduce a suspicious dependency**
   - Follow [malicious/README.md](malicious/README.md) to build and manually install
     the `evil-package` and `evil-lib` artifacts. The base project omits these
     dependencies to keep the scenario realistic.

2. **Generate new SBOMs and compare**
   - The CI pipeline stores SBOMs under `sboms/` and fails if they change.
   - Review the pipeline output to spot unexpected dependencies.

3. **Run vulnerability scans**
   - Grype and Dependency‑Check jobs will flag the malicious packages.

4. **Remove or replace the bad dependencies** once detected to restore a secure state.
