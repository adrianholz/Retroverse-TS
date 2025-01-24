import { useContext } from "react";
import "./LibraryScreen.css";
import SystemContext from "../../../SystemContext";
import System from "../../UI/System/System";
import { motion } from "framer-motion";

const LibraryScreen = () => {
  const { systems } = useContext(SystemContext)!;

  return (
    <div className="track-container">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="library-screen"
      >
        <div className="track">
          {systems.slice(0, 5).map((system) => (
            <System name={system.name} />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default LibraryScreen;
