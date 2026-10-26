# 틱택토 웹 게임 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 사용자가 브라우저에서 컴퓨터(AI)와 틱택토를 하고, 완료된 게임의 승/패/무승부가
난이도별로 SQLite에 저장되며, 화면에서 누적 전적을 조회할 수 있는 Spring Boot 앱을
빌드한다.

**Architecture:** Spring Boot 단일 애플리케이션이 정적 프론트엔드(HTML/CSS/순수 JS)와
REST API(`/api/results`, `/api/stats`)를 함께 제공한다. 게임 보드 상태, 승패 판정,
AI(쉬움=무작위, 어려움=미니맥스)는 브라우저 JS에서 전적으로 처리하고, 게임이 끝까지
완료된 시점에만 결과를 서버로 전송해 SQLite에 적재한다. 서버는 상태를 갖지 않고
결과 적재/집계 조회만 담당한다.

**Tech Stack:** Java 17, Spring Boot 3.3.x (Web, JDBC), Gradle Wrapper, SQLite
(org.xerial:sqlite-jdbc), 순수 HTML/CSS/JavaScript (빌드 도구/프레임워크 없음),
Node 내장 테스트 러너(`node --test`)로 프론트 게임 로직 단위 테스트.

**Spec:** `docs/superpowers/specs/2026-10-26-tictactoe-game-design.md`

## Global Constraints

- 백엔드: Spring Boot
- 빌드 도구: Gradle Wrapper (`./gradlew`)
- 저장소: SQLite
- 대결 모드: 사용자 vs 컴퓨터만 (2인 로컬 모드 없음)
- 난이도: 쉬움(무작위)/어려움(미니맥스) 두 가지, 게임 시작 시 선택
- 선공: 항상 사용자(X), 컴퓨터는 O
- 저장 데이터: 완료된 게임의 승/패/무승부만 (상세 수순 기록 아님), 난이도별로 따로 집계
- 중간 이탈(새로고침 등)로 끝나지 않은 게임은 기록하지 않음
- 매 수(turn)마다 서버 왕복 금지 — 게임 로직은 전부 클라이언트에서 처리

## Review Focus

- 보드가 가득 찼지만 승자가 없을 때 정확히 `draw`로 판정해야 한다 (승/패로 오판하지 않음) — Task 2에서 테스트.
- 어려움 난이도 AI는 사용자가 어떤 수를 두어도(여러 시나리오) 절대 지지 않아야 한다 — Task 3에서 테스트.
- `POST /api/results`에 난이도/결과 값이 비어있거나 허용되지 않은 값일 때 서버가 500이 아니라 400을 반환해야 한다 — Task 5에서 테스트.
- 기록이 전혀 없는 상태에서 `GET /api/stats`를 호출해도 easy/hard 양쪽 모두 0으로 채워진 응답이 와야 한다(키 누락 없이) — Task 5에서 테스트.
- 게임이 끝까지 완료되지 않고(중간 이탈/리셋) 종료되면 결과가 서버로 전송되지 않아야 한다 — Task 6에서 수동 검증.

---

## File Structure

```
tictactoe/
  gradlew, gradlew.bat, gradle/wrapper/...
  build.gradle
  settings.gradle
  .gitignore                              (빌드 산출물, *.db 제외)
  src/main/java/com/tictactoe/
    TicTacToeApplication.java
    Difficulty.java                       (enum: EASY, HARD)
    Outcome.java                          (enum: WIN, LOSE, DRAW)
    DifficultyStats.java                  (record: win, lose, draw)
    StatsResponse.java                    (record: easy, hard)
    ResultRequest.java                    (record: difficulty, outcome + 검증 애너테이션)
    ResultsRepository.java                (interface)
    JdbcResultsRepository.java            (JdbcTemplate 구현체)
    ResultsService.java
    ResultsController.java
  src/main/resources/
    application.properties
    schema.sql
    static/
      index.html
      css/style.css
      js/game-logic.js                    (순수 함수: 보드/승패판정/랜덤수)
      js/ai.js                            (미니맥스 구현)
      js/api.js                           (fetch 래퍼)
      js/game.js                          (DOM 연결/이벤트 처리)
  src/test/java/com/tictactoe/
    JdbcResultsRepositoryTest.java
    ResultsServiceTest.java
    ResultsControllerTest.java
  src/test/js/
    game-logic.test.js
    ai.test.js
```

---

### Task 1: 프로젝트 스캐폴드 (Gradle Wrapper + Spring Boot 뼈대)

**Files:**
- Create: `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.properties`, `gradle/wrapper/gradle-wrapper.jar`
- Create: `build.gradle`, `settings.gradle`
- Create: `.gitignore`
- Create: `src/main/java/com/tictactoe/TicTacToeApplication.java`
- Create: `src/main/resources/application.properties`
- Test: `src/test/java/com/tictactoe/TicTacToeApplicationTests.java`

**Interfaces:**
- Produces: `com.tictactoe.TicTacToeApplication` (Spring Boot 진입점, `main(String[] args)`), Gradle 빌드 태스크 `./gradlew build`, `./gradlew bootRun`, `./gradlew test`.

- [ ] **Step 1: `gradle init` 또는 `spring init`으로 Gradle(Groovy DSL) + Spring Boot 3.3.x, Java 17, 의존성(Web, JDBC)을 사용해 프로젝트를 생성**

`build.gradle`에 `org.xerial:sqlite-jdbc` 의존성과 `spring-boot-starter-validation`도 추가한다.

- [ ] **Step 2: `application.properties`에 SQLite 데이터소스 설정 추가**

```properties
spring.datasource.url=jdbc:sqlite:tictactoe.db
spring.datasource.driver-class-name=org.sqlite.JDBC
spring.datasource.hikari.maximum-pool-size=1
spring.sql.init.mode=always
```

- [ ] **Step 3: `.gitignore`에 `build/`, `.gradle/`, `*.db` 추가**

- [ ] **Step 4: 컨텍스트 로딩 테스트 작성**

```java
@SpringBootTest
class TicTacToeApplicationTests {
    @Test
    void contextLoads() {}
}
```

- [ ] **Step 5: 테스트 실행해 통과 확인**

Run: `./gradlew test --tests TicTacToeApplicationTests`
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add gradlew gradlew.bat gradle build.gradle settings.gradle .gitignore src
git commit -m "chore: scaffold Spring Boot + Gradle wrapper project"
```

---

### Task 2: 게임 핵심 로직 (보드 상태, 승패 판정, 쉬움 AI)

**Files:**
- Create: `src/main/resources/static/js/game-logic.js`
- Test: `src/test/js/game-logic.test.js`

**Interfaces:**
- Produces: `createEmptyBoard(): (string|null)[9]`, `getAvailableMoves(board): number[]`,
  `checkWinner(board): 'X'|'O'|'draw'|null`, `getRandomMove(board): number`.
  모두 `module.exports`로 내보내고(Node 테스트용), 브라우저에서는 전역 함수로도
  동작하도록 파일 끝에 `if (typeof module !== 'undefined' && module.exports) { module.exports = {...}; }` 가드를 둔다.

- [ ] **Step 1: 실패하는 테스트 작성 (승자 판정 + 무승부 판정)**

```js
const { createEmptyBoard, checkWinner } = require('../../main/resources/static/js/game-logic.js');

test('checkWinner detects a row win for X', () => {
  const board = ['X','X','X', null,null,null, null,null,null];
  assert.strictEqual(checkWinner(board), 'X');
});

test('checkWinner returns draw when board is full with no winner', () => {
  const board = ['X','O','X', 'X','O','O', 'O','X','X'];
  assert.strictEqual(checkWinner(board), 'draw');
});

test('checkWinner returns null when game is still ongoing', () => {
  const board = createEmptyBoard();
  assert.strictEqual(checkWinner(board), null);
});
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `node --test src/test/js/game-logic.test.js`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: `game-logic.js`에 `createEmptyBoard`, `getAvailableMoves`, `checkWinner` 구현**

`checkWinner`는 가로/세로/대각선 8개 라인을 확인하고, 승자가 없고 빈 칸도 없으면
`'draw'`, 빈 칸이 남아있으면 `null`을 반환한다.

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `node --test src/test/js/game-logic.test.js`
Expected: PASS

- [ ] **Step 5: 쉬움 AI(무작위 수) 실패하는 테스트 작성**

```js
test('getRandomMove only returns indices of empty cells', () => {
  const board = ['X',null,'O', null,null,null, null,null,null];
  const move = getRandomMove(board);
  assert.ok(getAvailableMoves(board).includes(move));
});
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `node --test src/test/js/game-logic.test.js`
Expected: FAIL (`getRandomMove` 없음)

- [ ] **Step 7: `getRandomMove(board)` 구현 — `getAvailableMoves`에서 무작위로 하나 선택**

- [ ] **Step 8: 전체 테스트 실행해 통과 확인**

Run: `node --test src/test/js/game-logic.test.js`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add src/main/resources/static/js/game-logic.js src/test/js/game-logic.test.js
git commit -m "feat: add board state, winner detection, and random-move AI"
```

---

### Task 3: 어려움 AI (미니맥스, 무적)

**Files:**
- Create: `src/main/resources/static/js/ai.js`
- Test: `src/test/js/ai.test.js`

**Interfaces:**
- Consumes: Task 2의 `checkWinner(board)`, `getAvailableMoves(board)`.
- Produces: `getMinimaxMove(board, aiSymbol, humanSymbol): number` (같은 `module.exports`/전역 노출 패턴).

- [ ] **Step 1: 실패하는 테스트 작성 — AI가 즉시 이길 수 있는 수를 찾아야 함**

```js
const { getMinimaxMove } = require('../../main/resources/static/js/ai.js');

test('getMinimaxMove takes the immediate winning move', () => {
  const board = ['O','O',null, 'X','X',null, null,null,null];
  assert.strictEqual(getMinimaxMove(board, 'O', 'X'), 2);
});
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `node --test src/test/js/ai.test.js`
Expected: FAIL (모듈 없음)

- [ ] **Step 3: `ai.js`에 `getMinimaxMove(board, aiSymbol, humanSymbol)` 구현**

표준 미니맥스: 보드가 9칸뿐이므로 깊이 제한 없이 전체 탐색. 각 리프에서 AI 승리는
`+10 - depth`, 인간 승리는 `depth - 10`, 무승부는 `0`으로 평가해 더 빠른 승리/더 느린
패배를 선호하도록 한다. AI 차례에서는 최댓값을, 인간 차례에서는 최솟값을 선택한다.

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `node --test src/test/js/ai.test.js`
Expected: PASS

- [ ] **Step 5: 실패하는 테스트 작성 — AI가 인간의 승리를 막아야 함**

```js
test('getMinimaxMove blocks the human from winning', () => {
  const board = ['X','X',null, 'O',null,null, null,null,null];
  assert.strictEqual(getMinimaxMove(board, 'O', 'X'), 2);
});
```

- [ ] **Step 6: 테스트 실행해 통과 확인 (이미 구현되어 있다면 바로 통과해야 함)**

Run: `node --test src/test/js/ai.test.js`
Expected: PASS

- [ ] **Step 7: 실패하는 테스트 작성 — 완벽한 두 플레이어가 끝까지 두면 항상 무승부**

```js
test('minimax vs minimax from empty board always ends in a draw', () => {
  let board = createEmptyBoard();
  let turn = 'X';
  while (checkWinner(board) === null) {
    const move = turn === 'X'
      ? getMinimaxMove(board, 'X', 'O')
      : getMinimaxMove(board, 'O', 'X');
    board[move] = turn;
    turn = turn === 'X' ? 'O' : 'X';
  }
  assert.strictEqual(checkWinner(board), 'draw');
});
```

- [ ] **Step 8: 테스트 실행해 통과 확인**

Run: `node --test src/test/js/ai.test.js`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add src/main/resources/static/js/ai.js src/test/js/ai.test.js
git commit -m "feat: add unbeatable minimax AI for hard difficulty"
```

---

### Task 4: 결과 저장소 (SQLite 적재/집계)

**Files:**
- Create: `src/main/java/com/tictactoe/Difficulty.java`
- Create: `src/main/java/com/tictactoe/Outcome.java`
- Create: `src/main/java/com/tictactoe/DifficultyStats.java`
- Create: `src/main/java/com/tictactoe/ResultsRepository.java`
- Create: `src/main/java/com/tictactoe/JdbcResultsRepository.java`
- Create: `src/main/resources/schema.sql`
- Test: `src/test/java/com/tictactoe/JdbcResultsRepositoryTest.java`

**Interfaces:**
- Produces: `enum Difficulty { EASY, HARD }`, `enum Outcome { WIN, LOSE, DRAW }`,
  `record DifficultyStats(int win, int lose, int draw)`,
  `interface ResultsRepository { void save(Difficulty difficulty, Outcome outcome); Map<Difficulty, DifficultyStats> aggregate(); }`,
  `class JdbcResultsRepository implements ResultsRepository` (`@Repository`, `JdbcTemplate` 생성자 주입).
  `aggregate()`는 기록이 없는 난이도도 `DifficultyStats(0,0,0)`으로 채워서 반환한다
  (맵에 EASY, HARD 키가 항상 존재).

- [ ] **Step 1: `schema.sql` 작성**

```sql
CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  difficulty TEXT NOT NULL,
  outcome TEXT NOT NULL,
  created_at TEXT NOT NULL
);
```

- [ ] **Step 2: `Difficulty`, `Outcome`, `DifficultyStats` 정의**

- [ ] **Step 3: 실패하는 테스트 작성 — save 후 aggregate가 정확히 집계되는지, 그리고 기록 없는 난이도도 0으로 채워지는지**

```java
@JdbcTest
@Import(JdbcResultsRepository.class)
class JdbcResultsRepositoryTest {

    @Autowired JdbcTemplate jdbcTemplate;
    ResultsRepository repository;

    @BeforeEach
    void setUp() { repository = new JdbcResultsRepository(jdbcTemplate); }

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
```

`@TestPropertySource`로 `spring.datasource.url=jdbc:sqlite:${java.io.tmpdir}/tictactoe-test-<임의값>.db`
를 지정해 실제 앱의 DB 파일과 분리한다 (예: `@DynamicPropertySource`로 `@TempDir` 경로 사용).

- [ ] **Step 4: 테스트 실행해 실패 확인**

Run: `./gradlew test --tests JdbcResultsRepositoryTest`
Expected: FAIL (`JdbcResultsRepository` 없음)

- [ ] **Step 5: `JdbcResultsRepository` 구현**

`save`는 `results` 테이블에 INSERT (created_at은 `Instant.now().toString()`).
`aggregate`는 `SELECT difficulty, outcome, COUNT(*) AS cnt FROM results GROUP BY difficulty, outcome`
결과를 `Map<Difficulty, DifficultyStats>`로 변환하고, EASY/HARD 모두 기본값
`DifficultyStats(0,0,0)`에서 시작해 덮어쓴다.

- [ ] **Step 6: 테스트 실행해 통과 확인**

Run: `./gradlew test --tests JdbcResultsRepositoryTest`
Expected: PASS

- [ ] **Step 7: 커밋**

```bash
git add src/main/java/com/tictactoe/Difficulty.java src/main/java/com/tictactoe/Outcome.java \
  src/main/java/com/tictactoe/DifficultyStats.java src/main/java/com/tictactoe/ResultsRepository.java \
  src/main/java/com/tictactoe/JdbcResultsRepository.java src/main/resources/schema.sql \
  src/test/java/com/tictactoe/JdbcResultsRepositoryTest.java
git commit -m "feat: persist and aggregate game results per difficulty in SQLite"
```

---

### Task 5: REST API (`/api/results`, `/api/stats`)

**Files:**
- Create: `src/main/java/com/tictactoe/ResultRequest.java`
- Create: `src/main/java/com/tictactoe/StatsResponse.java`
- Create: `src/main/java/com/tictactoe/ResultsService.java`
- Create: `src/main/java/com/tictactoe/ResultsController.java`
- Test: `src/test/java/com/tictactoe/ResultsServiceTest.java`
- Test: `src/test/java/com/tictactoe/ResultsControllerTest.java`

**Interfaces:**
- Consumes: Task 4의 `ResultsRepository`, `Difficulty`, `Outcome`, `DifficultyStats`.
- Produces: `record ResultRequest(@NotNull Difficulty difficulty, @NotNull Outcome outcome)`,
  `record StatsResponse(DifficultyStats easy, DifficultyStats hard)`,
  `class ResultsService { void recordResult(Difficulty, Outcome); StatsResponse getStats(); }`,
  `@RestController class ResultsController` with
  `POST /api/results` (`@Valid @RequestBody ResultRequest` → 204 No Content) and
  `GET /api/stats` (→ `StatsResponse`, 200 OK).

- [ ] **Step 1: 실패하는 테스트 작성 — `ResultsService.getStats()`가 리포지토리 집계를 `StatsResponse`로 매핑**

```java
@Test
void getStatsMapsRepositoryAggregateToResponse() {
    ResultsRepository repo = mock(ResultsRepository.class);
    when(repo.aggregate()).thenReturn(Map.of(
        Difficulty.EASY, new DifficultyStats(2,1,0),
        Difficulty.HARD, new DifficultyStats(0,0,1)));
    ResultsService service = new ResultsService(repo);

    StatsResponse response = service.getStats();

    assertThat(response.easy()).isEqualTo(new DifficultyStats(2,1,0));
    assertThat(response.hard()).isEqualTo(new DifficultyStats(0,0,1));
}
```

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew test --tests ResultsServiceTest`
Expected: FAIL (`ResultsService` 없음)

- [ ] **Step 3: `ResultRequest`, `StatsResponse`, `ResultsService` 구현**

`recordResult`는 `repository.save(difficulty, outcome)`를 그대로 호출한다.

- [ ] **Step 4: 테스트 실행해 통과 확인**

Run: `./gradlew test --tests ResultsServiceTest`
Expected: PASS

- [ ] **Step 5: 실패하는 테스트 작성 — 컨트롤러: 정상 저장(204), 통계 조회(200), 잘못된 바디(400), 빈 통계(200, 0으로 채움)**

```java
@WebMvcTest(ResultsController.class)
class ResultsControllerTest {

    @Autowired MockMvc mockMvc;
    @MockBean ResultsService resultsService;

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
            new StatsResponse(new DifficultyStats(0,0,0), new DifficultyStats(0,0,0)));

        mockMvc.perform(get("/api/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.easy.win").value(0))
            .andExpect(jsonPath("$.hard.draw").value(0));
    }
}
```

- [ ] **Step 6: 테스트 실행해 실패 확인**

Run: `./gradlew test --tests ResultsControllerTest`
Expected: FAIL (`ResultsController` 없음)

- [ ] **Step 7: `ResultsController` 구현**

`POST /api/results`는 `@Valid @RequestBody ResultRequest`를 받아 `resultsService.recordResult(...)`
호출 후 `ResponseEntity.noContent().build()` 반환. `GET /api/stats`는
`resultsService.getStats()`를 그대로 반환. (필수 필드 누락은 `@Valid` + 전역 기본
예외 처리로, 존재하지 않는 enum 값은 Jackson 역직렬화 실패로 Spring Boot 기본
설정에 의해 자동으로 400이 반환된다.)

- [ ] **Step 8: 테스트 실행해 통과 확인**

Run: `./gradlew test --tests ResultsControllerTest`
Expected: PASS

- [ ] **Step 9: 커밋**

```bash
git add src/main/java/com/tictactoe/ResultRequest.java src/main/java/com/tictactoe/StatsResponse.java \
  src/main/java/com/tictactoe/ResultsService.java src/main/java/com/tictactoe/ResultsController.java \
  src/test/java/com/tictactoe/ResultsServiceTest.java src/test/java/com/tictactoe/ResultsControllerTest.java
git commit -m "feat: add REST API for submitting and querying game results"
```

---

### Task 6: 프론트엔드 UI 및 연결

**Files:**
- Create: `src/main/resources/static/index.html`
- Create: `src/main/resources/static/css/style.css`
- Create: `src/main/resources/static/js/api.js`
- Create: `src/main/resources/static/js/game.js`

**Interfaces:**
- Consumes: Task 2/3의 `createEmptyBoard`, `checkWinner`, `getRandomMove`, `getMinimaxMove`
  (브라우저에서는 `<script>` 태그로 전역 로드), Task 5의 `POST /api/results`,
  `GET /api/stats`.
- Produces: `api.js`의 `submitResult(difficulty: 'EASY'|'HARD', outcome: 'WIN'|'LOSE'|'DRAW'): Promise<void>`,
  `fetchStats(): Promise<{easy: DifficultyStats, hard: DifficultyStats}>`.

- [ ] **Step 1: `index.html` 작성** — 난이도 선택 화면(`#difficulty-select`, 쉬움/어려움 버튼),
  게임 보드 화면(`#game-board`, 3x3 셀, 결과 배너, "다시 시작" 버튼), 전적 패널
  (`#stats-panel`, easy/hard 각각 승/패/무 표시). `game-logic.js`, `ai.js`, `api.js`,
  `game.js` 순서로 `<script>` 태그 포함.

- [ ] **Step 2: `style.css` 작성** — 보드 grid, 선택 화면/게임 화면 전환을 위한 기본 레이아웃.

- [ ] **Step 3: `api.js` 작성**

```js
function submitResult(difficulty, outcome) {
  return fetch('/api/results', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ difficulty, outcome }),
  });
}

function fetchStats() {
  return fetch('/api/stats').then((res) => res.json());
}
```

- [ ] **Step 4: `game.js` 작성** — 상태(난이도, 보드, 현재 게임 진행 여부)를 모듈 스코프에
  보관. 난이도 선택 버튼 클릭 시 게임 화면으로 전환하고 보드 초기화. 셀 클릭 시
  (게임 진행 중이고 빈 칸일 때만) 사용자가 X를 두고 `checkWinner` 확인, 게임이
  끝나지 않았으면 선택된 난이도에 따라 `getRandomMove` 또는 `getMinimaxMove`로
  O를 둔 뒤 다시 `checkWinner` 확인. 게임이 승/패/무로 "완료"된 경우에만
  `submitResult(difficulty, outcome)`을 호출하고(사용자 관점: AI 승리 시
  `'LOSE'`, 사용자 승리 시 `'WIN'`, 무승부 시 `'DRAW'`), `fetchStats()`로 전적 패널을
  갱신한다. "다시 시작"은 보드만 초기화하고 결과를 전송하지 않으며, 진행 중
  게임을 버리고 새로고침/난이도 재선택을 해도 결과 전송 로직이 호출되지 않도록
  "게임 완료" 분기 안에서만 `submitResult`를 호출한다. 페이지 로드 시 `fetchStats()`로
  전적 패널을 초기화한다.

- [ ] **Step 5: 수동 검증 — 브라우저에서 `./gradlew bootRun` 실행 후 확인**

1. 쉬움 난이도로 몇 판을 두어 승/패/무 각각 발생시키고, 전적 패널이 쉬움 항목만
   증가하는지 확인한다.
2. 어려움 난이도로 최선을 다해 두어도 이기지 못하는지(승리 또는 무승부만 가능)
   확인한다.
3. 게임 도중 페이지를 새로고침하거나 "다시 시작"을 누르고, `GET /api/stats` 응답이
   변하지 않는지(중간 이탈은 기록되지 않는지) 확인한다.

- [ ] **Step 6: 커밋**

```bash
git add src/main/resources/static/index.html src/main/resources/static/css/style.css \
  src/main/resources/static/js/api.js src/main/resources/static/js/game.js
git commit -m "feat: wire up tic-tac-toe UI with difficulty selection and stats panel"
```

---

### Task 7: 엔드투엔드 통합 테스트 및 실행 문서

**Files:**
- Test: `src/test/java/com/tictactoe/GameFlowIntegrationTest.java`
- Create: `README.md`

**Interfaces:**
- Consumes: Task 1~6의 전체 앱(정적 리소스 서빙 + REST API).

- [ ] **Step 1: 실패하는 테스트 작성 — 정적 페이지 서빙 + 결과 저장/조회 전체 흐름**

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GameFlowIntegrationTest {

    @Autowired TestRestTemplate restTemplate;

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
```

각 테스트 실행마다 독립된 SQLite 파일을 쓰도록 `@DynamicPropertySource`로
`spring.datasource.url`을 `@TempDir` 경로로 지정한다.

- [ ] **Step 2: 테스트 실행해 실패 확인**

Run: `./gradlew test --tests GameFlowIntegrationTest`
Expected: FAIL (처음 실행 시 실제로는 통과할 수도 있음 — 통과한다면 의도적으로
어설션 값을 틀리게 바꿔 실제로 실패하는지 먼저 확인한 뒤 원복한다)

- [ ] **Step 3: 테스트가 올바른 어설션으로 통과하도록 확정**

Run: `./gradlew test --tests GameFlowIntegrationTest`
Expected: PASS

- [ ] **Step 4: `README.md` 작성** — 실행 방법(`./gradlew bootRun`), 테스트 방법
  (`./gradlew test`, `node --test src/test/js`), 난이도/전적 기능 간단 설명.

- [ ] **Step 5: 전체 테스트 스위트 실행**

Run: `./gradlew test && node --test src/test/js`
Expected: 모든 테스트 PASS

- [ ] **Step 6: 커밋**

```bash
git add src/test/java/com/tictactoe/GameFlowIntegrationTest.java README.md
git commit -m "test: add end-to-end game flow integration test and README"
```
