package com.tictactoe;

import jakarta.validation.constraints.NotNull;

public record ResultRequest(@NotNull Difficulty difficulty, @NotNull Outcome outcome) {
}
