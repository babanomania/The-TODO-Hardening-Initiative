# The TODO Hardening Initiative

*The TODO Hardening Initiative* is an open-source learning project designed to simulate and defend against SolarWinds-style software supply chain attacks by applying progressive hardening practices to a simple web application.

The application—a basic TODO list app using React (frontend) and Spring Boot (backend)—is incrementally secured using a suite of open-source DevSecOps tools. The initiative focuses on real-world, reproducible steps for CI/CD hardening, artifact signing, SBOM generation, runtime anomaly detection, and secure GitOps delivery, all running on Podman.

---

## Project Overview

**Tech Stack**:

* Frontend: React
* Backend: Spring Boot
* Database: PostgreSQL
* Containerization: Podman
* CI/CD: GitLab CI + GitLab CLI
* GitOps Deployment: Kubernetes via ArgoCD

**Project Goals**:

* Simulate insecure software pipelines and supply chain compromise vectors.
* Apply secure-by-design practices using only open-source tools.
* Transition from trust-based to verifiable software delivery.
* Teach real-world DevSecOps concepts through hands-on implementation.

---

## Hardening Features Implemented

### Software Bill of Materials (SBOM)

* SBOMs are generated for every image build using **Syft**.
* These documents are committed alongside each pipeline run to support auditability and traceability.

### Vulnerability Scanning

* All application and base image dependencies are scanned for CVEs using **Grype** and **OWASP Dependency-Check**.
* Maven dependencies are additionally checked with the OWASP Dependency-Check Maven plugin.
* npm packages are audited with `npm audit` to detect published advisories.
* CI pipelines are configured to fail if critical vulnerabilities are found.

### Container Image Signing and Verification

* All Podman-built images are signed using **Cosign**.
* Signature metadata is stored in a **Rekor** transparency log.
* ArgoCD performs signature verification using `cosign verify` prior to deployment.
* Each Deployment runs a Cosign init container that verifies the image signature using a ConfigMap containing the public key.

### Provenance and Supply Chain Attestation

* Build metadata and attestation logs are attached to each pipeline run, inspired by **SLSA Level 2** standards.
* CI steps include digest locking and tag verification to eliminate ambiguity in what gets deployed.

### Secrets Management

* Secrets are removed from application code and environment variables.
* Encrypted secrets are managed using **Bitnami Sealed Secrets** or **HashiCorp Vault**.
* GitOps deployments reference decrypted versions at runtime via Kubernetes controllers.

### Infrastructure-as-Code (IaC) Security Enforcement

* All Kubernetes manifests and deployment YAMLs are scanned with **Checkov**.
* **Conftest** is used to apply custom **OPA policies** that enforce:

  * No use of `latest` tags
  * Only signed images allowed
  * No privileged containers or default service accounts

### Runtime Threat Detection

* **Falco** monitors the Kubernetes cluster for abnormal behavior.
* Custom Falco rules detect:

  * Shell access in containers
  * Outbound DNS or network calls to unknown domains
  * Unusual process execution or filesystem writes

### Logging and Observability

* All container logs are shipped using **Promtail** to **Loki**, visualized in **Grafana**.
* Alerts and anomalies are tracked and visualized over time to support forensics.

### Incident Response Simulation

* Simulated backdoors and data exfiltration endpoints are added to test detection coverage.
* Detection, containment, and recovery steps are documented in a structured postmortem.

### Supply Chain Tampering Simulation

* Fake or malicious dependencies are introduced into the build process.
* These are detected via:

  * SBOM comparison
  * Grype scans
  * GitLab CI policy gates for known CVEs or unsigned artifacts

---

## Skills You'll Learn

| Security Practice                 | Tooling Applied                 |
| --------------------------------- | ------------------------------- |
| SBOM generation                   | Syft                            |
| Vulnerability scanning            | Grype, OWASP Dependency-Check   |
| Image signing & attestation       | Cosign, Rekor                   |
| CI/CD provenance tracking         | GitLab CI + SLSA principles     |
| Secrets management                | Vault, Sealed Secrets           |
| IaC hardening                     | Checkov, Conftest (OPA)         |
| Runtime behavior detection        | Falco                           |
| Observability & incident handling | Loki, Promtail, Grafana         |
| Secure GitOps deployment          | ArgoCD + signature verification |

For instructions on running GitLab locally and deploying the application, see
[SETUP.md](SETUP.md).


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

