let pathsCache: { witch: Path2D; ships: Record<string, Path2D> } | null = null;

export const getPaths = () => {
  if (pathsCache) return pathsCache;

  const witch = new Path2D(
    "M -2 -12 L 8 -12 M 1 -12 L 6 -22 L 7 -12 " +
    "M 3 -12 L 7 -2 L -1 1 Z " +
    "M -1 -2 Q -10 2 -15 -3 Q -10 0 -2 3 " +
    "M -20 4 L 15 0 " +
    "M -20 4 L -28 1 M -20 4 L -30 5 M -20 4 L -26 9"
  );

  const ships: Record<string, Path2D> = {
    ferry: new Path2D("M -35 0 L 35 0 L 30 10 L -30 10 Z M -30 0 L -25 -12 L 25 -12 L 30 0 M -20 -12 L -15 -20 L 15 -20 L 20 -12 M -15 -6 L -10 -6 M -5 -6 L 0 -6 M 5 -6 L 10 -6 M 15 -6 L 20 -6"),
    catamaran: new Path2D("M -35 0 L 25 0 L 35 -10 L 25 -10 Z M -30 0 L -25 -15 L 15 -15 L 25 -10 M -15 -15 L -10 -22 L 5 -22 L 10 -15 M -10 -7 L 10 -7"),
    tugboat: new Path2D("M -20 0 L 15 0 L 20 -5 L 20 5 L -15 5 Z M -5 0 L -5 -12 L 8 -12 L 8 0 M -2 -12 L -2 -18 L 2 -18 L 2 -12 M 2 -6 L 5 -6"),
    cargo: new Path2D("M -40 0 L 40 0 L 35 6 L -35 6 Z M -30 0 L -30 -10 L -10 -10 L -10 0 M -5 0 L -5 -15 L 15 -15 L 15 0 M 25 0 L 25 -12 L 35 -12 L 35 0 M -35 0 L -35 -18 L -30 -18 L -30 0"),
    sailboat: new Path2D("M -15 0 L 15 0 Q 0 8 -15 0 M 0 0 L 0 -35 L 15 -5 L 0 -5"),
  };

  pathsCache = { witch, ships };
  return pathsCache;
};
