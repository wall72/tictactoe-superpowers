package com.tictactoe;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ResultsController.class)
class ResultsControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    ResultsService resultsService;

    @Test
    void postResultWithValidBodyReturns204() throws Exception {
        mockMvc.perform(post("/api/results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"difficulty\":\"EASY\",\"outcome\":\"WIN\"}"))
                .andExpect(status().isNoContent());
    }

    @Test
    void postResultWithMissingDifficultyReturns400() throws Exception {
        mockMvc.perform(post("/api/results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"outcome\":\"WIN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void postResultWithInvalidEnumValueReturns400() throws Exception {
        mockMvc.perform(post("/api/results")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"difficulty\":\"NIGHTMARE\",\"outcome\":\"WIN\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void getStatsReturnsZeroFilledResponseWhenEmpty() throws Exception {
        when(resultsService.getStats()).thenReturn(
                new StatsResponse(new DifficultyStats(0, 0, 0), new DifficultyStats(0, 0, 0)));

        mockMvc.perform(get("/api/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.easy.win").value(0))
                .andExpect(jsonPath("$.hard.draw").value(0));
    }
}
