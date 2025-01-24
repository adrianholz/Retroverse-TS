import { useContext, useEffect } from "react";
import "./LibraryScreen.css";
import SystemContext from "../../../SystemContext";
import System from "../../UI/System/System";
import { motion } from "framer-motion";
// @ts-ignore
import setupCarousel from "../../../Scripts/systemCarousel.js";
import { useNavigate } from "react-router-dom";
import LibraryContext from "../../../LibraryContext.js";

const LibraryScreen = () => {
  const { systems } = useContext(SystemContext)!;
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
      <div className="library-screen-before"></div>
      <div className="library-screen">
        <div className="track" data-mouse-down-at="0" data-prev-percentage="0">
          {systems.slice(0, 10).map((system) => (
            <System
              name={system.name}
              onClick={() => navigate(`/systems/${system.name}`)}
            />
          ))}
        </div>
      </div>
      <div className="library-screen-after"></div>
    </motion.div>
  );
};

export default LibraryScreen;
