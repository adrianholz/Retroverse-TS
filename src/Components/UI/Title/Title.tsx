import { useContext, useEffect, useState } from "react";
import "./Title.css";
import SystemContext from "../../../SystemContext";
import { UserContext } from "../../../UserContext";

const Title = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { systems } = useContext(SystemContext)!;
  const { theme, intro } = useContext(UserContext)!;
  const [randomSystems, setRandomSystems] = useState<string[]>([]);

  const getRandomSystems = (array: { name: string }[], count: number) => {
    const names = array.map((system) => system.name);
    const shuffled = names.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    if (systems) {
      setRandomSystems(getRandomSystems(systems, 6));
    }
  }, [systems]);

  const translateXValues = [-425, 425, -550, 550, -425, 425];
  const translateYValues = [-275, -275, 0, 0, 275, 275];

  return (
    <div className="title">
      <h1 style={{ animationDelay: `${intro ? 1 : 0}s` }}>
        Retro<span>verse</span>
      </h1>
      {theme.shape ? (
        <img
          className="shape"
          src={`${resourcesPath}/assets/img/webp/misc/shapes/${theme.shapeType}.webp`}
          alt="Shape"
          style={{ animationDelay: `${intro ? 3.5 : 0}s` }}
        />
      ) : null}

      {theme.orbit ? (
        <img
          src={`${resourcesPath}/assets/img/webp/misc/orbit.webp`}
          alt="Orbit"
          className="orbit"
          style={{ animationDelay: `0s, ${intro ? 3.5 : 0}s` }}
        />
      ) : null}
      {theme.wave ? (
        <div
          className="wave"
          style={{
            backgroundImage: `url(${resourcesPath}/assets/img/svg/wave.svg)`,
          }}
        ></div>
      ) : null}
      {theme.emulatorLogos ? (
        <div
          className="orbit-images"
          style={(() => {
            switch (theme.emulatorLogosStyle) {
              case "float":
                return {
                  maxWidth: "150px",
                  maxHeight: "150px",
                };
              case "orbit":
                return {
                  maxWidth: "75px",
                  maxHeight: "75px",
                };
              case "wave":
                return {
                  maxWidth: "fit-content",
                  bottom: "-320px",
                  maxHeight: "60px",
                  display: "flex",
                  gap: "40px",
                };
              default:
                return {};
            }
          })()}
        >
          {randomSystems
            ? randomSystems.map((system, index) => (
                <img
                  key={index}
                  src={`${resourcesPath}/assets/img/webp/logo/${system}-logo.webp`}
                  alt={system}
                  style={(() => {
                    switch (theme.emulatorLogosStyle) {
                      case "float":
                        return {
                          "--final-x": `${translateXValues[index] || 0}px`,
                          "--final-y": `${translateYValues[index] || 0}px`,
                          transform: `translateX(${
                            [0, 2, 4].includes(index) ? "-" : ""
                          }100vw)`,
                          animation: `${
                            [0, 2, 4].includes(index)
                              ? "slideInLeft"
                              : "slideInRight"
                          } ${
                            intro ? 1.5 : 1.0
                          }s ease forwards, float 3.5s ease-in-out infinite`,
                          animationDelay: intro
                            ? `${2.5 + index * 0.25}s, ${4 + index * 0.25}s`
                            : `${index * 0.25}s, ${1.0 + index * 0.25}s`,
                        } as React.CSSProperties;
                      case "orbit":
                        return {
                          "--start-angle": `${60 * index}deg`,
                          opacity: "0",
                          transform: `rotate(${
                            60 * index
                          }deg) translate(275px) rotate(calc(-1* ${
                            60 * index
                          }deg))`,
                          animation:
                            "spin 16s linear infinite, decoration-appear 0.3s ease forwards",
                          animationDelay: intro
                            ? `0s, ${4 + index * 0.15}s`
                            : `0s, ${index * 0.15}s`,
                        };
                      case "wave":
                        return {
                          opacity: "0",
                          position: "unset",
                          animation: `wave 2s ease-in-out -${
                            index * 0.5
                          }s infinite alternate, decoration-appear 0.3s ease ${
                            intro ? 4 + index * 0.15 : index * 0.15
                          }s forwards`,
                        };
                      default:
                        return {};
                    }
                  })()}
                />
              ))
            : null}
        </div>
      ) : null}
    </div>
  );
};

export default Title;
