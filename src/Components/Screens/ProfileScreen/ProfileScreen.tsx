import { useContext, useEffect, useState } from "react";
import "./ProfileScreen.css";
import { motion } from "framer-motion";
import { UserContext } from "../../../UserContext";
import { Link } from "react-router-dom";
import UserTitle from "../../UI/UserProfile/UserTitle/UserTitle";
import UserRecentGames from "../../UI/UserProfile/UserRecentGames/UserRecentGames";
import UserAwards from "../../UI/UserProfile/UserAwards/UserAwards";
import UserAchievements from "../../UI/UserProfile/UserAchievements/UserAchievements";
import {
  buildAuthorization,
  DatedUserAchievement,
  getAchievementsEarnedBetween,
  getUserAwards,
  getUserRecentlyPlayedGames,
  UserRecentlyPlayedGames,
} from "@retroachievements/api";

const ProfileScreen = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const [awards, setAwards] = useState<UserAwards | null>(null);
  const [recentGames, setRecentGames] =
    useState<UserRecentlyPlayedGames | null>(null);
  const [achievements, setAchievements] = useState<
    DatedUserAchievement[] | null
  >(null);
  const [loading, setLoading] = useState(false);

  const { login, summary, userLogout } = useContext(UserContext)!;

  async function getUserData() {
    const username = window.localStorage.getItem("username")!;
    const webApiKey = window.localStorage.getItem("webApiKey")!;

    const authorization = buildAuthorization({ username, webApiKey });

    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 1);

    setLoading(true);

    const userRecentGames = await getUserRecentlyPlayedGames(authorization, {
      username: username,
      count: 10,
    });
    setRecentGames(userRecentGames);

    const userAwards = await getUserAwards(authorization, {
      username: username,
    });
    setAwards(userAwards);
    const userRecentAchievements = await getAchievementsEarnedBetween(
      authorization,
      {
        username: username,
        fromDate: fromDate,
        toDate: toDate,
      }
    );
    setAchievements(userRecentAchievements);
    setLoading(false);
  }

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="profile-screen"
    >
      {login && summary ? (
        <div className="user-panel">
          <UserTitle summary={summary} />
          <UserAwards summary={summary} awards={awards} loading={loading} />
          <UserRecentGames recentGames={recentGames} loading={loading} />
          <UserAchievements achievements={achievements} loading={loading} />
          <div className="buttons">
            <button
              onClick={() => {
                userLogout();
              }}
            >
              Logout
            </button>
            <Link to="/profile/games">All Games</Link>
          </div>
        </div>
      ) : (
        <h1>You must log in first.</h1>
      )}
    </motion.div>
  );
};

export default ProfileScreen;
