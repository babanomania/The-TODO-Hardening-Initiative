# The TODO Hardening Initiative

*The TODO Hardening Initiative* is a hands-on DevSecOps lab environment disguised as a TODO app. Designed in response to lessons learned from the SolarWinds supply chain compromise, this project doesn’t just showcase what can go wrong in modern CI/CD pipelines—it demonstrates how to prevent it.

Built around a deliberately minimal stack (React + Spring Boot), the initiative evolves that app into a hardened software delivery system by implementing concrete, real-world defenses at every layer of the lifecycle. From source to running containers, from commit to deploy, every step is scrutinized, locked down, signed, scanned, and monitored—using only open-source tools and infrastructure.

This project assumes you’ve heard about supply chain attacks. Here, you’ll build the muscle memory to stop them.

## Project Overview

**Tech Stack**:

* Frontend: React
* Backend: Spring Boot
* Database: PostgreSQL
* Containerization: Podman
* CI/CD: GitLab CI + GitLab CLI
* Deployment: Kubernetes via Helm and Argo CD

**Project Goals**:

* Simulate insecure software pipelines and supply chain compromise vectors.
* Apply secure-by-design practices using only open-source tools.
* Transition from trust-based to verifiable software delivery.
* Teach real-world DevSecOps concepts through hands-on implementation.
 The lifecycle is split into a **build phase** handled by GitLab CI and a **deploy phase** driven by Helm. Argo CD reconciles the Helm release with Git so only the signed and scanned images are deployed.


## Hardening Features Implemented

### Software Bill of Materials (SBOM)

* SBOMs are generated for every image build using **Syft**.
* These documents are committed alongside each pipeline run to support auditability and traceability.

### Vulnerability Scanning

* All application and base image dependencies are scanned for CVEs using **Grype** and **OWASP Dependency-Check**.
* Maven dependencies are additionally checked with the OWASP Dependency-Check Maven plugin.
* npm packages are audited with `npm audit` to detect published advisories.
* CI pipelines are configured to fail if critical vulnerabilities are found.

### Static Application Security Testing (SAST)

* Application code is scanned with **Semgrep** during the CI pipeline.
* Results are exported in the GitLab SAST report format.

### Container Image Signing and Verification

* All Podman-built images are signed using **Cosign**.
* Signature metadata is stored in a **Rekor** transparency log.
 * A Cosign init container performs signature verification using `cosign verify` prior to deployment.
* Each deployment runs a Cosign init container that verifies the image signature using a ConfigMap containing the public key.

### Provenance and Supply Chain Attestation

* Build metadata and attestation logs are attached to each pipeline run, inspired by **SLSA Level 2** standards.
* CI steps include digest locking and tag verification to eliminate ambiguity in what gets deployed.

### Secrets Management

* Secrets are removed from application code and environment variables.
* Secrets are stored in Kubernetes Secrets and can optionally be encrypted using
  tools like **Sealed Secrets** or managed with **HashiCorp Vault**.
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

## Skills You'll Learn

| Security Practice                 | Tooling Applied                 |
| --------------------------------- | ------------------------------- |
| SBOM generation                   | Syft                            |
| Vulnerability scanning            | Grype, OWASP Dependency-Check   |
| Static application security testing | Semgrep                        |
| Image signing & attestation       | Cosign, Rekor                   |
| CI/CD provenance tracking         | GitLab CI + SLSA principles     |
| Secrets management                | Vault, Sealed Secrets           |
| IaC hardening                     | Checkov, Conftest (OPA)         |
| Runtime behavior detection        | Falco                           |
| Observability & incident handling | Loki, Promtail, Grafana         |
| Secure deployment                 | Helm + Argo CD + signature verification |

## Getting Started
For build instructions see [BUILD.md](./BUILD.md). Deployment steps are covered in [DEPLOY.md](./DEPLOY.md).

## Simulating Attacks

This project includes a set of predefined supply chain attack scenarios, such as:

* Injecting a malicious npm package
* Injecting a compromised Maven dependency
* Installing a remote shell backdoor in the Spring Boot API
* Leaking secrets via outbound traffic

To safely experiment with these scenarios, switch to a separate Git branch and follow the guide here:
[malicious/README.md](./malicious/README.md)
