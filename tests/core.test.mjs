import test from 'node:test';
import assert from 'node:assert/strict';
import { dbscan } from '../dist/esm/index.js';
test('clusters and isolated noise with inclusive neighborhoods', () => {
  const p = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 10, y: 0 },
    { x: 11, y: 0 },
    { x: 100, y: 100 },
  ];
  assert.deepEqual(dbscan(p, { epsilon: 1, minPoints: 2 }), {
    labels: [0, 0, 1, 1, -1],
    clusters: [
      [0, 1],
      [2, 3],
    ],
    noise: [4],
  });
});
test('duplicates epsilon zero and self minPoints', () => {
  assert.deepEqual(
    dbscan(
      [
        { x: 0, y: 0 },
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      { epsilon: 0, minPoints: 2 },
    ).labels,
    [0, 0, -1],
  );
  assert.deepEqual(
    dbscan(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      { epsilon: 0, minPoints: 1 },
    ).labels,
    [0, 1],
  );
});
test('noise promoted to border and deterministic first-cluster tie', () => {
  const p = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1.1, y: 0 },
    { x: 1.2, y: 0 },
  ];
  assert.deepEqual(dbscan(p, { epsilon: 1, minPoints: 4 }).labels, [0, 0, 0, 0]);
  const tie = [-0.8, -0.9, -1, -1.1, 0, 0.8, 0.9, 1, 1.1].map((x) => ({ x, y: 0 }));
  const result = dbscan(tie, { epsilon: 0.81, minPoints: 4 });
  assert.equal(result.labels[4], 0);
  assert.equal(result.clusters.length, 2);
});
test('empty, all noise and minPoints larger than input', () => {
  assert.deepEqual(dbscan([], { epsilon: 1, minPoints: 1, maxComparisons: 0 }), {
    labels: [],
    clusters: [],
    noise: [],
  });
  assert.deepEqual(dbscan([{ x: 0, y: 0 }], { epsilon: 1, minPoints: 2 }).noise, [0]);
});
test('exact budget and invalid finite options', () => {
  const p = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
  ];
  assert.throws(() => dbscan(p, { epsilon: 1, minPoints: 1, maxComparisons: 3 }), RangeError);
  assert.equal(dbscan(p, { epsilon: 1, minPoints: 1, maxComparisons: 4 }).clusters.length, 1);
  for (const opts of [
    { epsilon: -1, minPoints: 1 },
    { epsilon: Infinity, minPoints: 1 },
    { epsilon: 1, minPoints: 0 },
    { epsilon: 1, minPoints: 1.5 },
  ])
    assert.throws(() => dbscan(p, opts), RangeError);
  assert.throws(() => dbscan([{ x: NaN, y: 0 }], { epsilon: 1, minPoints: 1 }), RangeError);
});
test('ownership and Euclidean rather than square metric', () => {
  const p = [
      { x: 0, y: 0 },
      { x: 1, y: 1 },
    ],
    copy = structuredClone(p);
  assert.deepEqual(dbscan(p, { epsilon: 1, minPoints: 2 }).labels, [-1, -1]);
  assert.deepEqual(p, copy);
});
test('seeded independent core-component and border oracle', () => {
  let seed = 415;
  const random = () => (seed = (1664525 * seed + 1013904223) >>> 0) / 2 ** 32;
  for (let run = 0; run < 50; run++) {
    const p = Array.from({ length: 30 }, () => ({ x: random() * 5, y: random() * 5 })),
      eps = 0.8,
      min = 4;
    const near = p.map((a) =>
      p
        .map((b, j) => ({ d: (a.x - b.x) ** 2 + (a.y - b.y) ** 2, j }))
        .filter((v) => v.d <= eps ** 2)
        .map((v) => v.j),
    );
    const core = near.map((a) => a.length >= min),
      labels = Array(p.length).fill(-1);
    let id = 0;
    for (let i = 0; i < p.length; i++)
      if (core[i] && labels[i] < 0) {
        const stack = [i];
        labels[i] = id;
        while (stack.length) {
          for (const j of near[stack.pop()])
            if (core[j] && labels[j] < 0) {
              labels[j] = id;
              stack.push(j);
            }
        }
        id++;
      }
    for (let i = 0; i < p.length; i++)
      if (!core[i]) {
        const ids = near[i].filter((j) => core[j]).map((j) => labels[j]);
        if (ids.length) labels[i] = Math.min(...ids);
      }
    assert.deepEqual(dbscan(p, { epsilon: eps, minPoints: min }).labels, labels);
  }
});
