import { UserRecentlyPlayedGames } from "@retroachievements/api";
import "./UserRecentGames.css";

const UserRecentGames = ({
  recentGames,
}: {
  recentGames: UserRecentlyPlayedGames;
}) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  return (
    <div className="user-recent-games">
      <h2>Recent Activity</h2>
      <div className="games">
        {recentGames.length > 0 ? (
          recentGames.map((game, index) => (
            <div
              className="game"
              key={index}
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
                    <h2>{game.title}</h2>
                    <h3>{game.consoleName}</h3>
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
