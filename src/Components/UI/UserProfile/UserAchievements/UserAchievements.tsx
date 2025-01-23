import { useEffect, useRef, useState } from "react";
import "./UserAchievements.css";
import { motion } from "framer-motion";
import { DatedUserAchievement } from "@retroachievements/api";
import { BarLoader } from "react-spinners";

type TooltipTypes = {
  visible: boolean;
  x: number;
  y: number;
  content: DatedUserAchievement | null;
};

const UserAchievements = ({
  achievements,
  loading,
}: {
  achievements: DatedUserAchievement[] | null;
  loading: boolean;
}) => {
  let resourcesPath = window.ipcRenderer.sendSync("get-resources-path");
  resourcesPath = resourcesPath.replace(/\\/g, "/");

  const [tooltip, setTooltip] = useState<TooltipTypes>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  const [fade, setFade] = useState(false);
  const fadeOutTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fadeInTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = (
    event: React.MouseEvent<HTMLImageElement>,
    achievement: DatedUserAchievement
  ) => {
    setTooltip({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      content: achievement,
    });
    fadeInTimeoutRef.current = setTimeout(() => {
      setFade(true);
    }, 20);
    if (fadeOutTimeoutRef.current) {
      clearTimeout(fadeOutTimeoutRef.current);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLImageElement>) => {
    setTooltip((prevTooltip) => ({
      ...prevTooltip,
      x: event.clientX,
      y: event.clientY,
    }));
  };

  const handleMouseLeave = () => {
    setFade(false);
    fadeOutTimeoutRef.current = setTimeout(() => {
      setTooltip({
        visible: false,
        x: 0,
        y: 0,
        content: null,
      });
    }, 200);
    if (fadeInTimeoutRef.current) {
      clearTimeout(fadeInTimeoutRef.current);
    }
  };

  useEffect(() => {
    return () => {
      if (fadeOutTimeoutRef.current) {
        clearTimeout(fadeOutTimeoutRef.current);
      }
      if (fadeInTimeoutRef.current) {
        clearTimeout(fadeInTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="recent-achievements">
      <h2>Recent Achievements</h2>
      <div className="achievements">
        {loading ? (
          <BarLoader
            color="#ffffff"
            loading={true}
            aria-label="Loading Spinner"
            data-testid="loader"
          />
        ) : achievements && achievements.length > 0 ? (
          achievements
            .slice(-36)
            .reverse()
            .map((achievement, index) => (
              <div className="achievement" key={index}>
                <div>
                  <motion.div
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 1.1 }}
                  >
                    <img
                      src={`https://retroachievements.org${achievement.badgeUrl}`}
                      onMouseEnter={(e) => handleMouseEnter(e, achievement)}
                      onMouseMove={handleMouseMove}
                      onMouseLeave={handleMouseLeave}
                    />
                  </motion.div>
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
              </div>
            ))
        ) : (
          <p className="no-recent">No achievements in the last month.</p>
        )}
        {tooltip && tooltip.visible && tooltip.content && (
          <div
            className={`tooltip ${fade ? "fade-in" : "fade-out"}`}
            style={{
              top: tooltip.y + 15,
              left: tooltip.x + 15,
              ...(tooltip.content.points >= 75
                ? {
                    border: "1px solid #ff0000",
                    boxShadow: "0 0 10px #ff0000",
                  }
                : tooltip.content.points >= 50
                ? {
                    border: "1px solid rgb(255, 70, 9)",
                    boxShadow: "0 0 10px rgb(255, 70, 9)",
                  }
                : tooltip.content.points >= 25
                ? {
                    border: "1px solid #00abff",
                    boxShadow: "0 0 10px #00abff",
                  }
                : {}),
            }}
          >
            <strong>{tooltip.content.title}</strong>
            <p>{tooltip.content.points}</p>
            <p>{tooltip.content.description}</p>
            <p>{tooltip.content.gameTitle}</p>
            <p>{tooltip.content.consoleName}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserAchievements;
