package com.example.demo;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class TodoAPIApplication {

	public static void main(String[] args) {
		SpringApplication.run(TodoAPIApplication.class, args);
	}

	// --- CORS configuration for development ---
	@org.springframework.context.annotation.Bean
	public org.springframework.web.servlet.config.annotation.WebMvcConfigurer corsConfigurer() {
		return new org.springframework.web.servlet.config.annotation.WebMvcConfigurer() {
			@Override
			public void addCorsMappings(org.springframework.web.servlet.config.annotation.CorsRegistry registry) {
				if (registry == null) return;
			   registry.addMapping("/api/**")
					   .allowedOriginPatterns("*")
					   .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
					   .allowedHeaders("*")
					   .allowCredentials(true);
			}
		};
	}

}
