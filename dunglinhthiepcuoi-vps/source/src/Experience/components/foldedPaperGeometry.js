import * as THREE from "three";

// Clip the original artwork rectangle against the spine in card coordinates.
// Interpolated UVs keep photographs, borders and tilted edges joined exactly.
export function createFoldedPaperHalf({ width, height, x = 0, y = 0, z = 0, rotation = 0 }, side) {
  const cosine = Math.cos(rotation), sine = Math.sin(rotation);
  const rectangle = [
    [-width / 2, height / 2, 0, 1],
    [-width / 2, -height / 2, 0, 0],
    [width / 2, -height / 2, 1, 0],
    [width / 2, height / 2, 1, 1],
  ].map(([px, py, u, v]) => ({ x: x + px * cosine - py * sine, y: y + px * sine + py * cosine, u, v }));
  const clipped = [];
  for (let i = 0; i < rectangle.length; i++) {
    const a = rectangle[i], b = rectangle[(i + 1) % rectangle.length];
    const aInside = side * a.x >= 0, bInside = side * b.x >= 0;
    if (aInside) clipped.push(a);
    if (aInside !== bInside) {
      const t = -a.x / (b.x - a.x);
      clipped.push({ x: 0, y: a.y + (b.y - a.y) * t, u: a.u + (b.u - a.u) * t, v: a.v + (b.v - a.v) * t });
    }
  }
  const positions = [], uv = [];
  for (let i = 1; i < clipped.length - 1; i++) {
    for (const vertex of [clipped[0], clipped[i], clipped[i + 1]]) {
      positions.push(vertex.x, vertex.y, z);
      uv.push(vertex.u, vertex.v);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}
