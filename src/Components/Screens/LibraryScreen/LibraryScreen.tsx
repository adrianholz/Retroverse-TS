import { useContext, useEffect } from "react";
import "./LibraryScreen.css";
import SystemContext from "../../../SystemContext";
import System from "../../UI/System/System";
import { motion } from "framer-motion";
// @ts-ignore
import setupCarousel from "../../../Scripts/systemCarousel.js";
import { Link, useNavigate } from "react-router-dom";
import LibraryContext from "../../../LibraryContext.js";

const LibraryScreen = () => {
  const { systems, currentActiveSystems } = useContext(SystemContext)!;
  const { carousel } = useContext(LibraryContext)!;

  const navigate = useNavigate();

  useEffect(() => {
    setupCarousel(carousel, systems.length);
  }, [carousel, systems.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="track-container"
    >
      {currentActiveSystems && currentActiveSystems.length > 0 ? (
        <div className="library-screen-before"></div>
      ) : null}
      <div className="library-screen">
        {currentActiveSystems && currentActiveSystems.length > 0 ? (
          <div
            className="track"
            data-mouse-down-at="0"
            data-prev-percentage="0"
          >
            {currentActiveSystems.map((system) => (
              <System
                key={system.name}
                name={system.name}
                onClick={() => navigate(`/systems/${system.name}`)}
              />
            ))}
          </div>
        ) : (
          <div className="no-systems">
            <h1>No systems active</h1>
            <h2>
              Activate systems in the <Link to={"/settings"}>settings</Link>{" "}
              screen.
            </h2>
          </div>
        )}
      </div>
      {currentActiveSystems && currentActiveSystems.length > 0 ? (
        <div className="library-screen-after"></div>
      ) : null}
    </motion.div>
  );
};

export default LibraryScreen;
