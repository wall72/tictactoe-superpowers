package com.tictactoe;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ResultsController {

    private final ResultsService resultsService;

    public ResultsController(ResultsService resultsService) {
        this.resultsService = resultsService;
    }

    @PostMapping("/api/results")
    public ResponseEntity<Void> submitResult(@Valid @RequestBody ResultRequest request) {
        resultsService.recordResult(request.difficulty(), request.outcome());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/stats")
    public StatsResponse getStats() {
        return resultsService.getStats();
    }
}
