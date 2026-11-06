# @lp-labs/point-clustering

Deterministic bounded Euclidean 2D DBSCAN with explicit core/border/noise semantics, not k-means or geographic clustering.

Catalog ID 415. Version 0.1.0. Standalone, zero runtime, peer or sibling dependencies.
Node.js >=18; strict TypeScript; NodeNext ESM and CommonJS with separate declaration trees.

## Install

```sh
npm install @lp-labs/point-clustering
```

## Quickstart (JavaScript ESM)

```js
import { dbscan } from '@lp-labs/point-clustering';
console.log(
  dbscan(
    [
      { x: 0, y: 0 },
      { x: 0.1, y: 0 },
      { x: 10, y: 10 },
    ],
    { epsilon: 0.2, minPoints: 2 },
  ),
);
// labels [0,0,-1], clusters [[0,1]], noise [2]
```

CommonJS exposes the same named exports with `require('@lp-labs/point-clustering')`.
Use the bare package name in NodeNext TypeScript `.mts` and `.cts` consumers.
The package has no default export, global side effects, browser globals, network access or file access.

## Contracts, options, errors and customization

- `dbscan` counts the query point itself toward `minPoints` (positive safe integer). Duplicate coordinates remain separate observations. `epsilon` is finite in `[0,1e100]`; Euclidean distance uses `Math.hypot`, inclusive boundary `<= epsilon`.
- Input order controls discovery: cluster IDs start at zero in first-core discovery order. Border points reachable from more than one component belong to the first discovered cluster. Earlier noise can become border. Noise labels are `-1`, noise and cluster member arrays contain input indices in increasing order.
- Up to `10000` points with finite coordinates of absolute value <= `1e100`. `maxComparisons` defaults to `10000000`, safe integer `0..100000000`; preflight requires `n*n <= maxComparisons`. Empty input works with zero budget; minPoints greater than n makes all points noise.
- `RangeError` rejects invalid inputs or exceeded conservative preflight budget; no partial result. O(n²) time and O(n) auxiliary space, no spatial index or stored n² matrix. A region query runs once per visited point.
- Inputs are not mutated; result arrays are independently allocated (readonly is a TypeScript contract, not deep freeze). Floating-point boundary distances may round. Customize radius, density threshold and explicit work budget.

## Complete public declarations

All runtime exports, public types, options and return values follow. Readonly declarations
describe caller-facing ownership; results are not recursively frozen at runtime.

```ts
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
export declare function dbscan(points: readonly Point[], options: DbscanOptions): Clustering;
```

## Development and verification

```sh
npm ci --offline --ignore-scripts --no-audit --no-fund
npm run build
npm run typecheck
npm test
npm run format:check
```

An offline install requires the pinned lockfile's development packages in the local npm cache.
Development-only dependencies: TypeScript ^5.9.3 and Prettier ^3.6.2.
Build emits `dist/esm` and `dist/cjs`, each with declarations; CommonJS has its own package boundary.
Tests cover finite bounds, degeneracy, ownership, work limits, deterministic results and independent reference checks.
Consumer fixtures exercise bare-package ESM/CJS declaration resolution with negative compile-time checks.
Only dist, README, LICENSE and package metadata are published. No automatic publishing is performed.

## Support

If this library is useful to you, consider supporting its maintenance with a [donation via PayPal](https://www.paypal.me/LibinPrasanth).

## Author

Created by [Libin Prasanth](https://www.linkedin.com/in/libinprasanth/). Connect on LinkedIn for updates and discussion.
