export const GAME_MODES = Object.freeze({
  match: Object.freeze({ duration: 180, hasRival: true, hasTimer: true, countsGoals: true }),
  training: Object.freeze({ duration: 0, hasRival: false, hasTimer: false, countsGoals: false })
});

export function getGameMode(mode) {
  return GAME_MODES[mode] ?? GAME_MODES.match;
}

export function isGoalPosition(position, options = {}) {
  const goalHalfWidth = options.goalHalfWidth ?? 5;
  const goalHeight = options.goalHeight ?? 4.5;
  const ballRadius = options.ballRadius ?? 1.5;
  const goalPlane = options.goalPlane ?? 29.2;
  const postHalfThickness = options.postHalfThickness ?? 0.18;
  const crossbarHalfThickness = options.crossbarHalfThickness ?? 0.18;
  const safeHalfWidth = goalHalfWidth - ballRadius - postHalfThickness;
  const maxBallCenterY = goalHeight - ballRadius - crossbarHalfThickness;

  return Math.abs(position.z) > goalPlane
    && Math.abs(position.x) < safeHalfWidth
    && position.y >= ballRadius - 0.1
    && position.y < maxBallCenterY;
}
