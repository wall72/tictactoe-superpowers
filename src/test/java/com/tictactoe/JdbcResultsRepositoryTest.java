package com.tictactoe;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.JdbcTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.nio.file.Path;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@JdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(JdbcResultsRepository.class)
class JdbcResultsRepositoryTest {

    @TempDir
    static Path tempDir;

    @DynamicPropertySource
    static void sqliteProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", () -> "jdbc:sqlite:" + tempDir.resolve("test.db"));
        registry.add("spring.datasource.driver-class-name", () -> "org.sqlite.JDBC");
    }

    @Autowired
    JdbcTemplate jdbcTemplate;

    ResultsRepository repository;

    @BeforeEach
    void setUp() {
        repository = new JdbcResultsRepository(jdbcTemplate);
    }

    @Test
    void aggregatesCountsPerDifficultyAndFillsMissingWithZero() {
        repository.save(Difficulty.EASY, Outcome.WIN);
        repository.save(Difficulty.EASY, Outcome.WIN);
        repository.save(Difficulty.EASY, Outcome.LOSE);

        Map<Difficulty, DifficultyStats> stats = repository.aggregate();

        assertThat(stats.get(Difficulty.EASY)).isEqualTo(new DifficultyStats(2, 1, 0));
        assertThat(stats.get(Difficulty.HARD)).isEqualTo(new DifficultyStats(0, 0, 0));
    }
}
