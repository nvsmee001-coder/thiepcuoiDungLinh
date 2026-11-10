import * as THREE from "three";

// The paper figure has separate, unskinned pieces whose vertices share one
// model-space origin. Keep each colored piece and its outline on the same joint.
export function createSwimRig(character) {
  const makeJoint = (name, pivot, names) => {
    const pieces = names.map((pieceName) => character.getObjectByName(pieceName)).filter(Boolean);
    const joint = new THREE.Group();
    joint.name = name;
    joint.position.set(...pivot);
    character.add(joint);
    character.updateWorldMatrix(true, true);
    // attach preserves the supplied pose and depth ordering without changing
    // geometry, which remains shared with useGLTF's cached original scene.
    for (const piece of pieces) joint.attach(piece);
    return joint;
  };

  const leftArm = makeJoint("Swim_left_shoulder", [-0.85, 0.35, 0.05], [
    "Left_flipper_outline", "Left_flipper",
  ]);
  const rightArm = makeJoint("Swim_right_shoulder", [0.98, 0.27, -0.075], [
    "Raised_right_flipper_outline", "Raised_right_flipper",
  ]);
  const leftFoot = makeJoint("Swim_left_ankle", [-0.64, -1.26, 0.1], [
    "Left_webbed_foot_outline", "Left_webbed_foot",
  ]);
  const rightFoot = makeJoint("Swim_right_ankle", [0.64, -1.26, 0.1], [
    "Right_webbed_foot_outline", "Right_webbed_foot",
  ]);
  const tailNames = [];
  character.traverse((object) => {
    if (/^(Paddle_tail(?:_outline)?|Tail_lattice_.*)$/.test(object.name)) tailNames.push(object.name);
  });
  const tail = makeJoint("Swim_tail_root", [-0.65, -0.7, -0.2], tailNames);

  return {
    paddleJoint: rightArm,
    row(time) {
      const phase = (Number.isFinite(time) ? time : 0) * 1.8;
      const stroke = Math.sin(phase);
      // The raised right flipper carries the paddle; the other flipper follows
      // with a small counter-motion while the seated lower body stays at rest.
      rightArm.rotation.set(0, 0, 0.02 + stroke * 0.05);
      leftArm.rotation.set(0, 0, -0.32 - stroke * 0.1);
      leftFoot.rotation.set(0, 0, 0);
      rightFoot.rotation.set(0, 0, 0);
      tail.rotation.set(0, 0, 0);
    },
    update(time, weight) {
      const blend = Number.isFinite(weight) ? THREE.MathUtils.clamp(weight, 0, 1) : 0;
      // Explicit zeroes recover the original pose, including during scroll reversal.
      if (blend === 0) {
        leftArm.rotation.set(0, 0, 0);
        rightArm.rotation.set(0, 0, 0);
        leftFoot.rotation.set(0, 0, 0);
        rightFoot.rotation.set(0, 0, 0);
        tail.rotation.set(0, 0, 0);
        return;
      }
      const phase = (Number.isFinite(time) ? time : 0) * 5.2;
      const stroke = Math.sin(phase);
      const kick = Math.sin(phase * 2 + 0.7);
      // Alternating reach/recovery arcs stay in the illustration plane. The
      // asymmetrical baselines account for the supplied raised right flipper.
      leftArm.rotation.z = (-1.15 + stroke * 1.2) * blend;
      rightArm.rotation.z = (0.45 - stroke * 1.2) * blend;
      leftFoot.rotation.z = (0.12 + kick * 0.38) * blend;
      rightFoot.rotation.z = (-0.12 - kick * 0.38) * blend;
      tail.rotation.z = Math.sin(phase * 2 - 0.4) * 0.16 * blend;
    },
  };
}
