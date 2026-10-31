import { useRef, useState } from "react";
import * as THREE from "three";

export const useScrollCurve = (initialCurve, initialPoints, shiftAmount) => {
  const curveRef = useRef(initialCurve);
  const curvePointsRef = useRef([...initialPoints]);
  const initialCurvePointsRef = useRef(initialPoints.map((v) => v.clone()));

  const loopCounter = useRef(1);
  const transitionCurveActive = useRef(false);

  const transitionCurvePointsRef = useRef([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0, 0, 0),
  ]);

  const initiateTransitionCurve = () => {
    const targetLoopIndex = loopCounter.current;

    transitionCurvePointsRef.current = [
      initialCurvePointsRef.current[initialCurvePointsRef.current.length - 1]
        .clone()
        .add(new THREE.Vector3(shiftAmount * (targetLoopIndex - 1), 0, 0)),

      initialCurvePointsRef.current[0]
        .clone()
        .add(new THREE.Vector3(shiftAmount * targetLoopIndex, 0, 0)),
    ];

    curvePointsRef.current = transitionCurvePointsRef.current;
    curveRef.current.points = transitionCurvePointsRef.current;
    curveRef.current.needsUpdate = true;
  };

  const shiftCurvePoints = (direction = "forward") => {
    let shiftedPoints = [];
    if (direction === "forward") {
      shiftedPoints = initialCurvePointsRef.current.map((point) =>
        point
          .clone()
          .add(new THREE.Vector3(shiftAmount * loopCounter.current, 0, 0))
      );
    } else {
      shiftedPoints = initialCurvePointsRef.current.map((point) =>
        point
          .clone()
          .add(new THREE.Vector3(shiftAmount * (loopCounter.current - 1), 0, 0))
      );
    }

    curvePointsRef.current = shiftedPoints;
    curveRef.current.points = shiftedPoints;
    curveRef.current.needsUpdate = true;
  };

  return {
    curveRef,
    loopCounter,
    transitionCurveActive,
    initiateTransitionCurve,
    shiftCurvePoints,
    getCurrentPoint: (progress) => curveRef.current.getPoint(progress),
  };
};
