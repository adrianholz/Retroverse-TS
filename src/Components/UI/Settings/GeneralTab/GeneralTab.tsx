import { useContext } from "react";
import "./GeneralTab.css";
import { UserContext } from "../../../../UserContext";

type GeneralTabTypes = {
  active: boolean;
};

const GeneralTab = ({ active }: GeneralTabTypes) => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  const {
    windowMode,
    setWindowMode,
    musicPlayer,
    setMusicPlayer,
    setMusicVolume,
    language,
    setLanguage,
  } = useContext(UserContext)!;

  return (
    <div className={`settings-inner general-tab ${active ? "active" : ""}`}>
      <div className="first-column">
        <div className="music">
          <div>
            <h2>
              <img
                src={`${resourcesPath}/assets/img/svg/music.svg`}
                alt="Music Icon"
                className="settings-icon"
              />
              <p>Music player</p>
            </h2>
            <div className="buttons">
              <button
                onClick={() => {
                  setMusicPlayer(true);
                  window.localStorage.setItem("musicPlayer", "true");
                }}
                className={musicPlayer ? "active" : ""}
              >
                Active
              </button>
              <button
                onClick={() => {
                  setMusicPlayer(false);
                  window.localStorage.setItem("musicPlayer", "false");
                }}
                className={!musicPlayer ? "active" : ""}
              >
                Inactive
              </button>
            </div>
          </div>
          <div className="volume">
            <h2>
              <img
                src={`${resourcesPath}/assets/img/svg/volume.svg`}
                alt="Volume Icon"
                className="settings-icon"
              />
              <p>Music volume</p>
            </h2>
            <input
              type="range"
              name="music-volume"
              id="music-volume"
              min="0"
              max="100"
              onChange={({ target }) => {
                setMusicVolume(Number(target.value));
                window.localStorage.setItem("musicVolume", target.value);
              }}
              defaultValue={
                window.localStorage.getItem("musicVolume")
                  ? Number(window.localStorage.getItem("musicVolume"))
                  : 50
              }
            />
          </div>
        </div>
        <div className="window-mode">
          <h2>
            <img
              src={`${resourcesPath}/assets/img/svg/display.svg`}
              alt="Display Icon"
              className="settings-icon"
            />
            <p>Window mode</p>
          </h2>
          <div className="buttons">
            <button
              onClick={() => {
                setWindowMode("Windowed");
                window.localStorage.setItem("windowMode", "Windowed");
              }}
              className={windowMode == "Windowed" ? "active" : ""}
            >
              Windowed
            </button>
            <button
              onClick={() => {
                setWindowMode("Fullscreen");
                window.localStorage.setItem("windowMode", "Fullscreen");
              }}
              className={windowMode == "Fullscreen" ? "active" : ""}
            >
              Fullscreen
            </button>
          </div>
        </div>
      </div>
      <div className="second-column">
        <div className="emulators">
          <h2>
            <img
              src={`${resourcesPath}/assets/img/svg/retroarch.svg`}
              alt="RetroArch Icon"
              className="settings-icon"
            />
            <p>Emulators</p>
          </h2>
          <div className="buttons">
            <button
              onClick={() =>
                window.ipcRenderer.invoke(
                  "execute-emulator-command",
                  "RetroArch"
                )
              }
            >
              RetroArch
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke(
                  "execute-emulator-command",
                  "ArcadeFlashWeb"
                )
              }
            >
              ArcadeFlashWeb
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke("execute-emulator-command", "Dolphin")
              }
            >
              Dolphin
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke("execute-emulator-command", "PCSX2")
              }
            >
              PCSX2
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke("execute-emulator-command", "RPCS3")
              }
            >
              RPCS3
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke("execute-emulator-command", "Cemu")
              }
            >
              Cemu
            </button>
            <button
              onClick={() =>
                window.ipcRenderer.invoke(
                  "execute-emulator-command",
                  "VPinball"
                )
              }
            >
              VPinball
            </button>
          </div>
        </div>
        <div className="language">
          <h2>
            <img
              src={`${resourcesPath}/assets/img/svg/language.svg`}
              alt="Language Icon"
              className="settings-icon"
            />
            <p>Language</p>
          </h2>
          <div className="buttons">
            <button
              onClick={() => setLanguage("en-us")}
              className={language == "en-us" ? "active" : ""}
            >
              English 🇺🇸
            </button>
            <button
              onClick={() => setLanguage("pt-br")}
              className={language == "pt-br" ? "active" : ""}
            >
              Português 🇧🇷
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
