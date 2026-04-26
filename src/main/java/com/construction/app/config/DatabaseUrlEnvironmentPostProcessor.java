package com.construction.app.config;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

public class DatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String databaseUrl = environment.getProperty("DATABASE_URL");
        String existingSpringUrl = environment.getProperty("SPRING_DATASOURCE_URL");

        if (databaseUrl == null || databaseUrl.isBlank() || existingSpringUrl != null) {
            return;
        }

        URI uri = URI.create(databaseUrl);
        if (!"postgresql".equalsIgnoreCase(uri.getScheme()) && !"postgres".equalsIgnoreCase(uri.getScheme())) {
            return;
        }

        String userInfo = uri.getUserInfo();
        String username = "";
        String password = "";
        if (userInfo != null) {
            String[] parts = userInfo.split(":", 2);
            username = decode(parts[0]);
            if (parts.length > 1) {
                password = decode(parts[1]);
            }
        }

        String jdbcUrl = "jdbc:postgresql://" + uri.getHost();
        if (uri.getPort() > 0) {
            jdbcUrl += ":" + uri.getPort();
        }
        jdbcUrl += uri.getPath();
        if (uri.getQuery() != null && !uri.getQuery().isBlank()) {
            jdbcUrl += "?" + uri.getQuery();
        }

        Map<String, Object> properties = new HashMap<>();
        properties.put("spring.datasource.url", jdbcUrl);
        properties.put("spring.datasource.username", username);
        properties.put("spring.datasource.password", password);
        properties.put("spring.jpa.database-platform", "org.hibernate.dialect.PostgreSQLDialect");
        properties.put("spring.h2.console.enabled", "false");

        environment.getPropertySources().addFirst(new MapPropertySource("databaseUrl", properties));
    }

    private String decode(String value) {
        return URLDecoder.decode(value, StandardCharsets.UTF_8);
    }
}
