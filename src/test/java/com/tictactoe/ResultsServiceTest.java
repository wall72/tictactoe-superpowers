package com.tictactoe;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ResultsServiceTest {

    @Test
    void getStatsMapsRepositoryAggregateToResponse() {
        ResultsRepository repo = mock(ResultsRepository.class);
        when(repo.aggregate()).thenReturn(Map.of(
                Difficulty.EASY, new DifficultyStats(2, 1, 0),
                Difficulty.HARD, new DifficultyStats(0, 0, 1)));
        ResultsService service = new ResultsService(repo);

        StatsResponse response = service.getStats();

        assertThat(response.easy()).isEqualTo(new DifficultyStats(2, 1, 0));
        assertThat(response.hard()).isEqualTo(new DifficultyStats(0, 0, 1));
    }
}
