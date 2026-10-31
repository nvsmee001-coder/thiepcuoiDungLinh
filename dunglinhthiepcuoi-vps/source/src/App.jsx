import "./App.scss";
import Experience from "./Experience/Experience";
import MobileCharacter from "./Experience/components/MobileCharacter";
import IntroScreen from "./components/IntroScreen/IntroScreen";

function App() {
  return (
    <>
      <IntroScreen />
      <Experience />
      <MobileCharacter />
    </>
  );
}

export default App;
