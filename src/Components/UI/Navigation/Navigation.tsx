import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";
import { useContext } from "react";
import { UserContext } from "../../../UserContext";
import Title from "../Title/Title";
import SystemContext from "../../../SystemContext";

const Navigation = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { login, summary, aotw, theme } = useContext(UserContext)!;
  const { systems, currentActiveSystems } = useContext(SystemContext)!;

  const location = useLocation();

  function handleClose() {
    window.ipcRenderer.send("close-app");
  }

  return (
    <div
      className={`navigation ${
        location.pathname == "/library" && currentActiveSystems.length > 0
          ? "background"
          : ""
      }`}
    >
      {login && aotw && theme.achievementOfTheWeek ? (
        <Link to={`/profile/games/${aotw.game.id}`}>
          <div className="aotw">
            <img
              src={`https://retroachievements.org/${aotw.achievement.badgeUrl}`}
              alt={aotw.achievement.badgeName}
            />
            <div className="aotw-info">
              <span>Achievement of the week</span>
              <h1>{aotw.achievement.title}</h1>
              <h2>
                {systems
                  .filter((system) => system.altTitle === aotw.console.title)
                  .map((system) => (
                    <img
                      key={system.name}
                      src={`${resourcesPath}/assets/img/webp/logo/${system.name}-logo.webp`}
                      alt={`${system.name} logo`}
                    />
                  ))}
                {aotw.game.title.split(/(~[^~]+~)/).map((part, index) => {
                  if (part.startsWith("~") && part.endsWith("~")) {
                    const content = part.slice(1, -1);
                    return (
                      <span key={index} className={content}>
                        {content}
                      </span>
                    );
                  }
                  return part;
                })}
              </h2>
            </div>
          </div>
        </Link>
      ) : null}
      <ul>
        <Link
          to={login ? "/profile" : "/login"}
          style={{ marginRight: "36px" }}
        >
          <li
            className={`${
              location.pathname.startsWith("/profile") ||
              location.pathname == "/login"
                ? "active"
                : ""
            }`}
          >
            <img
              src={
                login && summary
                  ? `https://retroachievements.org/${summary.userPic}`
                  : `${resourcesPath}/assets/img/svg/user.svg`
              }
              className={login && summary ? "user-icon" : ""}
              alt="User Icon"
            />
          </li>
        </Link>
        <Link to="/library">
          <li className={`${location.pathname == "/library" ? "active" : ""}`}>
            <img
              src={`${resourcesPath}/assets/img/svg/gamepad.svg`}
              alt="Library Icon"
            />
          </li>
        </Link>
        <div
          style={
            location.pathname !== "/"
              ? { margin: "0 120px" }
              : { margin: "0 18px" }
          }
        ></div>
        {location.pathname !== "/" && <Title navigation={true} />}
        <Link to="/settings">
          <li className={`${location.pathname == "/settings" ? "active" : ""}`}>
            <img
              src={`${resourcesPath}/assets/img/svg/gear.svg`}
              alt="Settings Icon"
            />
          </li>
        </Link>
        <li onClick={handleClose} style={{ marginLeft: "36px" }}>
          <img
            src={`${resourcesPath}/assets/img/svg/door-open.svg`}
            alt="Exit Icon"
          />
        </li>
      </ul>
    </div>
  );
};

export default Navigation;
