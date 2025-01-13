import "./App.css";

function App() {
  function launchEmulator(emulator: string) {
    window.ipcRenderer.send("run-emulator", emulator);
  }

  return (
    <>
      <button
        onClick={() => {
          launchEmulator("RetroArch");
        }}
      >
        RetroArch
      </button>
      <button
        onClick={() => {
          launchEmulator("Dolphin");
        }}
      >
        Dolphin
      </button>
      <button
        onClick={() => {
          launchEmulator("Cemu");
        }}
      >
        Cemu
      </button>
      <button
        onClick={() => {
          launchEmulator("PCSX2");
        }}
      >
        PCSX2
      </button>
      <button
        onClick={() => {
          launchEmulator("RPCS3");
        }}
      >
        RPCS3
      </button>
      <button
        onClick={() => {
          launchEmulator("VPinball");
        }}
      >
        VPinball
      </button>
      <button
        onClick={() => {
          launchEmulator("ArcadeFlashWeb");
        }}
      >
        ArcadeFlashWeb
      </button>
    </>
  );
}

export default App;
