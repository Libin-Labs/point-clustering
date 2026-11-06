export interface Point {
  readonly x: number;
  readonly y: number;
}
export interface DbscanOptions {
  readonly epsilon: number;
  /** Includes the query point itself, including duplicate coordinates. */
  readonly minPoints: number;
  readonly maxComparisons?: number;
}
export interface Clustering {
  /** -1 is noise; zero-based cluster IDs follow first core-point discovery order. */
  readonly labels: readonly number[];
  readonly clusters: readonly (readonly number[])[];
  readonly noise: readonly number[];
}
/** Deterministic DBSCAN. Border ties belong to the first discovered cluster. */
export function dbscan(points: readonly Point[], options: DbscanOptions): Clustering {
  const { epsilon, minPoints, maxComparisons = 10_000_000 } = options,
    n = points.length;
  if (
    !Number.isFinite(epsilon) ||
    epsilon < 0 ||
    epsilon > 1e100 ||
    !Number.isSafeInteger(minPoints) ||
    minPoints < 1 ||
    !Number.isSafeInteger(maxComparisons) ||
    maxComparisons < 0 ||
    maxComparisons > 100_000_000 ||
    n > 10_000 ||
    n * n > maxComparisons
  )
    throw new RangeError('Invalid options or comparison budget');
  for (const p of points)
    if (
      !Number.isFinite(p.x) ||
      !Number.isFinite(p.y) ||
      Math.abs(p.x) > 1e100 ||
      Math.abs(p.y) > 1e100
    )
      throw new RangeError('Finite coordinate bound 1e100');
  const labels: number[] = Array(n).fill(-2),
    visited = new Uint8Array(n),
    queued = new Uint8Array(n);
  const region = (i: number): number[] => {
    const a = points[i]!,
      neighbors: number[] = [];
    for (let j = 0; j < n; j++)
      if (Math.hypot(a.x - points[j]!.x, a.y - points[j]!.y) <= epsilon) neighbors.push(j);
    return neighbors;
  };
  let cluster = 0;
  for (let i = 0; i < n; i++) {
    if (visited[i]) continue;
    visited[i] = 1;
    const neighbors = region(i);
    if (neighbors.length < minPoints) {
      labels[i] = -1;
      continue;
    }
    labels[i] = cluster;
    const queue: number[] = [];
    const enqueue = (ids: readonly number[]) => {
      for (const id of ids)
        if (!queued[id]) {
          queued[id] = 1;
          queue.push(id);
        }
    };
    enqueue(neighbors);
    for (let head = 0; head < queue.length; head++) {
      const j = queue[head]!;
      if (!visited[j]) {
        visited[j] = 1;
        const next = region(j);
        if (next.length >= minPoints) enqueue(next);
      }
      if (labels[j]! < 0) labels[j] = cluster;
    }
    cluster++;
  }
  const clusters: number[][] = Array.from({ length: cluster }, () => []),
    noise: number[] = [];
  labels.forEach((id, index) => {
    if (id === -1) noise.push(index);
    else clusters[id]!.push(index);
  });
  return { labels, clusters, noise };
}
