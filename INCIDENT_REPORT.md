# Example Incident Report

This document outlines a simulated data exfiltration incident detected by Falco and Loki.

## Timeline
- **T0**: Attacker calls `/leak` endpoint to read `/etc/passwd`.
- **T1**: Falco rule triggers on suspicious file access.
- **T2**: Promtail ships logs to Loki; Grafana dashboard shows alert.
- **T3**: Team investigates, removes the backdoor and rotates credentials.

## Indicators of Compromise
- Falco alert: `Shell spawned in container` or `File read /etc/passwd`.
- Unusual HTTP requests to `/leak`.

## Remediation
1. Remove the `/leak` and `/debug-shell` endpoints.
2. Redeploy clean containers and rotate sensitive credentials.
3. Review CI/CD pipeline for unauthorized changes.
