package com.tictactoe;

import java.util.Map;

public interface ResultsRepository {

    void save(Difficulty difficulty, Outcome outcome);

    Map<Difficulty, DifficultyStats> aggregate();
}
