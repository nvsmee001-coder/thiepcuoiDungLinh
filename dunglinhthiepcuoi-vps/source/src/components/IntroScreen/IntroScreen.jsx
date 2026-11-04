import React, { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { gsap } from "gsap";
import styles from "./IntroScreen.module.scss";

const IntroScreen = ({ sceneReady = true }) => {
  const { progress } = useProgress();
  const [shouldRender, setShouldRender] = useState(true);
  const introRef = useRef(null);

  useEffect(() => {
    if (!sceneReady) return;
    const fade = gsap.to(introRef.current, {
      opacity: 0, duration: .45, delay: .15, ease: "power2.out",
      onComplete: () => setShouldRender(false),
    });
    return () => fade.kill();
  }, [sceneReady]);

  if (!shouldRender) return null;

  return (
    <>
      <div ref={introRef} className={styles.introScreen} data-scene-ready={sceneReady}>
        <div className={styles.introScreenContent}>
          <div className={styles.loadingText}>loading Thiệp cưới mới nhất 2026</div>

          <div className={styles.progressBarContainer} role="progressbar" aria-label="Đang tải thiệp cưới"
            aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress)}>
            <div
              className={styles.progressBar}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>

      </div>
    </>
  );
};

export default IntroScreen;
