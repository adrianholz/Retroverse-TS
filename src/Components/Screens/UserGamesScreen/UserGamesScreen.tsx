import { useContext, useEffect, useState } from "react";
import "./UserGamesScreen.css";
import {
  buildAuthorization,
  getUserCompletionProgress,
  UserCompletionProgress,
} from "@retroachievements/api";
import { BarLoader } from "react-spinners";
import { UserContext } from "../../../UserContext";
import SystemContext from "../../../SystemContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

const UserGamesScreen = () => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const [loading, setLoading] = useState(false);
  const [allGames, setAllGames] = useState<UserCompletionProgress | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { summary } = useContext(UserContext)!;
  const { systems } = useContext(SystemContext)!;

  useEffect(() => {
    const fetchGames = async () => {
      const username = window.localStorage.getItem("username");
      const webApiKey = window.localStorage.getItem("webApiKey");

      if (!username || !webApiKey) {
        console.error("Missing username or webApiKey");
        return;
      }

      setLoading(true);

      try {
        const games = await getAllUserGames(username, webApiKey);
        setAllGames(games);
      } catch (error) {
        console.error("Failed to fetch user games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGames();
  }, []);

  async function getAllUserGames(username: string, webApiKey: string) {
    const authorization = buildAuthorization({ username, webApiKey });
    const userCompletion = await getUserCompletionProgress(authorization, {
      username: username,
      count: 250,
    });
    return userCompletion;
  }

  const parseDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const results = allGames?.results || [];

  const filteredResults = results.filter((game) =>
    game.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="all-games"
    >
      <div className="all-games-header">
        <div className="user">
          <img
            src={`https://retroachievements.org/${summary!.userPic}`}
            alt={summary!.user}
          />
          <h1>
            {summary!.user}
            <span>'s</span> <span>completion progress</span>
          </h1>
        </div>
        <div className="input">
          <label htmlFor="search">
            <img
              src={`${resourcesPath}/assets/img/svg/search.svg`}
              alt="User"
            />
          </label>
          <input
            type="text"
            name="search"
            id="search"
            placeholder="Search games by title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      {loading ? (
        <ul className="loading-games">
          <BarLoader
            color="#ffffff"
            loading={true}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        </ul>
      ) : results.length > 0 ? (
        <>
          <ul>
            {filteredResults.map((game) => {
              const percentage =
                game.maxPossible > 0
                  ? (game.numAwardedHardcore / game.maxPossible) * 100
                  : 0;

              return (
                <Link to={`/profile/games/${game.gameId}`}>
                  <li key={game.gameId}>
                    <div className="game-title">
                      <img
                        src={`https://retroachievements.org${game.imageIcon}`}
                        alt={game.title}
                        style={
                          percentage == 100
                            ? {
                                boxShadow: "0 0 10px gold",
                                border: "2px solid gold",
                              }
                            : {
                                border: "2px solid transparent",
                              }
                        }
                      />
                      <div>
                        <h3>
                          {game.title
                            .split(/(~[^~]+~|\[[^\]]+\])/)
                            .map((part, index) =>
                              part.startsWith("~") && part.endsWith("~") ? (
                                <span key={index} className={part.slice(1, -1)}>
                                  {part.slice(1, -1)}
                                </span>
                              ) : part.startsWith("[") && part.endsWith("]") ? (
                                <span
                                  key={index}
                                  className={part.slice(1, -1).split(" ")[0]}
                                >
                                  {part.slice(1, -1)}
                                </span>
                              ) : (
                                part
                              )
                            )}
                        </h3>
                        <p>
                          <strong>{game.numAwardedHardcore}</strong> out of{" "}
                          <strong>{game.maxPossible}</strong> unlocked
                        </p>
                        {game.mostRecentAwardedDate ? (
                          <p>{parseDate(game.mostRecentAwardedDate)}</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="console">
                      <p>
                        {systems
                          .filter(
                            (system) => system.altTitle === game.consoleName
                          )
                          .map((system) => (
                            <img
                              key={system.name}
                              src={`${resourcesPath}/assets/img/webp/logo/${system.name}-logo.webp`}
                              alt={`${system.name} logo`}
                            />
                          ))}
                        {systems.filter(
                          (system) => system.altTitle === game.consoleName
                        ).length === 0 && (
                          <img
                            key="standalone"
                            src={`${resourcesPath}/assets/img/webp/logo/standalone.webp`}
                            alt="Standalone logo"
                          />
                        )}
                      </p>
                    </div>
                    <div className="progress">
                      <div className="progress-bar">
                        <div
                          className="progress-bar-filled"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span>{Math.round(percentage)}%</span>
                    </div>
                    <img
                      src={`${resourcesPath}/assets/img/webp/misc/${
                        percentage == 100 ? "badge" : "badge-not-unlocked"
                      }.webp`}
                      style={
                        percentage == 100
                          ? {
                              filter: "drop-shadow(0 0 5px #FFD70040)",
                            }
                          : {}
                      }
                      alt="Badge"
                    />
                  </li>
                </Link>
              );
            })}
          </ul>
        </>
      ) : (
        <ul>
          <p className="no-games">The user hasn't played any games yet.</p>
        </ul>
      )}
    </motion.div>
  );
};

export default UserGamesScreen;
