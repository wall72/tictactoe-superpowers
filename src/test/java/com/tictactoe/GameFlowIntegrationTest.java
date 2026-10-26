package com.tictactoe;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.resttestclient.TestRestTemplate;
import org.springframework.boot.resttestclient.autoconfigure.AutoConfigureTestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureTestRestTemplate
class GameFlowIntegrationTest {

    @TempDir
    static Path tempDir;

    @DynamicPropertySource
    static void sqliteProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + tempDir.resolve("integration-test.db"));
        registry.add("spring.datasource.driver-class-name", () -> "org.sqlite.JDBC");
    }

    @Autowired
    TestRestTemplate restTemplate;

    @Test
    void servesIndexPageAndPersistsSubmittedResultThroughStatsEndpoint() {
        ResponseEntity<String> page = restTemplate.getForEntity("/index.html", String.class);
        assertThat(page.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(page.getBody()).contains("difficulty-select");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(
                "{\"difficulty\":\"HARD\",\"outcome\":\"DRAW\"}", headers);
        ResponseEntity<Void> postResponse =
                restTemplate.postForEntity("/api/results", request, Void.class);
        assertThat(postResponse.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<StatsResponse> stats =
                restTemplate.getForEntity("/api/stats", StatsResponse.class);
        assertThat(stats.getBody().hard().draw()).isEqualTo(1);
    }
}
