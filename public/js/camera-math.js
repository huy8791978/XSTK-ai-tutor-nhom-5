// Perspective math for camera capture (document quad -> flat rectangle).

/** 3x3 row-major matrix mapping 4 src points to 4 dst points; null when degenerate. */
export function homography(src, dst) {
  const A = [];
  for (let i = 0; i < 4; i++) {
    const [x, y] = src[i], [u, v] = dst[i];
    A.push([x, y, 1, 0, 0, 0, -u * x, -u * y, u]);
    A.push([0, 0, 0, x, y, 1, -v * x, -v * y, v]);
  }
  for (let c = 0; c < 8; c++) {
    let p = c;
    for (let r = c + 1; r < 8; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
    if (Math.abs(A[p][c]) < 1e-12) return null;
    [A[c], A[p]] = [A[p], A[c]];
    for (let r = 0; r < 8; r++) {
      if (r === c) continue;
      const f = A[r][c] / A[c][c];
      for (let k = c; k < 9; k++) A[r][k] -= f * A[c][k];
    }
  }
  return [...A.map((row, i) => row[8] / row[i]), 1];
}

/** Map a point through homography H. */
export function apply(H, [x, y]) {
  const w = H[6] * x + H[7] * y + H[8];
  return [(H[0] * x + H[1] * y + H[2]) / w, (H[3] * x + H[4] * y + H[5]) / w];
}

/** True when quad (TL, TR, BR, BL) is strictly convex. */
export function isConvex(q) {
  let sign = 0;
  for (let i = 0; i < 4; i++) {
    const [a, b, c] = [q[i], q[(i + 1) % 4], q[(i + 2) % 4]];
    const z = (b[0] - a[0]) * (c[1] - b[1]) - (b[1] - a[1]) * (c[0] - b[0]);
    if (z === 0 || (sign && Math.sign(z) !== sign)) return false;
    sign = Math.sign(z);
  }
  return true;
}

/** Output size: mean of opposite edge lengths, both scaled by one factor so the longer side is at most 2000. */
export function outSize(q) {
  const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const w = (d(q[0], q[1]) + d(q[3], q[2])) / 2, h = (d(q[0], q[3]) + d(q[1], q[2])) / 2;
  const s = Math.min(1, 2000 / Math.max(w, h)); // one factor keeps the paper's aspect
  return { w: Math.round(w * s), h: Math.round(h * s) };
}

/** Photo slots remaining. */
export const slotsLeft = (count, max = 3) => Math.max(0, max - count);
