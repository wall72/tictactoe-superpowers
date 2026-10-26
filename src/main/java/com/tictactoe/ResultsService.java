package com.tictactoe;

import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class ResultsService {

    private final ResultsRepository repository;

    public ResultsService(ResultsRepository repository) {
        this.repository = repository;
    }

    public void recordResult(Difficulty difficulty, Outcome outcome) {
        repository.save(difficulty, outcome);
    }

    public StatsResponse getStats() {
        Map<Difficulty, DifficultyStats> stats = repository.aggregate();
        return new StatsResponse(stats.get(Difficulty.EASY), stats.get(Difficulty.HARD));
    }
}
