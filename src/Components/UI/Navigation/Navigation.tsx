import { Link } from "react-router-dom";
import "./Navigation.css";
import { useContext } from "react";
import { UserContext } from "../../../UserContext";

const Navigation = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { login, summary } = useContext(UserContext)!;

  function handleClose() {
    window.ipcRenderer.send("close-app");
  }

  return (
    <div className="navigation">
      <ul>
        <Link to={login ? "/profile" : "/login"}>
          <li>
            <img
              src={
                login && summary
                  ? `https://retroachievements.org/${summary.userPic}`
                  : `${resourcesPath}/assets/img/svg/user.svg`
              }
              className={login && summary ? "user-icon" : ""}
              alt="User Icon"
            />
            <h2>{login && summary ? summary.user : "Account"}</h2>
          </li>
        </Link>
        <Link to="/library">
          <li>
            <img
              src={`${resourcesPath}/assets/img/svg/gamepad.svg`}
              alt="Library Icon"
            />
            <h2>Library</h2>
          </li>
        </Link>
        <li>
          <img
            src={`${resourcesPath}/assets/img/svg/gear.svg`}
            alt="Settings Icon"
          />
          <h2>Settings</h2>
        </li>
        <li onClick={handleClose}>
          <img
            src={`${resourcesPath}/assets/img/svg/door-open.svg`}
            alt="Exit Icon"
          />
          <h2>Quit</h2>
        </li>
      </ul>
    </div>
  );
};

export default Navigation;
