import { useContext } from "react";
import "./ProfileScreen.css";
import { motion } from "framer-motion";
import { UserContext } from "../../../UserContext";
import { Link } from "react-router-dom";
import UserTitle from "../../UI/UserProfile/UserTitle/UserTitle";
import UserRecentGames from "../../UI/UserProfile/UserRecentGames/UserRecentGames";

const ProfileScreen = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const { login, summary, recentGames, awards, userLogout } =
    useContext(UserContext)!;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="profile-screen"
    >
      {login && summary && recentGames ? (
        <div className="user-panel">
          <UserTitle summary={summary} />
          <div></div>
          <UserRecentGames recentGames={recentGames} />
          <div></div>
          <div className="buttons">
            <button
              onClick={() => {
                userLogout();
              }}
            >
              Logout
            </button>
            <Link to="/">Title Screen</Link>
          </div>
        </div>
      ) : (
        <h1>You must log in first.</h1>
      )}
    </motion.div>
  );
};

export default ProfileScreen;
