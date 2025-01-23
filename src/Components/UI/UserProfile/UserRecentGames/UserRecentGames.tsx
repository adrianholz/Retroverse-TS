import { UserRecentlyPlayedGames } from "@retroachievements/api";
import "./UserRecentGames.css";
import { BarLoader } from "react-spinners";
import { useContext } from "react";
import SystemContext from "../../../../SystemContext";
import { useNavigate } from "react-router-dom";

const UserRecentGames = ({
  recentGames,
  loading,
}: {
  recentGames: UserRecentlyPlayedGames | null;
  loading: boolean;
}) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const navigate = useNavigate();

  const { systems } = useContext(SystemContext)!;

  return (
    <div className="user-recent-games">
      <h2>Recent Activity</h2>
      <div className="games">
        {loading ? (
          <BarLoader
            color="#ffffff"
            loading={true}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        ) : recentGames && recentGames.length > 0 ? (
          recentGames.map((game, index) => (
            <div
              className="game"
              key={index}
              onClick={() => navigate(`/profile/games/${game.gameId}`)}
              style={{
                backgroundImage: `url(https://retroachievements.org${game.imageTitle})`,
                boxShadow:
                  game.numAchievedHardcore === game.numPossibleAchievements &&
                  game.numPossibleAchievements != 0
                    ? "0 0 10px gold"
                    : "none",
                border:
                  game.numAchievedHardcore === game.numPossibleAchievements &&
                  game.numPossibleAchievements != 0
                    ? "2px solid gold"
                    : "none",
              }}
            >
              {game.numAchievedHardcore === game.numPossibleAchievements &&
              game.numPossibleAchievements != 0 ? (
                <img
                  src={`${resourcesPath}/assets/img/webp/misc/badge.webp`}
                  className="completed-game"
                />
              ) : null}
              <div className="game-info">
                <img
                  src={`https://retroachievements.org${game.imageIcon}`}
                  alt="Game Icon"
                />
                <div>
                  <div>
                    <h2>
                      {game.title.split(/(~[^~]+~)/).map((part, index) => {
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
                    <h3>
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
                      <span>{game.consoleName}</span>
                    </h3>
                  </div>
                  <p>
                    <span>{game.numAchievedHardcore}</span> out of{" "}
                    <span>{game.numPossibleAchievements}</span> unlocked
                  </p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-recent">No recent games were found.</p>
        )}
      </div>
    </div>
  );
};

export default UserRecentGames;
