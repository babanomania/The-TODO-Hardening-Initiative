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

For instructions on running GitLab locally, deploying the application, and all
subsequent hardening steps (SBOM generation, dependency scanning, image signing,
runtime security and more), see [SETUP.md](SETUP.md).

The repository also demonstrates four attack scenarios: injecting an npm
package, injecting a Maven library, installing a remote shell backdoor, and
leaking passwords. Detailed steps for each can be found in
[malicious/README.md](malicious/README.md).
When trying these simulations, always create a new Git branch to keep the `main`
branch clean.


