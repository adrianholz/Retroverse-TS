import { useNavigate } from "react-router-dom";
import "./RetroAchievementsForm.css";
import { useContext, useState } from "react";
import { UserContext } from "../../../../UserContext";

const RetroAchievementsForm = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const [username, setUsername] = useState("");
  const [webApiKey, setWebApiKey] = useState("");

  const { handleLogin, loading, error, setError } = useContext(UserContext)!;

  const navigate = useNavigate();

  return (
    <div className="retroachievements-form">
      <div className="ra-logo">
        <img
          src={`${resourcesPath}/assets/img/webp/misc/ra-icon.webp`}
          alt="RetroAchievements Icon"
        />
      </div>
      <h1>
        Retro<span>Achievements</span>
      </h1>
      <p>
        Do you have a <strong>Retroachievements</strong> account?
      </p>
      <p>Log in to track your progress across the retro games you play.</p>
      <form action="#">
        <div className="input">
          <label htmlFor="username">
            <img
              src={`${resourcesPath}/assets/img/svg/user-input.svg`}
              alt="User"
            />
          </label>
          <input
            type="text"
            name="Username"
            id="username"
            required
            placeholder="Username"
            onChange={({ target }) => setUsername(target.value)}
          />
        </div>
        <div className="input">
          <label htmlFor="password">
            <img
              src={`${resourcesPath}/assets/img/svg/lock.svg`}
              alt="Password"
            />
          </label>
          <input
            type="password"
            name="Password"
            id="password"
            required
            placeholder="Web API key"
            onChange={({ target }) => setWebApiKey(target.value)}
          />
        </div>
        {error ? <span className="error">{String(error)}</span> : null}
        <div className="form-buttons">
          <button
            onClick={(e) => {
              e.preventDefault();
              setError("");
              navigate("/");
            }}
          >
            Title screen
          </button>
          <input
            type="submit"
            value={loading ? "Loading..." : "Login"}
            disabled={loading}
            onClick={async (e) => {
              e.preventDefault();
              await handleLogin(username, webApiKey);
            }}
          />
        </div>
      </form>
    </div>
  );
};

export default RetroAchievementsForm;
