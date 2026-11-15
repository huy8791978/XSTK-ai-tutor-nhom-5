import { test } from 'node:test'; import assert from 'node:assert/strict';
import { homography, apply, isConvex, outSize, slotsLeft } from '../public/js/camera-math.js';
const near = (a, b) => assert.ok(Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(a[1] - b[1]) < 1e-6, `${a} ≉ ${b}`);
test('homography maps each corner onto the rectangle', () => {
  const src = [[10, 20], [300, 5], [320, 410], [0, 400]], dst = [[0, 0], [200, 0], [200, 300], [0, 300]];
  const H = homography(src, dst); src.forEach((p, i) => near(apply(H, p), dst[i]));
});
test('identity quad gives the identity map', () => { const q = [[0,0],[1,0],[1,1],[0,1]]; near(apply(homography(q, q), [0.3, 0.7]), [0.3, 0.7]); });
test('degenerate quad gives null', () => assert.equal(homography([[0,0],[0,0],[0,0],[0,0]], [[0,0],[1,0],[1,1],[0,1]]), null));
test('isConvex', () => { assert.ok(isConvex([[0,0],[10,0],[10,10],[0,10]])); assert.ok(!isConvex([[0,0],[10,10],[10,0],[0,10]])); });
test('outSize keeps portrait paper portrait', () => assert.deepEqual(outSize([[0,0],[210,0],[210,297],[0,297]]), { w: 210, h: 297 }));
test('outSize caps at 2000', () => assert.deepEqual(outSize([[0,0],[4000,0],[4000,1000],[0,1000]]), { w: 2000, h: 500 }));
test('slotsLeft', () => { assert.equal(slotsLeft(0), 3); assert.equal(slotsLeft(3), 0); assert.equal(slotsLeft(5), 0); });
