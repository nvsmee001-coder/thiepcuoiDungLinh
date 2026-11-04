import "./App.scss";
import { useCallback, useEffect, useRef, useState } from "react";
import Experience from "./Experience/Experience";
import IntroScreen from "./components/IntroScreen/IntroScreen";
import WeddingWelcome, { RotateNotice } from "./components/WeddingWelcome/WeddingWelcome";
import useDeviceViewport from "./hooks/useDeviceViewport";

function App() {
  const [started, setStarted] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [autoScroll, setAutoScroll] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [visible, setVisible] = useState(() => !document.hidden);
  const markReady = useCallback(() => setSceneReady(true), []);
  useEffect(() => {
    const update = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);
  const audio = useRef();
  const viewport = useDeviceViewport();
  const rotateRequired = viewport.phone && viewport.portrait;
  const play = () => {
    audio.current.volume = 0.45;
    audio.current.play().catch(() => setPlaying(false));
  };
  const start = () => {
    // Start playback in the tap handler to unlock audio on iOS/Android.
    play();
    setStarted(true);
  };
  return (
    <>
      <audio ref={audio} src="/audio/hoa-sua-roi.mp3" loop preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      {!started ? <WeddingWelcome onStart={start} rotateRequired={rotateRequired} phone={viewport.phone} /> : <>
        <IntroScreen sceneReady={sceneReady} />
        <Experience enabled={sceneReady && !rotateRequired && visible} autoScroll={autoScroll} onReady={markReady} />
        <button
          className={`auto-scroll-toggle ${autoScroll ? "auto-scroll-toggle--active" : ""}`}
          data-no-navigation
          aria-label={autoScroll ? "Tắt tự động cuộn hành trình" : "Bật tự động cuộn hành trình"}
          aria-pressed={autoScroll}
          onClick={() => setAutoScroll((v) => !v)}
        >
          {autoScroll ? "Tự chạy: Bật" : "Tự chạy: Tắt"}
        </button>
        <button
          className="music-toggle"
          data-no-navigation
          aria-label={playing ? "Tắt nhạc nền" : "Bật nhạc nền"}
          aria-pressed={playing}
          onClick={() => playing ? audio.current.pause() : play()}
        >
          {playing ? "♫ Nhạc: Bật" : "♫ Nhạc: Tắt"}
        </button>
        {rotateRequired && <div className="orientation-cover"><RotateNotice /></div>}
      </>}
    </>
  );
}

export default App;
