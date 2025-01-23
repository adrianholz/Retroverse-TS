import { Link, useLocation } from "react-router-dom";
import "./Navigation.css";
import { useContext } from "react";
import { UserContext } from "../../../UserContext";
import Title from "../Title/Title";

const Navigation = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { login, summary } = useContext(UserContext)!;

  const location = useLocation();

  function handleClose() {
    window.ipcRenderer.send("close-app");
  }

  return (
    <div className="navigation">
      <ul>
        <Link
          to={login ? "/profile" : "/login"}
          style={{ marginRight: "36px" }}
        >
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
            <h2>Account</h2>
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
        <div
          style={
            location.pathname !== "/"
              ? { margin: "0 120px 0 140px" }
              : { margin: "0 18px" }
          }
        ></div>
        {location.pathname !== "/" && <Title navigation={true} />}
        <Link to="/settings">
          <li>
            <img
              src={`${resourcesPath}/assets/img/svg/gear.svg`}
              alt="Settings Icon"
            />
            <h2>Settings</h2>
          </li>
        </Link>
        <li onClick={handleClose} style={{ marginLeft: "36px" }}>
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
