import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import * as esm from '../dist/esm/index.js';
const require = createRequire(import.meta.url);
const cjs = require('../dist/cjs/index.js');
test('CommonJS and ESM runtime behavior and export parity', () => {
  assert.deepEqual(Object.keys(esm).sort(), Object.keys(cjs).sort());
  const sample = ({ dbscan }) =>
    dbscan(
      [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
      ],
      { epsilon: 1, minPoints: 2 },
    );
  assert.deepEqual(sample(esm), sample(cjs));
});
