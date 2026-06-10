export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  let points = 0;

  // Exact score: 5 points
  const exact = predHome === actualHome && predAway === actualAway;
  if (exact) {
    points += 5;
  }

  // Correct outcome: 3 points (only if not already exact)
  if (!exact) {
    const predOutcome = Math.sign(predHome - predAway);
    const actualOutcome = Math.sign(actualHome - actualAway);
    if (predOutcome === actualOutcome) {
      points += 3;
    }
  }

  // Goal difference bonus: 1 point if absolute diff matches (any number)
  if (Math.abs(predHome - predAway) === Math.abs(actualHome - actualAway)) {
    points += 1;
  }

  return points;
}
