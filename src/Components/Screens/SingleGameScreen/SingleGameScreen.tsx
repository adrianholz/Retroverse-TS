import React, { useContext, useEffect, useRef, useState } from "react";
import "./SingleGameScreen.css";
import {
  buildAuthorization,
  GameExtendedAchievementEntityWithUserProgress,
  GameInfoAndUserProgress,
  getGameInfoAndUserProgress,
} from "@retroachievements/api";
import { useNavigate, useParams } from "react-router-dom";
import { BarLoader } from "react-spinners";
import SystemContext from "../../../SystemContext";
import { motion } from "framer-motion";
import Atropos from "atropos/react";
import "atropos/css";
import { UserContext } from "../../../UserContext";

type TooltipTypes = {
  visible: boolean;
  x: number;
  y: number;
  content: GameExtendedAchievementEntityWithUserProgress | null;
};

const SingleGameScreen = () => {
  const resourcesPath = window.ipcRenderer
    .sendSync("get-resources-path")
    .replace(/\\/g, "/");

  const { gameId } = useParams();
  const { systems } = useContext(SystemContext)!;
  const { summary } = useContext(UserContext)!;
  const navigate = useNavigate();

  const [tab, _setTab] = useState("achievements");
  const [loading, setLoading] = useState(true);
  const [game, setGame] = useState<GameInfoAndUserProgress | null>(null);
  const [tooltip, setTooltip] = useState<TooltipTypes>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  const [fade, setFade] = useState(false);

  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const fadeInTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    const username = window.localStorage.getItem("username");
    const webApiKey = window.localStorage.getItem("webApiKey");

    const fetchGame = async () => {
      if (!username || !webApiKey) {
        console.error("Missing username or webApiKey");
        return;
      }
      try {
        const singleGame = await getGame(username, webApiKey);
        setGame(singleGame);
      } catch (error) {
        console.error("Failed to fetch user games:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGame();
  }, [gameId]);

  const getGame = async (username: string, webApiKey: string) => {
    const authorization = buildAuthorization({ username, webApiKey });
    return await getGameInfoAndUserProgress(authorization, {
      username,
      gameId: Number(gameId),
      shouldIncludeHighestAwardMetadata: true,
    });
  };

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLImageElement>,
    achievement: GameExtendedAchievementEntityWithUserProgress
  ) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: achievement,
    });
    fadeInTimeoutRef.current = setTimeout(() => setFade(true), 20);
    clearTimeout(fadeOutTimeoutRef.current);
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    setTooltip((prev) => ({ ...prev, x: event.clientX, y: event.clientY }));
  };

  const handleMouseLeave = () => {
    setFade(false);
    fadeOutTimeoutRef.current = setTimeout(() => {
      setTooltip({ visible: false, x: 0, y: 0, content: null });
    }, 200);
    clearTimeout(fadeInTimeoutRef.current);
  };

  useEffect(() => {
    return () => {
      clearTimeout(fadeOutTimeoutRef.current);
      clearTimeout(fadeInTimeoutRef.current);
    };
  }, []);

  const renderTooltip = () => {
    if (!tooltip.visible || !tooltip.content || !game) return null;

    const { numAwardedHardcore, points, title, description } = tooltip.content;
    const percentage =
      game.numDistinctPlayersHardcore > 0
        ? (numAwardedHardcore / game.numDistinctPlayersHardcore) * 100
        : 0;

    const borderStyle =
      points >= 75
        ? { border: "1px solid #ff0000", boxShadow: "0 0 10px #ff0000" }
        : points >= 50
        ? {
            border: "1px solid rgb(255, 70, 9)",
            boxShadow: "0 0 10px rgb(255, 70, 9)",
          }
        : points >= 25
        ? { border: "1px solid #00abff", boxShadow: "0 0 10px #00abff" }
        : {};

    return (
      <div
        className={`tooltip ${fade ? "fade-in" : "fade-out"}`}
        style={{ top: tooltip.y + 15, left: tooltip.x + 15, ...borderStyle }}
      >
        <strong>{title}</strong>
        <p className="points">{points}</p>
        <p className="description">{description}</p>
        <p className="players">
          <span>{numAwardedHardcore}</span> out of{" "}
          <span>{game.numDistinctPlayersHardcore}</span> unique players got this
          achievement
        </p>
        <div className="progress">
          <div className="progress-bar">
            <div
              className="progress-bar-filled"
              style={{ width: `${percentage}%` }}
            ></div>
          </div>
          <p className="unlock-rate">
            <span>{Math.round(percentage)}%</span> hardcore unlock rate
          </p>
        </div>
        {tooltip.content.dateEarnedHardcore && (
          <p className="got-achievement">You got this achievement!</p>
        )}
      </div>
    );
  };

  return loading ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="single-game"
    >
      <BarLoader color="#ffffff" loading={true} aria-label="Loading Spinner" />
    </motion.div>
  ) : !game ? (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="single-game"
    >
      <h1>Sorry, there was an error pulling data from this game.</h1>
    </motion.div>
  ) : (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="single-game"
    >
      <div className="single-game-header">
        <div className="single-game-intro">
          <button onClick={() => navigate("/profile/games")}>
            Back to All Games
          </button>
          <Atropos>
            <div
              className="game"
              style={{
                backgroundImage: `url(https://retroachievements.org${game.imageTitle})`,
              }}
            >
              <div className="game-info">
                <img
                  src={`https://retroachievements.org${game.imageIcon}`}
                  alt={game.title}
                />
                <div>
                  <h1>
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
                  </h1>
                  <h2>{`${game.genre || "Unknown"} | ${
                    game.released?.slice(0, 4) || "Unknown"
                  }`}</h2>
                  <h3>
                    <span>Publisher</span> {game.publisher || "Unknown"}
                  </h3>
                  <h3>
                    <span>Developer</span> {game.developer || "Unknown"}
                  </h3>
                </div>
              </div>
            </div>
          </Atropos>
          <div className="game-images">
            <span className="separator"></span>
            <Atropos>
              <img
                src={`https://retroachievements.org${game.imageTitle}`}
                alt="Game Title Image"
              />
            </Atropos>
            <Atropos>
              <img
                src={`https://retroachievements.org${game.imageIngame}`}
                alt="In Game Image"
              />
            </Atropos>
          </div>
        </div>

        <div className="single-game-details">
          {/* <div className="buttons">
            <img
              src={`${resourcesPath}/assets/img/svg/achievements.svg`}
              alt="Achivements"
              data-name="achievements"
              //@ts-ignore
              onClick={({ target }) => setTab(target.dataset.name)}
            />
            <img
              src={`${resourcesPath}/assets/img/svg/leaderboard.svg`}
              alt="Leaderboard"
              data-name="leaderboard"
              //@ts-ignore
              onClick={({ target }) => setTab(target.dataset.name)}
            />
            <img
              src={`${resourcesPath}/assets/img/svg/comments.svg`}
              alt="Comments"
              data-name="comments"
              //@ts-ignore
              onClick={({ target }) => setTab(target.dataset.name)}
            />
          </div> */}
          <ul
            className={`single-game-achievements ${
              tab == "achievements" ? "active" : ""
            }`}
          >
            {Object.values(game.achievements)
              .sort((a, b) => {
                const percentageA =
                  game.numDistinctPlayersHardcore > 0
                    ? (a.numAwardedHardcore / game.numDistinctPlayersHardcore) *
                      100
                    : 0;
                const percentageB =
                  game.numDistinctPlayersHardcore > 0
                    ? (b.numAwardedHardcore / game.numDistinctPlayersHardcore) *
                      100
                    : 0;
                if (percentageB !== percentageA) {
                  return percentageB - percentageA;
                }
                return a.points - b.points;
              })
              .map((achievement, index) => (
                <div key={index}>
                  <motion.li
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 1.1 }}
                    style={
                      achievement.dateEarnedHardcore
                        ? {}
                        : { filter: "saturate(0) brightness(0.5)" }
                    }
                  >
                    <img
                      src={`https://retroachievements.org/Badge/${achievement.badgeName}.png`}
                      alt={achievement.badgeName}
                      onMouseEnter={(e) => handleMouseEnter(e, achievement)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  </motion.li>
                  {achievement.points >= 25 && (
                    <video
                      src={`${resourcesPath}/assets/video/achievement.webm`}
                      className="achievement-border"
                      autoPlay
                      loop
                      style={
                        achievement.points >= 75
                          ? { filter: "hue-rotate(10deg) saturate(150%)" }
                          : achievement.points >= 50
                          ? { filter: "hue-rotate(60deg) saturate(300%)" }
                          : { filter: "hue-rotate(210deg) saturate(250%)" }
                      }
                    />
                  )}
                </div>
              ))}
          </ul>
        </div>
      </div>
      <div className="single-game-footer">
        <Atropos>
          {systems
            .filter((system) => system.altTitle === game.consoleName)
            .map((system) => (
              <div
                className="single-game-system"
                style={{
                  background: `url(${resourcesPath}/assets/img/webp/background/${system.name}.webp) center center`,
                  backgroundSize: "cover",
                }}
              >
                <div className="wrapper">
                  <video
                    src={`${resourcesPath}/assets/video/${system.name}.webm`}
                    autoPlay
                    loop
                    muted
                    disablePictureInPicture
                    data-atropos-offset="-5"
                  ></video>
                  <img
                    key={system.name}
                    src={`${resourcesPath}/assets/img/webp/logo/${system.name}-logo.webp`}
                    alt={`${system.name} logo`}
                    data-atropos-offset="5"
                  />
                </div>
              </div>
            ))}
          {systems.filter((system) => system.altTitle === game.consoleName)
            .length === 0 && (
            <div
              className="single-game-system"
              style={{
                backgroundColor: "black",
              }}
            >
              <div className="wrapper">
                <img
                  key="Standalone"
                  src={`${resourcesPath}/assets/img/webp/logo/standalone.webp`}
                  alt="Standalone Logo"
                  data-atropos-offset="5"
                />
                <p>
                  Unkown system: <span>{game.consoleName}</span>
                </p>
              </div>
            </div>
          )}
        </Atropos>

        <div className="user-game-progress">
          <img
            src={`https://retroachievements.org${summary?.userPic}`}
            alt={summary?.user}
          />
          <div>
            <h1>
              <span>{summary?.user}</span>'s progress
            </h1>
            <div className="progress-marks">
              <div
                className={`mastered ${
                  game.highestAwardKind == "mastered" ? "active" : ""
                }`}
              >
                <span></span>
                <p>Mastered</p>
              </div>
              <div
                className={`completed ${
                  game.highestAwardKind == "completed" ? "active" : ""
                }`}
              >
                <span></span>
                <p>Completed</p>
              </div>
              <div
                className={`beaten ${
                  game.highestAwardKind == "beaten-hardcore" ? "active" : ""
                }`}
              >
                <span></span>
                <p>Beaten</p>
              </div>
              <div
                className={`beaten-softcore ${
                  game.highestAwardKind == "beaten-softcore" ? "active" : ""
                }`}
              >
                <span></span>
                <p>Softcore Beaten</p>
              </div>
            </div>
            <div className="progress">
              <div className="progress-bar">
                <div
                  className="progress-bar-filled"
                  style={{
                    width: `${
                      (game.numAwardedToUserHardcore / game.numAchievements) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="unlock-rate">
                <span>{game.numAwardedToUserHardcore}</span> out of{" "}
                <span>{game.numAchievements}</span> achievements unlocked
              </p>
            </div>
          </div>
        </div>
      </div>
      {renderTooltip()}
    </motion.div>
  );
};

export default SingleGameScreen;
