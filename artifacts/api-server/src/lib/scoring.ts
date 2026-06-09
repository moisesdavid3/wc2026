export function calculatePoints(
  predHome: number,
  predAway: number,
  actualHome: number,
  actualAway: number
): number {
  // Exact score: 5 points
  if (predHome === actualHome && predAway === actualAway) {
    return 5;
  }

  const predOutcome = Math.sign(predHome - predAway);
  const actualOutcome = Math.sign(actualHome - actualAway);

  // Correct draw (both predicted draw): 3 points
  if (predOutcome === 0 && actualOutcome === 0) {
    return 3;
  }

  // Correct winner (non-draw): 3 points
  if (predOutcome !== 0 && predOutcome === actualOutcome) {
    return 3;
  }

  return 0;
}
