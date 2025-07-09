# Build Phase Guide

This guide explains how to run the GitLab CI build pipeline either locally or in GitLab Cloud.
It assumes you are working on macOS and using Homebrew for tool installation.

## Prerequisites

- A GitLab Personal Access Token (`GITLAB_TOKEN`) with `api` and `write_repository` scopes.
- An NVD API key for OWASP Dependency‑Check. Create it under **Settings → CI/CD → Variables** in your GitLab project as `NVD_API_KEY`.
- Homebrew packages:
  ```bash
  brew install podman glab syft grype cosign
  ```

If you want to host GitLab yourself, follow [GITLAB_SETUP.md](./GITLAB_SETUP.md) to start a local instance with Podman and register a runner.
You can also push this repository to GitLab.com and use GitLab Cloud runners.

## Initial build steps

1. **Clone the repository and configure remotes**
   ```bash
   git clone "$GITLAB_URL/${GITLAB_GROUP}/${GITLAB_PROJECT}.git"
   cd "$GITLAB_PROJECT"
   ```
2. **Generate a Cosign key pair** for signing images and commit `cosign.pub`.
   ```bash
   cosign generate-key-pair
   git add cosign.pub
   git commit -m "Add cosign public key"
   ```
3. **Generate SBOMs** for the initial images so future pipelines can detect changes.
   ```bash
   syft todo-client -o syft-text > sboms/sbom-client.txt
   syft todo-api -o syft-text > sboms/sbom-api.txt
   git add sboms/sbom-client.txt sboms/sbom-api.txt
   git commit -m "Add initial SBOMs"
   ```
4. **Push to GitLab** to trigger the CI pipeline. The pipeline builds images,
   signs them using the Cosign keys, and runs vulnerability scans using
   the `NVD_API_KEY`.

With these steps complete, the build artifacts will be available in the GitLab registry.

## Handling Build Failures

If a pipeline fails, inspect each job in the GitLab UI:

1. Navigate to your project on GitLab.
2. Open **CI/CD → Pipelines** and click the failed pipeline.
3. Expand the job that failed to review its log output.

You can also check logs locally with the `glab` CLI:

```bash
glab ci view --web     # open pipeline details in a browser
glab ci view --job <job-id>
```

Fix the issue, commit your changes, and push again to re-run the pipeline.
