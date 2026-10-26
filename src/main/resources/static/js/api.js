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
