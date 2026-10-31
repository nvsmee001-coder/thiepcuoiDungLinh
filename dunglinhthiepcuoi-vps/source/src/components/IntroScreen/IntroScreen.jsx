import React, { useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import styles from "./IntroScreen.module.scss";

const IntroScreen = () => {
  const { progress } = useProgress();
  const [shouldRender, setShouldRender] = useState(true);
  const introRef = useRef(null);

  useGSAP(() => {
    if (progress === 100) {
      const tl = gsap.timeline({
        onComplete: () => {
          setShouldRender(false);
        },
      });

      tl.to(introRef.current, {
        opacity: 0,
        duration: 1,
        ease: "power2.out",
        delay: 1.5,
      });
    }
  }, [progress]);

  if (!shouldRender) return null;

  return (
    <>
      <div ref={introRef} className={styles.introScreen}>
        <div className={styles.introScreenContent}>
          <div className={styles.loadingText}>loading Thiệp cưới mới nhất 2026</div>

          <div className={styles.progressBarContainer}>
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
