import { dbscan, type Point, type DbscanOptions, type Clustering } from '@lp-labs/point-clustering';
const points: readonly Point[] = [{ x: 0, y: 0 }];
const options: DbscanOptions = { epsilon: 1, minPoints: 1, maxComparisons: 1 };
const result: Clustering = dbscan(points, options);
void result;
// @ts-expect-error minPoints is required.
dbscan(points, { epsilon: 1 });
// @ts-expect-error Labels are readonly in the declared contract.
result.labels.push(2);
