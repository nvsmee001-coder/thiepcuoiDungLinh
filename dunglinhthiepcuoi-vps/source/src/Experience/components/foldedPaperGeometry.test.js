import test from "node:test";
import assert from "node:assert/strict";
import { createFoldedPaperHalf } from "./foldedPaperGeometry.js";

const close = (actual, expected, tolerance = 1e-6) => {
  assert.ok(Math.abs(actual - expected) < tolerance, `${actual} differs from ${expected}`);
};

function area(geometry) {
  const points = geometry.attributes.position;
  let total = 0;
  for (let i = 0; i < points.count; i += 3) {
    const ax = points.getX(i + 1) - points.getX(i), ay = points.getY(i + 1) - points.getY(i);
    const bx = points.getX(i + 2) - points.getX(i), by = points.getY(i + 2) - points.getY(i);
    const triangle = (ax * by - ay * bx) / 2;
    assert.ok(triangle >= 0, "clipping must preserve front-facing triangle winding");
    total += triangle;
  }
  return total;
}

function verifyTextureAndSide(geometry, specification, side) {
  const points = geometry.attributes.position, uv = geometry.attributes.uv;
  const rotation = specification.rotation || 0;
  for (let i = 0; i < points.count; i++) {
    assert.ok(side * points.getX(i) >= -1e-6, "a half must not extend across the spine");
    const x = points.getX(i) - (specification.x || 0);
    const y = points.getY(i) - (specification.y || 0);
    const originalX = x * Math.cos(rotation) + y * Math.sin(rotation);
    const originalY = -x * Math.sin(rotation) + y * Math.cos(rotation);
    close(uv.getX(i), originalX / specification.width + .5);
    close(uv.getY(i), originalY / specification.height + .5);
    assert.ok(uv.getX(i) >= 0 && uv.getX(i) <= 1);
    assert.ok(uv.getY(i) >= 0 && uv.getY(i) <= 1);
    close(points.getZ(i), specification.z || 0);
  }
}

test("flat paper halves reconstruct the original rectangle without changing texture placement", () => {
  const paper = { width: 5.5, height: 4.7, y: .4 };
  const halves = [-1, 1].map((side) => createFoldedPaperHalf(paper, side));
  try {
    halves.forEach((half, i) => {
      close(area(half), paper.width * paper.height / 2, 1e-5);
      verifyTextureAndSide(half, paper, i === 0 ? -1 : 1);
    });
    close(area(halves[0]) + area(halves[1]), paper.width * paper.height, 1e-5);
  } finally { halves.forEach((half) => half.dispose()); }
});

test("a tilted venue photo and its frame keep their complete area and original UVs", () => {
  for (const surface of [
    { width: 2.18, height: 2.18, x: -.85, y: -.68, z: .025, rotation: -.015 },
    { width: 2.18, height: 2.18 * 1351 / 2048, x: -.85, y: -.68, z: .025, rotation: -.015 },
    { width: 2.36, height: 2.18 * 1351 / 2048 + .2, x: -.85, y: -.68, z: .015, rotation: -.015 },
  ]) {
    const halves = [-1, 1].map((side) => createFoldedPaperHalf(surface, side));
    try {
      assert.ok(halves.every((half) => area(half) > 0), "the photo crosses the crease into both panels");
      halves.forEach((half, i) => verifyTextureAndSide(half, surface, i === 0 ? -1 : 1));
      close(area(halves[0]) + area(halves[1]), surface.width * surface.height, 1e-5);
    } finally { halves.forEach((half) => half.dispose()); }
  }
});

test("both sides of a rotated photo share identical texture coordinates along the crease", () => {
  const photo = { width: 2.18, height: 2.18, x: -.85, y: -.68, rotation: -.015 };
  const halves = [-1, 1].map((side) => createFoldedPaperHalf(photo, side));
  const seam = (geometry) => {
    const points = geometry.attributes.position, uv = geometry.attributes.uv;
    const vertices = [];
    for (let i = 0; i < points.count; i++) {
      if (Math.abs(points.getX(i)) < 1e-6) vertices.push([points.getY(i), uv.getX(i), uv.getY(i)]);
    }
    return vertices;
  };
  try {
    const left = seam(halves[0]), right = seam(halves[1]);
    assert.ok(left.length >= 2 && right.length >= 2);
    for (const vertex of [...left, ...right]) {
      const counterpart = (left.includes(vertex) ? right : left).find((candidate) => Math.abs(candidate[0] - vertex[0]) < 1e-6);
      assert.ok(counterpart, "both panels need the same crease endpoint");
      vertex.forEach((coordinate, index) => close(coordinate, counterpart[index]));
    }
  } finally { halves.forEach((half) => half.dispose()); }
});
