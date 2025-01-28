import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../../../UserContext";
import { Colorful } from "@uiw/react-color";
import "./ThemeTab.css";

const ThemeTab = ({ active }: { active: boolean }) => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  const { theme, setTheme } = useContext(UserContext)!;
  const [shapes, setShapes] = useState<string[]>([]);
  const [patterns, setPatterns] = useState<string[]>([]);
  const [custom, setCustom] = useState(false);

  useEffect(() => {
    const loadFiles = async () => {
      const shapes = await window.ipcRenderer.invoke("get-files", "shapes");
      const patterns = await window.ipcRenderer.invoke("get-files", "patterns");

      const stripExtension = (files: string[]) =>
        files.map((file) => file.replace(/\.[^/.]+$/, ""));

      setShapes(stripExtension(shapes));
      setPatterns(stripExtension(patterns));
    };
    loadFiles();
  }, []);

  const addFile = async (type: "shapes" | "patterns") => {
    const newFile = await window.ipcRenderer.invoke("add-file", type);
    if (newFile) {
      const strippedFile = newFile.replace(/\.[^/.]+$/, "");

      if (type === "shapes") {
        setShapes((prev) => [...prev, strippedFile]);
      } else {
        setPatterns((prev) => [...prev, strippedFile]);
      }
    }
  };

  const handleToggle = (key: keyof typeof theme) => {
    setTheme((prev) => {
      if (prev.emulatorLogosStyle === "float") {
        if (key === "orbit") {
          return { ...prev, orbit: !prev.orbit, wave: false };
        } else if (key === "wave") {
          return { ...prev, wave: !prev.wave, orbit: false };
        }
      }
      return { ...prev, [key]: !prev[key] };
    });
  };

  const handleInputChange = (key: keyof typeof theme, value: any) => {
    setTheme((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setTheme((prev) => {
      const updatedTheme = { ...prev };

      if (prev.emulatorLogosStyle !== "orbit") {
        updatedTheme.orbit = false;
      }

      if (prev.emulatorLogosStyle !== "wave") {
        updatedTheme.wave = false;
      }

      return updatedTheme;
    });
  }, [theme.emulatorLogosStyle, setTheme]);

  useEffect(() => {
    localStorage.setItem("theme", JSON.stringify(theme));
  }, [theme]);

  return (
    <div className={`settings-inner theme-tab ${active ? "active" : ""}`}>
      <div className="shapes-and-patterns">
        <h2>
          <img
            src={`${resourcesPath}/assets/img/svg/shapes-and-patterns.svg`}
            alt="Shapes and Patterns Icon"
            className="settings-icon"
          />
          <p>Shapes and Patterns</p>
        </h2>
        <div>
          <div>
            <label className="checkbox-input">
              <input
                type="checkbox"
                checked={theme.shape}
                onChange={() => handleToggle("shape")}
              />
              <span className="checkmark"></span>
              <p>Enable Shapes</p>
            </label>
            {theme.shape ? (
              <>
                <select
                  value={theme.shapeType}
                  onChange={(e) =>
                    handleInputChange("shapeType", e.target.value)
                  }
                  className="select-input"
                >
                  {shapes.map((shape) => (
                    <option key={shape} value={shape}>
                      {shape}
                    </option>
                  ))}
                </select>
                <button onClick={() => addFile("shapes")}>Add Shape</button>
              </>
            ) : null}
          </div>
          <div>
            <label className="checkbox-input">
              <input
                type="checkbox"
                checked={theme.pattern}
                onChange={() => handleToggle("pattern")}
              />
              <span className="checkmark"></span>
              <p>Enable Patterns</p>
            </label>
            {theme.pattern ? (
              <>
                <select
                  value={theme.patternType}
                  onChange={(e) =>
                    handleInputChange("patternType", e.target.value)
                  }
                  className="select-input"
                >
                  {patterns.map((pattern) => (
                    <option key={pattern} value={pattern}>
                      {pattern}
                    </option>
                  ))}
                </select>
                <button onClick={() => addFile("patterns")}>Add Pattern</button>
              </>
            ) : null}
          </div>
        </div>
      </div>

      {/* Emulator Logos Settings */}
      <div className="system-logos">
        <h2>
          <img
            src={`${resourcesPath}/assets/img/svg/systems.svg`}
            alt="System Logos"
            className="settings-icon"
          />
          <p>System Logos</p>
        </h2>
        <div>
          <label className="checkbox-input">
            <input
              type="checkbox"
              checked={theme.emulatorLogos}
              onChange={() => handleToggle("emulatorLogos")}
            />
            <span className="checkmark"></span>
            <p>Show System Logos</p>
          </label>
          {theme.emulatorLogos && (
            <select
              value={theme.emulatorLogosStyle}
              onChange={(e) =>
                handleInputChange("emulatorLogosStyle", e.target.value)
              }
              className="select-input"
            >
              <option value="orbit">Orbit</option>
              <option value="float">Float</option>
              <option value="wave">Wave</option>
            </select>
          )}

          <div>
            {theme.emulatorLogos &&
              (theme.emulatorLogosStyle == "orbit" ||
                theme.emulatorLogosStyle == "float") && (
                <label className="checkbox-input">
                  <input
                    type="checkbox"
                    checked={theme.orbit}
                    onChange={() => handleToggle("orbit")}
                    disabled={
                      theme.emulatorLogosStyle === "float" && theme.wave
                    }
                  />
                  <span className="checkmark"></span>
                  <p>Orbit Effect</p>
                </label>
              )}
            {theme.emulatorLogos &&
              (theme.emulatorLogosStyle == "wave" ||
                theme.emulatorLogosStyle == "float") && (
                <label className="checkbox-input">
                  <input
                    type="checkbox"
                    checked={theme.wave}
                    disabled={
                      theme.emulatorLogosStyle === "float" && theme.orbit
                    }
                    onChange={() => handleToggle("wave")}
                  />
                  <span className="checkmark"></span>
                  <p>Wave Effect</p>
                </label>
              )}
          </div>
        </div>
      </div>

      {/* Background Settings */}
      <div className="background">
        <h2>
          <img
            src={`${resourcesPath}/assets/img/svg/background.svg`}
            alt="Background Icon"
            className="settings-icon"
          />
          <p>Other Settings</p>
        </h2>

        <label className="checkbox-input">
          <input
            type="checkbox"
            checked={theme.background}
            onChange={() => handleToggle("background")}
          />
          <span className="checkmark"></span>
          <p>Enable Background Blurs</p>
        </label>
        {theme.background ? (
          <label className="checkbox-input">
            <input
              type="checkbox"
              checked={custom}
              onChange={() => setCustom(!custom)}
            />
            <span className="checkmark"></span>
            <p>Custom Blur Color/Size</p>
          </label>
        ) : null}

        <label className="checkbox-input">
          <input
            type="checkbox"
            checked={theme.achievementOfTheWeek}
            onChange={() => handleToggle("achievementOfTheWeek")}
          />
          <span className="checkmark"></span>
          <p>Show Achievement of the Week</p>
        </label>
        <div className={`colors ${theme.background && custom ? "active" : ""}`}>
          {theme.backgroundColors.map((bgColor, index) => (
            <div key={index}>
              <Colorful
                color={bgColor.color}
                className="colorful"
                onChange={(color) => {
                  setTheme((prev) => {
                    const updatedColors = [...prev.backgroundColors];
                    updatedColors[index].color = `${color.hexa}`;
                    return { ...prev, backgroundColors: updatedColors };
                  });
                }}
              />
              <input
                type="number"
                value={bgColor.size}
                onChange={(e) =>
                  setTheme((prev) => {
                    const updatedColors = [...prev.backgroundColors];
                    updatedColors[index].size = Number(e.target.value);
                    return { ...prev, backgroundColors: updatedColors };
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Music Player and Visualizer Settings */}
      <div className="music-visualization">
        <h2>
          <img
            src={`${resourcesPath}/assets/img/svg/music.svg`}
            alt="Music Logo"
            className="settings-icon"
          />
          <p>Music Visualization</p>
        </h2>
        <label className="checkbox-input">
          <input
            type="checkbox"
            checked={theme.beat}
            onChange={() => handleToggle("beat")}
          />
          <span className="checkmark"></span>
          <p>Animate Edge Blurs to BPM</p>
        </label>
        <label className="checkbox-input">
          <input
            type="checkbox"
            checked={theme.visualizer}
            onChange={() => handleToggle("visualizer")}
          />
          <span className="checkmark"></span>
          <p>Enable Music Visualizer</p>
        </label>
      </div>
    </div>
  );
};

export default ThemeTab;
