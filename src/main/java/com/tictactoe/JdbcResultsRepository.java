package com.tictactoe;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

@Repository
public class JdbcResultsRepository implements ResultsRepository {

    private final JdbcTemplate jdbcTemplate;

    public JdbcResultsRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void save(Difficulty difficulty, Outcome outcome) {
        jdbcTemplate.update(
                "INSERT INTO results (difficulty, outcome, created_at) VALUES (?, ?, ?)",
                difficulty.name(), outcome.name(), Instant.now().toString());
    }

    @Override
    public Map<Difficulty, DifficultyStats> aggregate() {
        Map<Difficulty, int[]> counts = new EnumMap<>(Difficulty.class);
        for (Difficulty difficulty : Difficulty.values()) {
            counts.put(difficulty, new int[3]);
        }

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                "SELECT difficulty, outcome, COUNT(*) AS cnt FROM results GROUP BY difficulty, outcome");

        for (Map<String, Object> row : rows) {
            Difficulty difficulty = Difficulty.valueOf((String) row.get("difficulty"));
            Outcome outcome = Outcome.valueOf((String) row.get("outcome"));
            int count = ((Number) row.get("cnt")).intValue();
            counts.get(difficulty)[outcome.ordinal()] = count;
        }

        Map<Difficulty, DifficultyStats> result = new EnumMap<>(Difficulty.class);
        for (Map.Entry<Difficulty, int[]> entry : counts.entrySet()) {
            int[] c = entry.getValue();
            result.put(entry.getKey(), new DifficultyStats(c[Outcome.WIN.ordinal()], c[Outcome.LOSE.ordinal()], c[Outcome.DRAW.ordinal()]));
        }
        return result;
    }
}
