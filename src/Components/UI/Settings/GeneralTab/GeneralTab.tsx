import "./GeneralTab.css";

type GeneralTabTypes = {
  active: boolean;
};

const GeneralTab = ({ active }: GeneralTabTypes) => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

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
              <button>Active</button>
              <button>Inactive</button>
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
            <button>Windowed</button>
            <button>Fullscreen</button>
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
            <button>RetroArch</button>
            <button>ArcadeFlashWeb</button>
            <button>Dolphin</button>
            <button>PCSX2</button>
            <button>RPCS3</button>
            <button>Cemu</button>
            <button>VPinball</button>
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
            <button>English 🇺🇸</button>
            <button>Português 🇧🇷</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralTab;
